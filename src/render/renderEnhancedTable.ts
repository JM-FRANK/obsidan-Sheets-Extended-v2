import type { SheetCell } from '../model/CellModel';
import type { SheetModel } from '../model/SheetModel';
import type { RenderContext } from '../types';
import { renderSheetCellMarkdown } from './renderSheetCellMarkdown';

export async function renderEnhancedTable(model: SheetModel, context: RenderContext): Promise<HTMLTableElement> {
	const table = createEl('table');

	for (const className of model.tableClassNames) {
		table.addClass(className);
	}

	table.addClass('sheets-extended-table');
	applyStyleObject(table, model.tableInlineStyle, context.enableInlineStyles);

	for (const row of model.rows) {
		const rowEl = table.createEl('tr');

		for (const cell of row) {
			if (cell.hidden) {
				continue;
			}

			const cellEl = rowEl.createEl(cell.renderAsHeader ? 'th' : cell.tag);
			await renderCell(cell, cellEl, context);
		}
	}

	return table;
}

async function renderCell(cell: SheetCell, cellEl: HTMLTableCellElement, context: RenderContext): Promise<void> {
	if (cell.colspan > 1) {
		cellEl.colSpan = cell.colspan;
	}

	if (cell.rowspan > 1) {
		cellEl.rowSpan = cell.rowspan;
	}

	for (const className of cell.classNames) {
		cellEl.addClass(className);
	}

	for (const className of cell.resolvedStyle.classNames) {
		cellEl.addClass(className);
	}

	if (cell.inlineStyle.length > 0) {
		cellEl.setAttribute('style', cell.inlineStyle);
	}

	applyStyleObject(cellEl, cell.resolvedStyle.inlineStyle, context.enableInlineStyles);

	if (cell.align.length > 0) {
		cellEl.style.textAlign = cell.align;
	}

	if (cell.source.type === 'markdown') {
		await renderSheetCellMarkdown(cell.text, cellEl, context);
		return;
	}

	const originalText = cell.source.element.textContent?.trim() ?? '';

	if (cell.text !== originalText) {
		cellEl.setText(cell.text);
		return;
	}

	for (const child of Array.from(cell.source.element.childNodes)) {
		cellEl.appendChild(child.cloneNode(true));
	}
}

function applyStyleObject(
	element: HTMLElement,
	styles: Record<string, string>,
	enableInlineStyles: boolean,
): void {
	if (!enableInlineStyles) {
		return;
	}

	for (const [property, value] of Object.entries(styles)) {
		element.style.setProperty(property, value);
	}
}
