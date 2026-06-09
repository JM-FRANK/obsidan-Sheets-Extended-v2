import { RangeSetBuilder } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view';
import { Component, editorInfoField, editorLivePreviewField } from 'obsidian';
import { parseSheetBlock } from '../input/parseSheetBlock';
import { parseSheetMarkdownTable } from '../parser/parseSheetMarkdownTable';
import { resolveSpans } from '../model/resolveSpans';
import { resolveStyles } from '../model/resolveStyles';
import { resolveVerticalHeaders } from '../model/resolveVerticalHeaders';
import { renderEnhancedTable } from '../render/renderEnhancedTable';
import type SheetsExtendedPlugin from '../main';
import type { EnhancedEditorBlock } from './findEnhancedBlocks';
import { findEnhancedBlocks } from './findEnhancedBlocks';

export function createLivePreviewExtension(plugin: SheetsExtendedPlugin): Extension {
	return ViewPlugin.fromClass(
		class SheetsExtendedLivePreviewPlugin {
			decorations: DecorationSet;

			constructor(private readonly view: EditorView) {
				this.decorations = buildDecorations(view, plugin);
			}

			update(update: ViewUpdate): void {
				if (update.docChanged || update.selectionSet || update.viewportChanged) {
					this.decorations = buildDecorations(update.view, plugin);
				}
			}
		},
		{
			decorations: (value) => value.decorations,
		},
	);
}

function buildDecorations(view: EditorView, plugin: SheetsExtendedPlugin): DecorationSet {
	if (!view.state.field(editorLivePreviewField, false)) {
		return Decoration.none;
	}

	const builder = new RangeSetBuilder<Decoration>();
	const blocks = findEnhancedBlocks(view.state.doc, {
		includeMarkdownTables: plugin.settings.enhanceNativeMarkdownTables && !isDisabledByFrontmatter(view),
		includeSheetCodeBlocks: plugin.settings.processSheetCodeBlocks,
	});

	for (const block of blocks) {
		if (selectionIntersectsBlock(view, block)) {
			continue;
		}

		builder.add(
			block.from,
			block.to,
			Decoration.replace({
				block: true,
				widget: new EnhancedTableWidget(plugin, block, getSourcePath(view)),
			}),
		);
	}

	return builder.finish();
}

function selectionIntersectsBlock(view: EditorView, block: EnhancedEditorBlock): boolean {
	return view.state.selection.ranges.some((range) => {
		if (range.empty) {
			return range.from >= block.from && range.from <= block.to;
		}

		return range.from < block.to && range.to > block.from;
	});
}

function getSourcePath(view: EditorView): string {
	return view.state.field(editorInfoField, false)?.file?.path ?? '';
}

function isDisabledByFrontmatter(view: EditorView): boolean {
	const text = view.state.doc.sliceString(0, Math.min(view.state.doc.length, 4096));
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);

	return match?.[1]?.split(/\r?\n/).some((line) => /^disable-sheet\s*:\s*true\s*$/i.test(line.trim())) ?? false;
}

class EnhancedTableWidget extends WidgetType {
	private component: Component | null = null;

	constructor(
		private readonly plugin: SheetsExtendedPlugin,
		private readonly block: EnhancedEditorBlock,
		private readonly sourcePath: string,
	) {
		super();
	}

	eq(other: WidgetType): boolean {
		return other instanceof EnhancedTableWidget
			&& other.block.type === this.block.type
			&& other.block.source === this.block.source
			&& other.sourcePath === this.sourcePath
			&& other.plugin.settings.enableInlineStyles === this.plugin.settings.enableInlineStyles;
	}

	toDOM(): HTMLElement {
		const container = createDiv({
			cls: 'sheets-extended-live-preview',
		});
		this.component = new Component();
		this.component.load();
		void this.render(container, this.component);
		return container;
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

			container.empty();
			container.appendChild(table);
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
