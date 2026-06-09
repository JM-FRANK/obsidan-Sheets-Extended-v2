import { App, PluginSettingTab, Setting } from 'obsidian';
import SheetsExtendedPlugin from './main';
import type { SheetsExtendedSettings } from './types';

export const DEFAULT_SETTINGS: SheetsExtendedSettings = {
	enhanceNativeMarkdownTables: true,
	enableInlineStyles: true,
	processSheetCodeBlocks: true,
	enableDebugLogging: false,
};

export class SheetsExtendedSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: SheetsExtendedPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('p', {
			text: 'Configure plugin options.',
			cls: 'sheets-extended-settings-description',
		});

		new Setting(containerEl)
			.setName('Enhance native Markdown tables')
			.setDesc('Only tables containing sheets extended syntax are enhanced.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enhanceNativeMarkdownTables)
					.onChange(async (value) => {
						this.plugin.settings.enhanceNativeMarkdownTables = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Enable inline styles')
			.setDesc('Allow style directives such as content ~ { color: "red" }.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableInlineStyles)
					.onChange(async (value) => {
						this.plugin.settings.enableInlineStyles = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Process sheet code blocks')
			.setDesc('Render fenced sheet code blocks with the enhanced table renderer.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.processSheetCodeBlocks)
					.onChange(async (value) => {
						this.plugin.settings.processSheetCodeBlocks = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Debug logging')
			.setDesc('Write development diagnostics to the developer console.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableDebugLogging)
					.onChange(async (value) => {
						this.plugin.settings.enableDebugLogging = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
