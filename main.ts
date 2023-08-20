import {
	App,
	MarkdownPostProcessorContext, MarkdownRenderChild,
	Plugin,
	PluginSettingTab,
	Setting
} from 'obsidian';
import {Main} from "./src/main";

interface FrontmatterKanbanSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: FrontmatterKanbanSettings = {
	mySetting: 'default'
}

export default class FrontmatterKanban extends Plugin {
	settings: FrontmatterKanbanSettings;

	async onload() {
		await this.loadSettings();
		// DataviewJS codeblocks.
		this.registerPriorityCodeblockPostProcessor(
			"fk", //this.settings.dataviewJsKeyword TODO make configurable
			-100,
			async (source: string, el, ctx) => ctx.addChild(new Main(el, this.app, source))
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** Register a markdown codeblock post processor with the given priority. */
	public registerPriorityCodeblockPostProcessor(
		language: string,
		priority: number,
		processor: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => Promise<void>
	) {
		let registered = this.registerMarkdownCodeBlockProcessor(language, processor);
		registered.sortOrder = priority;
	}

}

class SampleSettingTab extends PluginSettingTab {
	plugin: FrontmatterKanban;

	constructor(app: App, plugin: FrontmatterKanban) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
