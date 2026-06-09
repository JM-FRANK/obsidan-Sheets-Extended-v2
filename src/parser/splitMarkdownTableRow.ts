export function splitMarkdownTableRow(line: string): string[] {
	const trimmed = line.replace(/^\|/, '').replace(/\|$/, '');
	const cells: string[] = [];
	let current = '';

	for (let index = 0; index < trimmed.length; index += 1) {
		const char = trimmed[index];
		const next = trimmed[index + 1];

		if (char === '\\' && next === '|') {
			current += '\\|';
			index += 1;
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
