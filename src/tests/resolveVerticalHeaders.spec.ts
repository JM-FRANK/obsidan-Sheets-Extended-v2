import { describe, expect, it } from 'vitest';
import { createCell } from '../model/CellModel';
import { createSheetModel } from '../model/SheetModel';
import { getVerticalHeaderDelimiterColumns, resolveVerticalHeaders } from '../model/resolveVerticalHeaders';

describe('resolveVerticalHeaders', () => {
	it('detects an explicit delimiter column', () => {
		const model = createSheetModel({
			rows: [
				row(['Group', '-', 'Item', 'Value'], 0),
				row(['G1', '-', 'A', '1'], 1),
				row(['G2', '-', 'B', '2'], 2),
			],
		});

		expect(getVerticalHeaderDelimiterColumns(model)).toEqual([1]);
	});

	it('hides delimiter columns and renders the left side as row headers', () => {
		const model = createSheetModel({
			rows: [
				row(['Group', '-', 'Item', 'Value'], 0),
				row(['G1', '-', 'A', '1'], 1),
				row(['G2', '-', 'B', '2'], 2),
			],
		});

		resolveVerticalHeaders(model);

		expect(model.rows[1]?.[1]?.hidden).toBe(true);
		expect(model.rows[1]?.[0]?.renderAsHeader).toBe(true);
		expect(model.rows[1]?.[2]?.renderAsHeader).toBe(false);
	});
});

function row(values: string[], rowIndex: number) {
	return values.map((value, colIndex) =>
		createCell({
			row: rowIndex,
			col: colIndex,
			text: value,
			source: {
				type: 'markdown',
				content: value,
			},
		}),
	);
}

