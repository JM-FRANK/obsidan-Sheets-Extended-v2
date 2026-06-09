import type { SheetMetadata } from '../types';
import type { SheetCell } from './CellModel';

export interface SheetModel {
	rows: SheetCell[][];
	tableClassNames: string[];
	tableInlineStyle: Record<string, string>;
	metadata: SheetMetadata;
}

export function createSheetModel(params: {
	rows: SheetCell[][];
	tableClassNames?: string[];
	tableInlineStyle?: Record<string, string>;
	metadata?: Partial<SheetMetadata>;
}): SheetModel {
	return {
		rows: params.rows,
		tableClassNames: params.tableClassNames ?? [],
		tableInlineStyle: params.tableInlineStyle ?? {},
		metadata: {
			classes: params.metadata?.classes ?? {},
		},
	};
}

