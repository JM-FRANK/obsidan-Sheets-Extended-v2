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
});

