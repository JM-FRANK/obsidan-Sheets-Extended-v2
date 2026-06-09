import { describe, expect, it } from 'vitest';
import { createCell } from '../model/CellModel';
import { createSheetModel } from '../model/SheetModel';
import { resolveSpans } from '../model/resolveSpans';

describe('resolveSpans', () => {
	it('resolves continuous horizontal merge markers', () => {
		const model = createSheetModel({
			rows: [
				row(['A', 'B', 'C', 'D'], 0),
				row(['foo', '<', '<', 'bar'], 1),
			],
		});

		resolveSpans(model);

		expect(model.rows[1]?.[0]?.colspan).toBe(3);
		expect(model.rows[1]?.[1]?.hidden).toBe(true);
		expect(model.rows[1]?.[2]?.hidden).toBe(true);
		expect(model.rows[1]?.[3]?.colspan).toBe(1);
	});

	it('resolves vertical markers into the visible cell above', () => {
		const model = createSheetModel({
			rows: [
				row(['A', 'B'], 0),
				row(['foo', 'bar'], 1),
				row(['^', 'baz'], 2),
			],
		});

		resolveSpans(model);

		expect(model.rows[1]?.[0]?.rowspan).toBe(2);
		expect(model.rows[2]?.[0]?.hidden).toBe(true);
	});

	it('resolves mixed horizontal and vertical merges once per row', () => {
		const model = createSheetModel({
			rows: [
				row(['A', 'B', 'C'], 0),
				row(['foo', '<', 'bar'], 1),
				row(['^', '^', 'baz'], 2),
			],
		});

		resolveSpans(model);

		expect(model.rows[1]?.[0]?.colspan).toBe(2);
		expect(model.rows[1]?.[0]?.rowspan).toBe(2);
		expect(model.rows[2]?.[0]?.hidden).toBe(true);
		expect(model.rows[2]?.[1]?.hidden).toBe(true);
	});

	it('throws when a horizontal marker has no left cell', () => {
		const model = createSheetModel({
			rows: [row(['<', 'A'], 0)],
		});

		expect(() => resolveSpans(model)).toThrow('Horizontal merge marker has no cell to its left.');
	});

	it('does not merge escaped marker text without explicit merge markers', () => {
		const model = createSheetModel({
			rows: [
				row(['A', 'B'], 0),
				row(['foo', '\\<'], 1),
				row(['bar', '\\^'], 2),
			],
		});
		model.rows[1]![1]!.mergeMarker = null;
		model.rows[2]![1]!.mergeMarker = null;

		resolveSpans(model);

		expect(model.rows[1]?.[0]?.colspan).toBe(1);
		expect(model.rows[1]?.[1]?.hidden).toBe(false);
		expect(model.rows[2]?.[1]?.hidden).toBe(false);
	});
});

function row(values: string[], rowIndex: number) {
	return values.map((value, colIndex) =>
		createCell({
			row: rowIndex,
			col: colIndex,
			text: value,
			mergeMarker: value === '<' || value === '^' ? value : null,
			source: {
				type: 'markdown',
				content: value,
			},
		}),
	);
}
