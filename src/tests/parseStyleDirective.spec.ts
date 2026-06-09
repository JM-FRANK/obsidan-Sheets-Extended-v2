import { describe, expect, it } from 'vitest';
import { parseStyleDirective } from '../parser/parseStyleDirective';

describe('parseStyleDirective', () => {
	it('returns unchanged content when no directive exists', () => {
		expect(parseStyleDirective('plain content')).toEqual({
			cleanContent: 'plain content',
			classNames: [],
			inlineStyle: {},
			hasDirective: false,
		});
	});

	it('parses classes and inline styles', () => {
		expect(parseStyleDirective('foo ~ .red .strong { color: "red", font-weight: "700" }')).toEqual({
			cleanContent: 'foo',
			classNames: ['red', 'strong'],
			inlineStyle: {
				color: 'red',
				'font-weight': '700',
			},
			hasDirective: true,
		});
	});
});

