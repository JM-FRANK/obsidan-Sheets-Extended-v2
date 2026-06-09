import { parseSheetMetadata } from '../parser/parseSheetMetadata';
import { parseSheetMarkdownTable } from '../parser/parseSheetMarkdownTable';
import type { SheetModel } from '../model/SheetModel';

export function parseSheetBlock(source: string): SheetModel {
	const { metadataSource, tableSource } = splitSheetBlock(source);
	const metadata = parseSheetMetadata(metadataSource);

	return parseSheetMarkdownTable(tableSource, metadata);
}

function splitSheetBlock(source: string): { metadataSource: string; tableSource: string } {
	const lines = source.split(/\r?\n/);
	const delimiterIndex = lines.findIndex((line) => line.trim() === '---');

	if (delimiterIndex < 0) {
		return {
			metadataSource: '',
			tableSource: source,
		};
	}

	return {
		metadataSource: lines.slice(0, delimiterIndex).join('\n'),
		tableSource: lines.slice(delimiterIndex + 1).join('\n'),
	};
}

