import { createCell } from '../model/CellModel';
import { createSheetModel, type SheetModel } from '../model/SheetModel';
import type { SheetMetadata } from '../types';
import { parseStyleDirective } from './parseStyleDirective';

export function parseSheetMarkdownTable(
	source: string,
	metadata: SheetMetadata,
): SheetModel {
	const lines = source
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length < 2) {
		throw new Error('Sheet block must contain a Markdown table.');
	}

	const separatorIndex = lines.findIndex(isSeparatorLine);

	if (separatorIndex <= 0) {
		throw new Error('Markdown table separator row is missing.');
	}

	const tableStyle = parseTableStyle(lines[separatorIndex] ?? '');
	const tableRows = [
		...lines.slice(0, separatorIndex),
		...lines.slice(separatorIndex + 1),
	].map(splitMarkdownTableRow);

	const width = Math.max(...tableRows.map((row) => row.length));
	const rows = tableRows.map((row, rowIndex) =>
		Array.from({ length: width }, (_, colIndex) => {
			const content = row[colIndex]?.trim() ?? '';

			return createCell({
				row: rowIndex,
				col: colIndex,
				text: content,
				tag: rowIndex === 0 ? 'th' : 'td',
				source: {
					type: 'markdown',
					content,
				},
			});
		}),
	);

	return createSheetModel({
		rows,
		tableClassNames: tableStyle.classNames,
		tableInlineStyle: tableStyle.inlineStyle,
		metadata,
	});
}

function parseTableStyle(separatorLine: string): { classNames: string[]; inlineStyle: Record<string, string> } {
	const style = parseStyleDirective(separatorLine);

	return {
		classNames: style.classNames,
		inlineStyle: style.inlineStyle,
	};
}

function splitMarkdownTableRow(line: string): string[] {
	const trimmed = line.replace(/^\|/, '').replace(/\|$/, '');
	const cells: string[] = [];
	let current = '';
	let escaping = false;

	for (const char of trimmed) {
		if (escaping) {
			current += char;
			escaping = false;
			continue;
		}

		if (char === '\\') {
			escaping = true;
			continue;
		}

		if (char === '|') {
			cells.push(current.trim());
			current = '';
			continue;
		}

		current += char;
	}

	cells.push(current.trim());
	return cells;
}

function isSeparatorLine(line: string): boolean {
	const cells = splitMarkdownTableRow(line);

	return cells.length > 0 && cells.every((cell) => {
		const clean = parseStyleDirective(cell).cleanContent.trim();
		return /^:?-{3,}:?$/.test(clean);
	});
}

