import { App, PluginSettingTab, Setting } from 'obsidian';
import SheetsExtendedPlugin from './main';

export interface SheetsExtendedSettings {
	enableDebugLogging: boolean;
}

export const DEFAULT_SETTINGS: SheetsExtendedSettings = {
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
