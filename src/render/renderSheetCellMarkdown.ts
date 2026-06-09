import { MarkdownRenderer } from 'obsidian';
import type { RenderContext } from '../types';

export async function renderSheetCellMarkdown(
	markdown: string,
	containerEl: HTMLElement,
	context: RenderContext,
): Promise<void> {
	await MarkdownRenderer.render(
		context.app,
		markdown,
		containerEl,
		context.sourcePath,
		context.component,
	);
}

