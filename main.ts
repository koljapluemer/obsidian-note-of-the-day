import {
	Notice,
	Plugin,
} from "obsidian";


export default class NoteOfDay extends Plugin {

	async onload() {
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
}
