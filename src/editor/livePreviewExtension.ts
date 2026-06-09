import {
	Prec,
	RangeSetBuilder,
	StateEffect,
	StateField,
	type EditorState,
	type Extension,
	type Transaction,
} from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';
import { Component, editorInfoField, editorLivePreviewField } from 'obsidian';
import { parseSheetBlock } from '../input/parseSheetBlock';
import { resolveSpans } from '../model/resolveSpans';
import { resolveStyles } from '../model/resolveStyles';
import { resolveVerticalHeaders } from '../model/resolveVerticalHeaders';
import { parseSheetMarkdownTable } from '../parser/parseSheetMarkdownTable';
import { renderEnhancedTable } from '../render/renderEnhancedTable';
import type SheetsExtendedPlugin from '../main';
import type { EnhancedEditorBlock } from './findEnhancedBlocks';
import { findEnhancedBlocks } from './findEnhancedBlocks';

const MAX_WIDGET_CACHE_SIZE = 64;
const renderedWidgetCache = new Map<string, HTMLElement>();

export const rebuildSheetsExtendedLivePreviewEffect = StateEffect.define<void>();

export function createLivePreviewExtension(plugin: SheetsExtendedPlugin): Extension {
	const field = StateField.define<DecorationSet>({
		create: (state) => buildDecorations(state, plugin),
		update: (decorations, transaction) => {
			if (shouldRebuild(transaction)) {
				return buildDecorations(transaction.state, plugin);
			}

			return decorations.map(transaction.changes);
		},
		provide: (field) => EditorView.decorations.from(field),
	});

	return Prec.highest(field);
}

function shouldRebuild(transaction: Transaction): boolean {
	return transaction.docChanged
		|| Boolean(transaction.selection)
		|| livePreviewStateChanged(transaction)
		|| transaction.effects.some((effect) => effect.is(rebuildSheetsExtendedLivePreviewEffect));
}

function livePreviewStateChanged(transaction: Transaction): boolean {
	const before = transaction.startState.field(editorLivePreviewField, false);
	const after = transaction.state.field(editorLivePreviewField, false);

	return before !== after;
}

function buildDecorations(state: EditorState, plugin: SheetsExtendedPlugin): DecorationSet {
	if (!state.field(editorLivePreviewField, false)) {
		return Decoration.none;
	}

	const builder = new RangeSetBuilder<Decoration>();
	const sourcePath = getSourcePath(state);
	const blocks = findEnhancedBlocks(state.doc, {
		includeMarkdownTables: plugin.settings.enhanceNativeMarkdownTables && !isDisabledByFrontmatter(state),
		includeSheetCodeBlocks: plugin.settings.processSheetCodeBlocks,
	});

	for (const block of blocks) {
		if (selectionIntersectsBlock(state, block)) {
			continue;
		}

		builder.add(
			block.from,
			block.to,
			Decoration.replace({
				block: true,
				widget: new EnhancedTableWidget(plugin, block, sourcePath),
			}),
		);
	}

	return builder.finish();
}

function selectionIntersectsBlock(state: EditorState, block: EnhancedEditorBlock): boolean {
	return state.selection.ranges.some((range) => {
		if (range.empty) {
			return range.from >= block.from && range.from <= block.to;
		}

		return range.from < block.to && range.to > block.from;
	});
}

function getSourcePath(state: EditorState): string {
	return state.field(editorInfoField, false)?.file?.path ?? '';
}

function isDisabledByFrontmatter(state: EditorState): boolean {
	const text = state.doc.sliceString(0, Math.min(state.doc.length, 4096));
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);

	return match?.[1]?.split(/\r?\n/).some((line) => /^disable-sheet\s*:\s*true\s*$/i.test(line.trim())) ?? false;
}

class EnhancedTableWidget extends WidgetType {
	private readonly key: string;
	private component: Component | null = null;

