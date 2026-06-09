import { parseSheetMarkdownTable } from '../parser/parseSheetMarkdownTable';
import type { SheetModel } from '../model/SheetModel';
import { readRenderedTable } from './readRenderedTable';

export function readRenderedTableWithSourceHints(table: HTMLTableElement, source: string): SheetModel {
	const domModel = readRenderedTable(table);
	const sourceModel = parseSheetMarkdownTable(source, { classes: {} });

	for (const [rowIndex, row] of domModel.rows.entries()) {
		const sourceRow = sourceModel.rows[rowIndex];

		for (const [colIndex, cell] of row.entries()) {
			const sourceCell = sourceRow?.[colIndex];

			cell.mergeMarker = sourceCell?.mergeMarker ?? null;
			cell.align = sourceCell?.align ?? cell.align;
			cell.verticalHeaderDelimiter = sourceCell?.verticalHeaderDelimiter ?? null;
		}
	}

	domModel.tableClassNames = Array.from(new Set([...domModel.tableClassNames, ...sourceModel.tableClassNames]));
	domModel.tableInlineStyle = sourceModel.tableInlineStyle;
	domModel.metadata = sourceModel.metadata;

	return domModel;
}
