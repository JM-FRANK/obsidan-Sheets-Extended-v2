import type { SheetModel } from './SheetModel';

export function resolveVerticalHeaders(model: SheetModel): SheetModel {
	const delimiterColumns = getVerticalHeaderDelimiterColumns(model);

	for (const delimiterColumn of delimiterColumns) {
		for (const row of model.rows) {
			const delimiterCell = row[delimiterColumn];

			if (delimiterCell) {
				delimiterCell.hidden = true;
			}

			for (const cell of row) {
				if (!cell.hidden && cell.col < delimiterColumn) {
					cell.renderAsHeader = true;
				}
			}
		}
	}

	return model;
}

export function getVerticalHeaderDelimiterColumns(model: SheetModel): number[] {
	const width = Math.max(0, ...model.rows.map((row) => row.length));
	const columns: number[] = [];

	for (let colIndex = 0; colIndex < width; colIndex += 1) {
		const cells = model.rows.map((row) => row[colIndex]);

		if (cells.length > 0 && cells.every((cell) => cell && isVerticalHeaderDelimiter(cell.text.trim()))) {
			columns.push(colIndex);
		}
	}

	return columns;
}

export function isVerticalHeaderDelimiter(input: string): boolean {
	return /^-{1,3}(?:\s*~\s*(?:\.[A-Za-z_][\w-]*\s*)*(?:\{.*\})?)?$/.test(input.trim());
}

