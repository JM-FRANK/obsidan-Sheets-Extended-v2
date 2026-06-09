import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SheetsExtendedSettingTab, type SheetsExtendedSettings } from './settings';

export default class SheetsExtendedPlugin extends Plugin {
	settings!: SheetsExtendedSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new SheetsExtendedSettingTab(this.app, this));

		this.addCommand({
			id: 'show-plugin-status',
			name: 'Show plugin status',
			callback: () => {
				new Notice(`${this.manifest.name} is ready.`);
			},
		});

		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				if (this.settings.enableDebugLogging) {
					console.debug(`${this.manifest.name}: workspace layout changed`);
				}
			}),
		);

		this.app.workspace.onLayoutReady(() => {
			if (this.settings.enableDebugLogging) {
				console.debug(`${this.manifest.name}: layout ready`);
			}
		});
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
