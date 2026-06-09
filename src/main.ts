import { Plugin } from 'obsidian';
import { nativeTablePostProcessor } from './processors/nativeTablePostProcessor';
import { sheetCodeBlockProcessor } from './processors/sheetCodeBlockProcessor';
import { DEFAULT_SETTINGS, SheetsExtendedSettingTab } from './settings';
import type { SheetsExtendedSettings } from './types';

export default class SheetsExtendedPlugin extends Plugin {
	settings!: SheetsExtendedSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new SheetsExtendedSettingTab(this.app, this));
		this.registerMarkdownPostProcessor((element, context) => nativeTablePostProcessor(this, element, context));
		this.registerMarkdownCodeBlockProcessor('sheet', (source, element, context) =>
			sheetCodeBlockProcessor(this, source, element, context),
		);
	}

	onunload(): void {
		if (this.settings.enableDebugLogging) {
			console.debug(`${this.manifest.name}: unloaded`);
		}
	}

	async loadSettings(): Promise<void> {
		const savedData = (await this.loadData()) as Partial<SheetsExtendedSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
