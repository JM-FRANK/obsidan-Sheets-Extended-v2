import { describe, expect, it } from 'vitest';
import { parseSheetMarkdownTable } from '../parser/parseSheetMarkdownTable';
import { resolveSpans } from '../model/resolveSpans';

describe('parseSheetMarkdownTable', () => {
	it('parses column alignment from Markdown separator cells', () => {
		const model = parseSheetMarkdownTable([
			'| A | B | C | D |',
			'| :--- | :---: | ---: | --- |',
			'| foo | < | bar | baz |',
			'| 1 | 2 | 3 | 4 |',
		].join('\n'), { classes: {} });

		expect(model.rows[0]?.[0]?.align).toBe('left');
		expect(model.rows[0]?.[1]?.align).toBe('center');
		expect(model.rows[0]?.[2]?.align).toBe('right');
		expect(model.rows[0]?.[3]?.align).toBe('');
		expect(model.rows[1]?.[0]?.align).toBe('left');
		expect(model.rows[1]?.[1]?.align).toBe('center');
		expect(model.rows[1]?.[2]?.align).toBe('right');
		expect(model.rows[1]?.[3]?.align).toBe('');

		resolveSpans(model);

		expect(model.rows[1]?.[0]?.colspan).toBe(2);
		expect(model.rows[1]?.[1]?.hidden).toBe(true);
	});

	it('accepts short Markdown separator forms', () => {
		const model = parseSheetMarkdownTable([
			'| A | B | C | D |',
			'| :- | :-: | -: | - |',
			'| foo | < | bar | baz |',
		].join('\n'), { classes: {} });

		expect(model.rows[0]?.[0]?.align).toBe('left');
		expect(model.rows[0]?.[1]?.align).toBe('center');
		expect(model.rows[0]?.[2]?.align).toBe('right');
		expect(model.rows[0]?.[3]?.align).toBe('');
	});

	it('preserves escaped merge markers and still resolves real merge markers', () => {
		const model = parseSheetMarkdownTable([
			'| A | B | C | D |',
			'| --- | --- | --- | --- |',
			'| foo | < | literal caret \\^ | literal less \\< |',
			'| 1 | 2 | 3 | 4 |',
		].join('\n'), { classes: {} });

		expect(model.rows[1]?.[2]?.text).toBe('literal caret \\^');
		expect(model.rows[1]?.[3]?.text).toBe('literal less \\<');
		expect(model.rows[1]?.[1]?.mergeMarker).toBe('<');
		expect(model.rows[1]?.[2]?.mergeMarker).toBeNull();
		expect(model.rows[1]?.[3]?.mergeMarker).toBeNull();

		resolveSpans(model);

		expect(model.rows[1]?.[0]?.colspan).toBe(2);
		expect(model.rows[1]?.[1]?.hidden).toBe(true);
		expect(model.rows[1]?.[2]?.hidden).toBe(false);
		expect(model.rows[1]?.[3]?.hidden).toBe(false);
	});

	it('keeps escaped pipes in a single cell without unescaping escaped markers', () => {
		const model = parseSheetMarkdownTable([
			'| A | B |',
			'| --- | --- |',
			'| a\\|b | \\< |',
		].join('\n'), { classes: {} });

		expect(model.rows[1]?.[0]?.text).toBe('a|b');
		expect(model.rows[1]?.[1]?.text).toBe('\\<');
		expect(model.rows[1]?.[1]?.mergeMarker).toBeNull();
		expect(model.rows[1]).toHaveLength(2);

		resolveSpans(model);

		expect(model.rows[1]?.[1]?.hidden).toBe(false);
	});

	it('keeps Ruby Notes and wiki link pipe syntax in one cell', () => {
		const model = parseSheetMarkdownTable([
			'| 格助词 | 用法 | 例 | Link |',
			'| :---: | :---: | :--- | --- |',
			'| に | 时间 | {森\\|もり}さんは７時に起きます。 | [[path\\|alias]] |',
			'| ^ | 存在的场所 | {部屋\\|へや}に机があります。 | ok |',
		].join('\n'), { classes: {} });

		expect(model.rows[1]).toHaveLength(4);
		expect(model.rows[1]?.[2]?.text).toBe('{森|もり}さんは７時に起きます。');
		expect(model.rows[1]?.[3]?.text).toBe('[[path|alias]]');
		expect(model.rows[2]?.[0]?.mergeMarker).toBe('^');
		expect(model.rows[0]?.[0]?.align).toBe('center');
		expect(model.rows[0]?.[1]?.align).toBe('center');
		expect(model.rows[0]?.[2]?.align).toBe('left');
	});
});
