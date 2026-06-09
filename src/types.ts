import type { App, Component } from 'obsidian';

export interface SheetsExtendedSettings {
	enhanceNativeMarkdownTables: boolean;
	enableInlineStyles: boolean;
	processSheetCodeBlocks: boolean;
	enableDebugLogging: boolean;
}

export interface StyleDirective {
	cleanContent: string;
	classNames: string[];
	inlineStyle: Record<string, string>;
	hasDirective: boolean;
}

export interface SheetMetadata {
	classes: Record<string, Record<string, string>>;
}

export interface RenderContext {
	app: App;
	sourcePath: string;
	component: Component;
	enableInlineStyles: boolean;
	useMarkdownRenderer: boolean;
}
