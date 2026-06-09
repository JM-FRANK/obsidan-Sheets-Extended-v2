import { describe, expect, it } from 'vitest';
import { readRenderedTableWithSourceHints } from '../input/readRenderedTableWithSourceHints';
import { resolveSpans } from '../model/resolveSpans';

describe('readRenderedTableWithSourceHints', () => {
	it('keeps rendered DOM content while applying source merge and alignment hints', () => {
		const table = fakeTable([
			['格助词', '用法', '例'],
			['に', '時間', '森さんは７時に起きます。'],
			['^', '存在的场所', '部屋に机があります。'],
			['^', '行为的对象', 'わたしは小野さんにお土産をあげます。'],
		]);
		const model = readRenderedTableWithSourceHints(table, [
			'| 格助词 | 用法 | 例 |',
			'| :---: | :---: | :--- |',
			'| に | 时间 | {森\\|もり}さんは７時に起きます。 |',
			'| ^ | 存在的场所 | {部屋\\|へや}に机があります。 |',
			'| ^ | 行为的对象 | わたしは{小野\\|おの}さんにお土産をあげます。 |',
		].join('\n'));

		resolveSpans(model);

		expect(model.rows[1]?.[0]?.rowspan).toBe(3);
		expect(model.rows[2]?.[0]?.hidden).toBe(true);
		expect(model.rows[3]?.[0]?.hidden).toBe(true);
		expect(model.rows[1]?.[2]?.source.type).toBe('dom');
		expect(model.rows[1]?.[2]?.text).toBe('森さんは７時に起きます。');
		expect(model.rows[0]?.[0]?.align).toBe('center');
		expect(model.rows[0]?.[1]?.align).toBe('center');
		expect(model.rows[0]?.[2]?.align).toBe('left');
	});

	it('falls back to DOM-only data when source and DOM dimensions differ', () => {
		let mismatchLogged = false;
		const table = fakeTable([
			['A', 'B'],
			['foo', 'bar'],
		]);
		const model = readRenderedTableWithSourceHints(table, [
			'| A | B | C |',
			'| :---: | :---: | :---: |',
			'| foo | < | baz |',
		].join('\n'), () => {
			mismatchLogged = true;
		});

		expect(mismatchLogged).toBe(true);
		expect(model.rows[0]?.[0]?.align).toBe('');
		expect(model.rows[1]?.[1]?.mergeMarker).toBeNull();
		expect(model.rows[1]?.[1]?.text).toBe('bar');
	});
});

function fakeTable(rows: string[][]): HTMLTableElement {
	return {
		rows: rows.map((row, rowIndex) => ({
			cells: row.map((text) => fakeCell(text, rowIndex === 0 ? 'TH' : 'TD')),
		})),
		classList: [],
	} as unknown as HTMLTableElement;
}

function fakeCell(text: string, tagName: string): HTMLTableCellElement {
	return {
		textContent: text,
		tagName,
		classList: [],
		style: {
			textAlign: '',
		},
		getAttribute: () => null,
	} as unknown as HTMLTableCellElement;
}
