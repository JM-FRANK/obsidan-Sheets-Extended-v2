import { MarkdownRenderChild, type MarkdownPostProcessorContext } from 'obsidian';
import { detectEnhancedTable } from '../detect/detectEnhancedTable';
import { readRenderedTable } from '../input/readRenderedTable';
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

	for (const table of Array.from(element.querySelectorAll('table'))) {
		if (table.hasClass('sheets-extended-table') || !detectEnhancedTable(table)) {
			continue;
		}

		context.addChild(new NativeTableRenderChild(plugin, table, context.sourcePath));
	}
}

class NativeTableRenderChild extends MarkdownRenderChild {
	constructor(
		private readonly plugin: SheetsExtendedPlugin,
		private readonly table: HTMLTableElement,
		private readonly sourcePath: string,
	) {
		super(table);
	}

	onload(): void {
		void this.render();
	}

	private async render(): Promise<void> {
		try {
			const model = readRenderedTable(this.table);
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

function isDisabledByFrontmatter(plugin: SheetsExtendedPlugin, sourcePath: string): boolean {
	const cache = plugin.app.metadataCache.getCache(sourcePath);
	const frontmatter = cache?.frontmatter;
	const value: unknown = frontmatter?.['disable-sheet'];

	return value === true || value === 'true';
}
