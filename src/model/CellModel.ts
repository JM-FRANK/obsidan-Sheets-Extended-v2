export type SheetCellTag = 'td' | 'th';

export type SheetCellSource =
	| {
			type: 'dom';
			element: HTMLTableCellElement;
	  }
	| {
			type: 'markdown';
			content: string;
	  };

export interface SheetCellStyle {
	classNames: string[];
	inlineStyle: Record<string, string>;
}

export interface SheetCell {
	row: number;
	col: number;
	text: string;
	tag: SheetCellTag;
	source: SheetCellSource;
	classNames: string[];
	inlineStyle: string;
	align: string;
	colspan: number;
	rowspan: number;
	hidden: boolean;
	isMergeMarker: boolean;
	renderAsHeader: boolean;
	resolvedStyle: SheetCellStyle;
}

export function createCell(params: {
	row: number;
	col: number;
	text: string;
	tag?: SheetCellTag;
	source: SheetCellSource;
	classNames?: string[];
	inlineStyle?: string;
	align?: string;
}): SheetCell {
	return {
		row: params.row,
		col: params.col,
		text: params.text,
		tag: params.tag ?? 'td',
		source: params.source,
		classNames: params.classNames ?? [],
		inlineStyle: params.inlineStyle ?? '',
		align: params.align ?? '',
		colspan: 1,
		rowspan: 1,
		hidden: false,
		isMergeMarker: false,
		renderAsHeader: params.tag === 'th',
		resolvedStyle: {
			classNames: [],
			inlineStyle: {},
		},
	};
}

