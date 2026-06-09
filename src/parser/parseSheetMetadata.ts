import type { SheetMetadata } from '../types';

export function parseSheetMetadata(source: string): SheetMetadata {
	const trimmed = stripComments(source).trim();

	if (trimmed.length === 0) {
		return { classes: {} };
	}

	const normalized = trimmed
		.replace(/([{,]\s*)([A-Za-z_][\w-]*)(\s*:)/g, '$1"$2"$3')
		.replace(/'/g, '"')
		.replace(/,\s*([}\]])/g, '$1');

	const parsed = JSON.parse(normalized) as unknown;

	if (!isObject(parsed)) {
		throw new Error('Sheet metadata must be an object.');
	}

	const classes = isObject(parsed.classes) ? parseClasses(parsed.classes) : {};

	return { classes };
}

function parseClasses(input: Record<string, unknown>): Record<string, Record<string, string>> {
	const classes: Record<string, Record<string, string>> = {};

	for (const [className, value] of Object.entries(input)) {
		if (!/^[A-Za-z_][\w-]*$/.test(className)) {
			throw new Error(`Invalid metadata class name: ${className}`);
		}

		if (!isObject(value)) {
			throw new Error(`Metadata class "${className}" must be an object.`);
		}

		classes[className] = {};

		for (const [property, propertyValue] of Object.entries(value)) {
			if (!/^[A-Za-z-]+$/.test(property)) {
				throw new Error(`Invalid CSS property in class "${className}": ${property}`);
			}

			classes[className][property] = String(propertyValue);
		}
	}

	return classes;
}

function stripComments(input: string): string {
	return input
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/(^|\s)\/\/.*$/gm, '$1');
}

function isObject(input: unknown): input is Record<string, unknown> {
	return typeof input === 'object' && input !== null && !Array.isArray(input);
}

