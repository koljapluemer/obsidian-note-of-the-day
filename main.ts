import {
	App,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface NoteOfDaySettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: NoteOfDaySettings = {
	mySetting: "default",
};

export default class NoteOfDay extends Plugin {
	settings: NoteOfDaySettings;

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
		}

		const currentDate = new Date().toDateString();
		if (dateOfNoteOfTheDayData !== currentDate) {
			dateOfNoteOfTheDayData = new Date().toDateString();
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
				const fileOfTheDay = this.app.vault.getFileByPath(noteOfTheDay);
				if (fileOfTheDay) {
					this.app.workspace.openLinkText(
						fileOfTheDay.path,
						"",
						true
					);
				} else {
					new Notice("Note of the day not found");
				}
			},
		});

		this.addSettingTab(new NoteOfDaySettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
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

class NoteOfDayModal extends Modal {
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

class NoteOfDaySettingTab extends PluginSettingTab {
	plugin: NoteOfDay;

	constructor(app: App, plugin: NoteOfDay) {
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
