import type { StyleDirective } from '../types';

const CLASS_NAME_PATTERN = /^[A-Za-z_][\w-]*$/;

export function parseStyleDirective(input: string): StyleDirective {
	const markerIndex = input.lastIndexOf('~');

	if (markerIndex < 0) {
		return {
			cleanContent: input,
			classNames: [],
			inlineStyle: {},
			hasDirective: false,
		};
	}

	const cleanContent = input.slice(0, markerIndex).trimEnd();
	const directive = input.slice(markerIndex + 1).trim();
	const classNames = [...directive.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1] ?? '');
	const inlineStyle = parseInlineStyleObject(directive);

	if (classNames.length === 0 && Object.keys(inlineStyle).length === 0) {
		return {
			cleanContent: input,
			classNames: [],
			inlineStyle: {},
			hasDirective: false,
		};
	}

	for (const className of classNames) {
		if (!CLASS_NAME_PATTERN.test(className)) {
			throw new Error(`Invalid class name: ${className}`);
		}
	}

	return {
		cleanContent,
		classNames,
		inlineStyle,
		hasDirective: true,
	};
}

function parseInlineStyleObject(input: string): Record<string, string> {
	const openIndex = input.indexOf('{');
	const closeIndex = input.lastIndexOf('}');

	if (openIndex < 0 && closeIndex < 0) {
		return {};
	}

	if (openIndex < 0 || closeIndex <= openIndex) {
		throw new Error('Invalid inline style directive.');
	}

	const body = input.slice(openIndex + 1, closeIndex).trim();

	if (body.length === 0) {
		return {};
	}

	const styles: Record<string, string> = {};

	for (const part of splitTopLevel(body, ',')) {
		const pair = part.trim();

		if (pair.length === 0) {
			continue;
		}

		const colonIndex = pair.indexOf(':');

		if (colonIndex <= 0) {
			throw new Error(`Invalid inline style entry: ${pair}`);
		}

		const key = pair.slice(0, colonIndex).trim().replace(/^['"]|['"]$/g, '');
		const rawValue = pair.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');

		if (!/^[A-Za-z-]+$/.test(key)) {
			throw new Error(`Invalid CSS property: ${key}`);
		}

		styles[key] = rawValue;
	}

	return styles;
}

export function splitTopLevel(input: string, delimiter: string): string[] {
	const parts: string[] = [];
	let current = '';
	let quote: '"' | "'" | null = null;
	let depth = 0;

	for (const char of input) {
		if (quote) {
			current += char;

			if (char === quote) {
				quote = null;
			}

			continue;
		}

		if (char === '"' || char === "'") {
			quote = char;
			current += char;
			continue;
		}

		if (char === '{' || char === '[' || char === '(') {
			depth += 1;
		}

		if (char === '}' || char === ']' || char === ')') {
			depth -= 1;
		}

		if (char === delimiter && depth === 0) {
			parts.push(current);
			current = '';
			continue;
		}

		current += char;
	}

	parts.push(current);
	return parts;
}

