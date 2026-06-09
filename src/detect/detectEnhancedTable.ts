import { isVerticalHeaderDelimiter } from '../model/resolveVerticalHeaders';

export function detectEnhancedTable(table: HTMLTableElement): boolean {
	const rows = Array.from(table.rows).map((row) => Array.from(row.cells));

	if (rows.length === 0) {
		return false;
	}

	for (const row of rows) {
		for (const cell of row) {
			const text = cell.textContent?.trim() ?? '';

			if (text === '<' || text === '^' || /~\s*(\.|{)/.test(text)) {
				return true;
			}
		}
	}

	const width = Math.max(...rows.map((row) => row.length));

	for (let colIndex = 0; colIndex < width; colIndex += 1) {
		if (rows.every((row) => isVerticalHeaderDelimiter(row[colIndex]?.textContent?.trim() ?? ''))) {
			return true;
		}
	}

	return false;
}

