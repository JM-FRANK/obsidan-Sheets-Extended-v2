import { MarkdownRenderChild, type MarkdownPostProcessorContext } from 'obsidian';
import { parseSheetBlock } from '../input/parseSheetBlock';
import { resolveSpans } from '../model/resolveSpans';
import { resolveStyles } from '../model/resolveStyles';
import { resolveVerticalHeaders } from '../model/resolveVerticalHeaders';
import { renderEnhancedTable } from '../render/renderEnhancedTable';
import type SheetsExtendedPlugin from '../main';

export function sheetCodeBlockProcessor(
	plugin: SheetsExtendedPlugin,
	source: string,
	element: HTMLElement,
	context: MarkdownPostProcessorContext,
): void {
	context.addChild(new SheetCodeBlockRenderChild(plugin, source, element, context));
}

class SheetCodeBlockRenderChild extends MarkdownRenderChild {
	constructor(
		private readonly plugin: SheetsExtendedPlugin,
		private readonly source: string,
		private readonly element: HTMLElement,
		private readonly context: MarkdownPostProcessorContext,
	) {
		super(element);
	}

	onload(): void {
		void this.render();
	}

	private async render(): Promise<void> {
		if (!this.plugin.settings.processSheetCodeBlocks) {
			this.renderDisabledSource();
			return;
		}

		try {
			const model = parseSheetBlock(this.source);
			resolveSpans(model);
			resolveVerticalHeaders(model);
			resolveStyles(model, this.plugin.settings.enableInlineStyles);

			const table = await renderEnhancedTable(model, {
				app: this.plugin.app,
				sourcePath: this.context.sourcePath,
				component: this,
				enableInlineStyles: this.plugin.settings.enableInlineStyles,
				useMarkdownRenderer: true,
			});

			this.element.empty();
			this.element.appendChild(table);
		} catch (error) {
			this.renderError(error);
		}
	}

	private renderDisabledSource(): void {
		this.element.empty();
		this.element.createEl('pre', {
			text: this.source,
		});
	}

	private renderError(error: unknown): void {
		this.element.empty();
		this.element.addClass('sheets-extended-error');
		this.element.createEl('strong', {
			text: 'Sheets extended could not render this sheet block.',
		});
		this.element.createEl('pre', {
			text: error instanceof Error ? error.message : String(error),
		});
	}
}
