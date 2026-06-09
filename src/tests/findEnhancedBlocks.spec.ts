import { Text } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { findEnhancedBlocks } from '../editor/findEnhancedBlocks';

describe('findEnhancedBlocks', () => {
	it('ignores ordinary Markdown tables', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'| A | B |',
			'| --- | --- |',
			'| foo | bar |',
		]), {
			includeMarkdownTables: true,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toEqual([]);
	});

	it('detects enhanced Markdown tables', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'| A | B | C |',
			'| --- | --- | --- |',
			'| foo | < | bar |',
		]), {
			includeMarkdownTables: true,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toHaveLength(1);
		expect(blocks[0]?.type).toBe('markdown-table');
	});

	it('detects enhanced Markdown tables with alignment separators', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'| A | B | C | D |',
			'| :--- | :---: | ---: | --- |',
			'| foo | < | bar | baz |',
			'| 1 | 2 | 3 | 4 |',
		]), {
			includeMarkdownTables: true,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toHaveLength(1);
		expect(blocks[0]?.type).toBe('markdown-table');
	});

	it('ignores tables that only contain escaped merge markers', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'| A | B | C |',
			'| --- | --- | --- |',
			'| literal less | \\< | normal |',
			'| literal greater | \\> | normal |',
			'| literal caret | \\^ | normal |',
		]), {
			includeMarkdownTables: true,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toEqual([]);
	});

	it('preserves escaped markers when detecting real merge markers', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'| A | B | C | D |',
			'| --- | --- | --- | --- |',
			'| foo | < | literal caret \\^ | literal less \\< |',
			'| 1 | 2 | 3 | 4 |',
		]), {
			includeMarkdownTables: true,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toHaveLength(1);
		expect(blocks[0]?.type).toBe('markdown-table');
	});

	it('detects sheet code blocks when enabled', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'```sheet',
			'| A | B |',
			'| --- | --- |',
			'| foo | bar |',
			'```',
		]), {
			includeMarkdownTables: true,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toHaveLength(1);
		expect(blocks[0]?.type).toBe('sheet-code-block');
	});

	it('can skip Markdown tables independently of sheet code blocks', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'| A | B |',
			'| --- | --- |',
			'| foo | < |',
			'',
			'```sheet',
			'| A | B |',
			'| --- | --- |',
			'| foo | bar |',
			'```',
		]), {
			includeMarkdownTables: false,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toHaveLength(1);
		expect(blocks[0]?.type).toBe('sheet-code-block');
	});

	it('detects enhanced Markdown tables inside blockquotes with normalized source', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'> [!example]+ Table',
			'>',
			'> | A | B |',
			'> | --- | --- |',
			'> | foo | < |',
		]), {
			includeMarkdownTables: true,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toHaveLength(1);
		expect(blocks[0]?.type).toBe('markdown-table');
		expect(blocks[0]?.source).toBe('| A | B |\n| --- | --- |\n| foo | < |');
	});

	it('detects sheet code blocks inside blockquotes with normalized source', () => {
		const blocks = findEnhancedBlocks(Text.of([
			'> ```sheet',
			'> | A | B |',
			'> | --- | --- |',
			'> | foo | bar |',
			'> ```',
		]), {
			includeMarkdownTables: true,
			includeSheetCodeBlocks: true,
		});

		expect(blocks).toHaveLength(1);
		expect(blocks[0]?.type).toBe('sheet-code-block');
		expect(blocks[0]?.source).toBe('| A | B |\n| --- | --- |\n| foo | bar |');
	});
});
