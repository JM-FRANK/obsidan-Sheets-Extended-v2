import type { Text } from '@codemirror/state';
import { detectEnhancedMarkdownTableSource, isMarkdownTableLine, isMarkdownTableSeparatorLine } from './detectEnhancedMarkdownSource';

export type EnhancedEditorBlockType = 'markdown-table' | 'sheet-code-block';

export interface EnhancedEditorBlock {
	type: EnhancedEditorBlockType;
	from: number;
	to: number;
	source: string;
}

export function findEnhancedBlocks(
	doc: Text,
	options: {
		includeMarkdownTables: boolean;
		includeSheetCodeBlocks: boolean;
	},
): EnhancedEditorBlock[] {
	const blocks: EnhancedEditorBlock[] = [];
	let lineNumber = 1;

	while (lineNumber <= doc.lines) {
		const line = doc.line(lineNumber);
		const text = stripQuotePrefix(line.text).trim();

		if (options.includeSheetCodeBlocks && isSheetFenceStart(text)) {
			const block = readSheetCodeBlock(doc, lineNumber);

			if (block) {
				blocks.push(block);
				lineNumber = doc.lineAt(block.to).number + 1;
				continue;
			}
		}

		if (options.includeMarkdownTables && isMarkdownTableLine(text)) {
			const block = readMarkdownTableBlock(doc, lineNumber);

			if (block && detectEnhancedMarkdownTableSource(block.source)) {
				blocks.push(block);
				lineNumber = doc.lineAt(block.to).number + 1;
				continue;
			}
		}

		lineNumber += 1;
	}

	return blocks;
}

function readSheetCodeBlock(doc: Text, startLineNumber: number): EnhancedEditorBlock | null {
	const startLine = doc.line(startLineNumber);

	for (let lineNumber = startLineNumber + 1; lineNumber <= doc.lines; lineNumber += 1) {
		const line = doc.line(lineNumber);
		const text = stripQuotePrefix(line.text).trim();

		if (text.startsWith('```')) {
			return {
				type: 'sheet-code-block',
				from: startLine.from,
				to: line.to,
				source: readNormalizedLines(doc, startLineNumber + 1, lineNumber - 1),
			};
		}
	}

	return null;
}

function readMarkdownTableBlock(doc: Text, startLineNumber: number): EnhancedEditorBlock | null {
	let endLineNumber = startLineNumber;

	while (endLineNumber <= doc.lines && isMarkdownTableLine(stripQuotePrefix(doc.line(endLineNumber).text).trim())) {
		endLineNumber += 1;
	}

	const from = doc.line(startLineNumber).from;
	const to = doc.line(endLineNumber - 1).to;
	const source = readNormalizedLines(doc, startLineNumber, endLineNumber - 1);
	const lines = source.split(/\r?\n/).map((line) => line.trim());

	if (lines.length < 2 || !lines.some(isMarkdownTableSeparatorLine)) {
		return null;
	}

	return {
		type: 'markdown-table',
		from,
		to,
		source,
	};
}

function isSheetFenceStart(text: string): boolean {
	return /^```\s*sheet(?:\s|$)/.test(text);
}

function readNormalizedLines(doc: Text, fromLineNumber: number, toLineNumber: number): string {
	const lines: string[] = [];

	for (let lineNumber = fromLineNumber; lineNumber <= toLineNumber; lineNumber += 1) {
		lines.push(stripQuotePrefix(doc.line(lineNumber).text));
	}

	return lines.join('\n');
}

function stripQuotePrefix(line: string): string {
	let stripped = line;

	while (/^\s*> ?/.test(stripped)) {
		stripped = stripped.replace(/^\s*> ?/, '');
	}

	return stripped;
}
