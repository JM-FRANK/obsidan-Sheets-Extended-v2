import { createCell } from '../model/CellModel';
import { createSheetModel, type SheetModel } from '../model/SheetModel';

export function readRenderedTable(table: HTMLTableElement): SheetModel {
	const rows = Array.from(table.rows).map((row, rowIndex) =>
		Array.from(row.cells).map((cell, colIndex) =>
			createCell({
				row: rowIndex,
				col: colIndex,
				text: cell.textContent?.trim() ?? '',
				tag: cell.tagName.toLowerCase() === 'th' ? 'th' : 'td',
				source: {
					type: 'dom',
					element: cell,
				},
				classNames: Array.from(cell.classList),
				inlineStyle: cell.getAttribute('style') ?? '',
				align: cell.getAttribute('align') ?? cell.style.textAlign,
				mergeMarker: parseDomMergeMarker(cell.textContent?.trim() ?? ''),
			}),
		),
	);

	return createSheetModel({
		rows,
		tableClassNames: Array.from(table.classList),
		tableInlineStyle: {},
		metadata: { classes: {} },
	});
}

function parseDomMergeMarker(text: string): '<' | '^' | null {
	if (text === '<' || text === '^') {
		return text;
	}

	return null;
}
