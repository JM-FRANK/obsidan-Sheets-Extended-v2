import { isVerticalHeaderDelimiter } from '../model/resolveVerticalHeaders';
import { parseStyleDirective } from '../parser/parseStyleDirective';

export function detectEnhancedMarkdownTableSource(source: string): boolean {
	const rows = source
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => isMarkdownTableLine(line))
		.map(splitMarkdownTableRow);

	if (rows.length === 0) {
		return false;
	}

	for (const row of rows) {
		for (const cell of row) {
			const text = cell.trim();

			if (text === '<' || text === '^' || /~\s*(\.|{)/.test(text)) {
				return true;
			}
		}
	}

	const width = Math.max(...rows.map((row) => row.length));

	for (let colIndex = 0; colIndex < width; colIndex += 1) {
		if (rows.every((row) => isVerticalHeaderDelimiter(row[colIndex]?.trim() ?? ''))) {
			return true;
		}
	}

	return false;
}

export function isMarkdownTableLine(line: string): boolean {
	return line.includes('|');
}

export function isMarkdownTableSeparatorLine(line: string): boolean {
	const cells = splitMarkdownTableRow(line);

	return cells.length > 0 && cells.every((cell) => {
		const clean = parseStyleDirective(cell).cleanContent.trim();
		return /^:?-+:?$/.test(clean);
	});
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
