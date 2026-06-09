import { parseSheetMarkdownTable } from '../parser/parseSheetMarkdownTable';
import type { SheetModel } from '../model/SheetModel';
import type { SheetCell } from '../model/CellModel';
import { readRenderedTable } from './readRenderedTable';

export function readRenderedTableWithSourceHints(
	table: HTMLTableElement,
	source: string,
	onDimensionMismatch?: () => void,
): SheetModel {
	const domModel = readRenderedTable(table);
	const sourceModel = parseSheetMarkdownTable(source, { classes: {} });

	if (!hasMatchingDimensions(domModel, sourceModel)) {
		onDimensionMismatch?.();
		return domModel;
	}

	for (const [rowIndex, row] of domModel.rows.entries()) {
		const sourceRow = sourceModel.rows[rowIndex];

		for (const [colIndex, cell] of row.entries()) {
			const sourceCell = sourceRow?.[colIndex];

			applySourceMergeHint(cell, sourceCell);
			cell.align = sourceCell?.align ?? cell.align;
			cell.verticalHeaderDelimiter = sourceCell?.verticalHeaderDelimiter ?? null;
		}
	}

	domModel.tableClassNames = Array.from(new Set([...domModel.tableClassNames, ...sourceModel.tableClassNames]));
	domModel.tableInlineStyle = sourceModel.tableInlineStyle;
	domModel.metadata = sourceModel.metadata;

	return domModel;
}

function hasMatchingDimensions(domModel: SheetModel, sourceModel: SheetModel): boolean {
	if (domModel.rows.length !== sourceModel.rows.length) {
		return false;
	}

	return domModel.rows.every((row, rowIndex) => row.length === sourceModel.rows[rowIndex]?.length);
}

function applySourceMergeHint(cell: SheetCell, sourceCell: SheetCell | undefined): void {
	if (!sourceCell) {
		return;
	}

	const sourceText = sourceCell.source.type === 'markdown'
		? sourceCell.source.content.trim()
		: sourceCell.text.trim();

	if (sourceText === '<') {
		cell.mergeMarker = '<';
		return;
	}

	if (sourceText === '^') {
		cell.mergeMarker = '^';
		return;
	}

	if (sourceText === '\\<' || sourceText === '\\^' || sourceText === '\\>') {
		cell.mergeMarker = null;
	}
}
