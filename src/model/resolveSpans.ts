import type { SheetModel } from './SheetModel';
import type { SheetCell } from './CellModel';

export function resolveSpans(model: SheetModel): SheetModel {
	resolveHorizontalSpans(model.rows);
	resolveVerticalSpans(model.rows);
	return model;
}

function resolveHorizontalSpans(rows: SheetCell[][]): void {
	for (const row of rows) {
		let target: SheetCell | null = null;

		for (const cell of row) {
			if (cell.mergeMarker === '<') {
				if (!target) {
					throw new Error('Horizontal merge marker has no cell to its left.');
				}

				target.colspan += 1;
				cell.hidden = true;
				cell.isMergeMarker = true;
				continue;
			}

			target = cell.hidden ? target : cell;
		}
	}
}

function resolveVerticalSpans(rows: SheetCell[][]): void {
	for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
		const row = rows[rowIndex] ?? [];
		const rowTargets = new Set<SheetCell>();

		for (const cell of row) {
			if (cell.mergeMarker !== '^') {
				continue;
			}

			const target = findVerticalTarget(rows, rowIndex, cell.col);

			if (!target) {
				throw new Error('Vertical merge marker has no visible cell above it.');
			}

			cell.hidden = true;
			cell.isMergeMarker = true;
			rowTargets.add(target);
		}

		for (const target of rowTargets) {
			target.rowspan += 1;
		}
	}
}

function findVerticalTarget(rows: SheetCell[][], rowIndex: number, colIndex: number): SheetCell | null {
	for (let previousRowIndex = rowIndex - 1; previousRowIndex >= 0; previousRowIndex -= 1) {
		for (const candidate of rows[previousRowIndex] ?? []) {
			if (candidate.hidden) {
				continue;
			}

			const coversColumn = colIndex >= candidate.col && colIndex < candidate.col + candidate.colspan;
			const touchesRow = candidate.row + candidate.rowspan === rowIndex;

			if (coversColumn && touchesRow) {
				return candidate;
			}
		}
	}

	return null;
}
