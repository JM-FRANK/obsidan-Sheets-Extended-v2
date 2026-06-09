import { parseStyleDirective } from '../parser/parseStyleDirective';
import type { SheetModel } from './SheetModel';

export function resolveStyles(model: SheetModel, enableInlineStyles: boolean): SheetModel {
	for (const row of model.rows) {
		for (const cell of row) {
			const directive = parseStyleDirective(cell.text);
			cell.text = directive.cleanContent.trim();
			cell.resolvedStyle.classNames = directive.classNames;
			cell.resolvedStyle.inlineStyle = enableInlineStyles ? resolveInlineStyle(model, directive.classNames, directive.inlineStyle) : {};
		}
	}

	if (!enableInlineStyles) {
		model.tableInlineStyle = {};
	}

	return model;
}

function resolveInlineStyle(
	model: SheetModel,
	classNames: string[],
	inlineStyle: Record<string, string>,
): Record<string, string> {
	const resolved: Record<string, string> = {};

	for (const className of classNames) {
		Object.assign(resolved, model.metadata.classes[className] ?? {});
	}

	Object.assign(resolved, inlineStyle);
	return resolved;
}