	constructor(
		private readonly plugin: SheetsExtendedPlugin,
		private readonly block: EnhancedEditorBlock,
		private readonly sourcePath: string,
	) {
		super();
		this.key = createWidgetKey(plugin, block, sourcePath);
	}

	eq(other: WidgetType): boolean {
		return other instanceof EnhancedTableWidget && other.key === this.key;
	}

	toDOM(view: EditorView): HTMLElement {
		const container = createDiv({
			cls: 'sheets-extended-live-preview markdown-rendered',
		});

		container.addEventListener('click', (event) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			view.dispatch({
				selection: {
					anchor: this.block.from,
				},
				scrollIntoView: true,
			});
			view.focus();
		});

		const cachedDom = renderedWidgetCache.get(this.key);

		if (cachedDom) {
			container.appendChild(cachedDom.cloneNode(true));
			dispatchSheetsExtendedRenderedEvent(container, {
				table: container.querySelector('table'),
				tableWrapper: container.querySelector('.table-wrapper'),
				source: this.block.source,
				sourcePath: this.sourcePath,
				blockType: this.block.type,
			});
			return container;
		}

		this.component = new Component();
		this.component.load();
		void this.render(container, this.component);
		return container;
	}

	ignoreEvent(): boolean {
		return true;
	}

	destroy(): void {
		this.component?.unload();
		this.component = null;
	}

	private async render(container: HTMLElement, component: Component): Promise<void> {
		try {
			const model = this.block.type === 'sheet-code-block'
				? parseSheetBlock(this.block.source)
				: parseSheetMarkdownTable(this.block.source, { classes: {} });

			resolveSpans(model);
			resolveVerticalHeaders(model);
			resolveStyles(model, this.plugin.settings.enableInlineStyles);

			const table = await renderEnhancedTable(model, {
				app: this.plugin.app,
				sourcePath: this.sourcePath,
				component,
				enableInlineStyles: this.plugin.settings.enableInlineStyles,
				useMarkdownRenderer: true,
			});

			if (this.component !== component) {
				return;
			}

			container.empty();
			const tableWrapper = container.createDiv({
				cls: 'table-wrapper',
			});
			tableWrapper.appendChild(table);
			cacheRenderedWidget(this.key, tableWrapper);
			dispatchSheetsExtendedRenderedEvent(container, {
				table,
				tableWrapper,
				source: this.block.source,
				sourcePath: this.sourcePath,
				blockType: this.block.type,
			});
		} catch (error) {
			if (this.plugin.settings.enableDebugLogging) {
				console.warn(`${this.plugin.manifest.name}: live preview enhancement failed`, error);
			}

			container.empty();
			container.createEl('pre', {
				text: this.block.source,
			});
		}
	}
}

function dispatchSheetsExtendedRenderedEvent(
	root: HTMLElement,
	detail: {
		table: Element | null;
		tableWrapper: Element | null;
		source: string;
		sourcePath: string;
		blockType: string;
	},
): void {
	queueMicrotask(() => {
		root.dispatchEvent(new CustomEvent('sheets-extended:live-preview-rendered', {
			bubbles: true,
			detail: {
				root,
				...detail,
			},
		}));
	});
}

function createWidgetKey(plugin: SheetsExtendedPlugin, block: EnhancedEditorBlock, sourcePath: string): string {
	return JSON.stringify({
		type: block.type,
		source: block.source,
		sourcePath,
		enableInlineStyles: plugin.settings.enableInlineStyles,
	});
}

function cacheRenderedWidget(key: string, element: HTMLElement): void {
	const cachedTable = element.cloneNode(true);

	if (cachedTable.instanceOf(HTMLElement)) {
		renderedWidgetCache.set(key, cachedTable);
	}

	if (renderedWidgetCache.size <= MAX_WIDGET_CACHE_SIZE) {
		return;
	}

	const firstKey = renderedWidgetCache.keys().next().value;

	if (firstKey) {
		renderedWidgetCache.delete(firstKey);
	}
}
