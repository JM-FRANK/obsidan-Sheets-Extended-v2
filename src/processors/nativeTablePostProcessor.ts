import { MarkdownRenderChild, type MarkdownPostProcessorContext } from 'obsidian';
import { detectEnhancedTable } from '../detect/detectEnhancedTable';
import { detectEnhancedMarkdownTableSource, isMarkdownTableLine, isMarkdownTableSeparatorLine } from '../editor/detectEnhancedMarkdownSource';
import { readRenderedTable } from '../input/readRenderedTable';
import { readRenderedTableWithSourceHints } from '../input/readRenderedTableWithSourceHints';
import { resolveSpans } from '../model/resolveSpans';
import { resolveStyles } from '../model/resolveStyles';
import { resolveVerticalHeaders } from '../model/resolveVerticalHeaders';
import { renderEnhancedTable } from '../render/renderEnhancedTable';
import type SheetsExtendedPlugin from '../main';

export function nativeTablePostProcessor(
	plugin: SheetsExtendedPlugin,
	element: HTMLElement,
	context: MarkdownPostProcessorContext,
): void {
	if (!plugin.settings.enhanceNativeMarkdownTables || isDisabledByFrontmatter(plugin, context.sourcePath)) {
		return;
	}

	for (const [tableIndex, table] of Array.from(element.querySelectorAll('table')).entries()) {
		if (table.hasClass('sheets-extended-table')) {
			continue;
		}

		const source = getTableSource(context, table, tableIndex);

		if (source) {
			if (!detectEnhancedMarkdownTableSource(source)) {
				continue;
			}

			context.addChild(new NativeTableRenderChild(plugin, table, context.sourcePath, source));
			continue;
		}

		if (plugin.settings.enableDebugLogging) {
			console.debug(`${plugin.manifest.name}: source unavailable, escape-aware detection skipped`);
		}

		if (!detectEnhancedTable(table)) {
			continue;
		}

		context.addChild(new NativeTableRenderChild(plugin, table, context.sourcePath, null));
	}
}

class NativeTableRenderChild extends MarkdownRenderChild {
	constructor(
		private readonly plugin: SheetsExtendedPlugin,
		private readonly table: HTMLTableElement,
		private readonly sourcePath: string,
		private readonly source: string | null,
	) {
		super(table);
	}

	onload(): void {
		void this.render();
	}

	private async render(): Promise<void> {
		try {
			const model = this.source
				? readRenderedTableWithSourceHints(this.table, this.source, () => {
					if (this.plugin.settings.enableDebugLogging) {
						console.debug(`${this.plugin.manifest.name}: source / DOM dimension mismatch, falling back to DOM table hints`);
					}
				})
				: readRenderedTable(this.table);
			resolveSpans(model);
			resolveVerticalHeaders(model);
			resolveStyles(model, this.plugin.settings.enableInlineStyles);

			const newTable = await renderEnhancedTable(model, {
				app: this.plugin.app,
				sourcePath: this.sourcePath,
				component: this,
				enableInlineStyles: this.plugin.settings.enableInlineStyles,
				useMarkdownRenderer: false,
			});

			this.table.replaceWith(newTable);
		} catch (error) {
			if (this.plugin.settings.enableDebugLogging) {
				console.warn(`${this.plugin.manifest.name}: native table enhancement failed`, error);
			}
		}
	}
}

function getTableSource(
	context: MarkdownPostProcessorContext,
	table: HTMLTableElement,
	tableIndex: number,
): string | null {
	const sectionInfo = context.getSectionInfo(table);

	if (!sectionInfo) {
		return null;
	}

	const tableBlocks = extractMarkdownTableBlocks(sectionInfo.text);
	return tableBlocks[tableIndex] ?? tableBlocks[0] ?? null;
}

function extractMarkdownTableBlocks(source: string): string[] {
	const lines = source.split(/\r?\n/);
	const blocks: string[] = [];
	let lineIndex = 0;

	while (lineIndex < lines.length) {
		if (!isMarkdownTableLine(lines[lineIndex]?.trim() ?? '')) {
			lineIndex += 1;
			continue;
		}

		const startIndex = lineIndex;

		while (lineIndex < lines.length && isMarkdownTableLine(lines[lineIndex]?.trim() ?? '')) {
			lineIndex += 1;
		}

		const blockLines = lines.slice(startIndex, lineIndex);

		if (blockLines.some((line) => isMarkdownTableSeparatorLine(line.trim()))) {
			blocks.push(blockLines.join('\n'));
		}
	}

	return blocks;
}

function isDisabledByFrontmatter(plugin: SheetsExtendedPlugin, sourcePath: string): boolean {
	const cache = plugin.app.metadataCache.getCache(sourcePath);
	const frontmatter = cache?.frontmatter;
	const value: unknown = frontmatter?.['disable-sheet'];

	return value === true || value === 'true';
}
