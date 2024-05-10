import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// get/create dateOfNoteOfTheDayData from localStorage
		let dateOfNoteOfTheDayData = localStorage.getItem(
			"dateOfNoteOfTheDayData"
		);
		let noteOfTheDayDataRaw = localStorage.getItem("noteOfTheDayData");
		let noteOfTheDayData = {};
		if (noteOfTheDayDataRaw) {
			noteOfTheDayData = JSON.parse(noteOfTheDayDataRaw);
			console.info("Loaded note of the day data", noteOfTheDayData);
		}

		const currentDate = new Date().toISOString();
		if (dateOfNoteOfTheDayData !== currentDate) {
			console.info("New day, resetting note of the day data");
			dateOfNoteOfTheDayData = new Date().toISOString();
			localStorage.setItem(
				"dateOfNoteOfTheDayData",
				dateOfNoteOfTheDayData
			);
			noteOfTheDayData = {};
			localStorage.setItem("noteOfTheDayData", JSON.stringify({}));
		}

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-note-of-the-day",
			name: "Open note of the day",
			callback: () => {
				// if data is empty, return
				// otherwise open note with highest count
				if (Object.keys(noteOfTheDayData).length === 0) {
					new Notice("No notes modified today");
					return;
				}
				const noteOfTheDay = Object.keys(noteOfTheDayData).reduce(
					(a, b) =>
						noteOfTheDayData[a] > noteOfTheDayData[b] ? a : b
				);
				console.info("Note of the day is", noteOfTheDay);
				const fileOfTheDay = this.app.vault.getFileByPath(noteOfTheDay);
				if (fileOfTheDay) {
					this.app.workspace.openLinkText(fileOfTheDay.path, "", true);
				} else {
					new Notice("Note of the day not found");
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				console.log("File modified", file.name);
				// either iterate or set counter to 1 for dict obj of name file
				if (noteOfTheDayData[file.name]) {
					noteOfTheDayData[file.name] += 1;
				} else {
					noteOfTheDayData[file.name] = 1;
				}
				localStorage.setItem(
					"noteOfTheDayData",
					JSON.stringify(noteOfTheDayData)
				);
			})
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Your note of the day...exists.");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
