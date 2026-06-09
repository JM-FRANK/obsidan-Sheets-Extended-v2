import { createCell } from '../model/CellModel';
import { createSheetModel, type SheetModel } from '../model/SheetModel';
import type { SheetMetadata } from '../types';
import { parseStyleDirective } from './parseStyleDirective';
import { splitMarkdownTableRow } from './splitMarkdownTableRow';

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

	const separatorLine = lines[separatorIndex] ?? '';
	const tableStyle = parseTableStyle(separatorLine);
	const separatorCells = splitMarkdownTableRow(separatorLine);
	const columnAlignments = separatorCells.map(parseColumnAlignment);
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
				align: columnAlignments[colIndex] ?? '',
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

export function parseColumnAlignment(separatorCell: string): string {
	const clean = parseStyleDirective(separatorCell).cleanContent.trim();

	if (!/^:?-+:?$/.test(clean)) {
		return '';
	}

	const left = clean.startsWith(':');
	const right = clean.endsWith(':');

	if (left && right) {
		return 'center';
	}

	if (right) {
		return 'right';
	}

	if (left) {
		return 'left';
	}

	return '';
}

function isSeparatorLine(line: string): boolean {
	const cells = splitMarkdownTableRow(line);

	return cells.length > 0 && cells.every((cell) => {
		const clean = parseStyleDirective(cell).cleanContent.trim();
		return /^:?-+:?$/.test(clean);
	});
}
