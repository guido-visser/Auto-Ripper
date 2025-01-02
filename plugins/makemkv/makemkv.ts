import { Config, PluginOutput, PluginRef } from "../../types.ts";
import { autoSelect } from "./autoSelect.ts";
import { getDiscInfo } from "./getDiscInfo.ts";
import { ripTitle } from "./ripTitle.ts";
import { scanDrives } from "./scanDrives.ts";
import { Select } from "https://deno.land/x/cliffy@v0.25.7/prompt/select.ts";
import * as path from "node:path";

export default class MakeMKV {
	config: Config;

	constructor(config: Config, _prevPluginOutput: PluginOutput) {
		this.config = config;
	}

	init = async (ref: PluginRef) => {
		console.log("[MakeMKV] Plugin Initialized");
		console.log("Scanning drives...");
		const driveInfo = await scanDrives(ref);
		const driveLetters: { [driveId: string]: string } = {};

		const driveNumber: string = await Select.prompt({
			message: "What drive do you want to use?",
			options: driveInfo.drives
				.filter((drive) => drive.type !== 256)
				.map((drive) => {
					driveLetters[drive.driveNumber] = drive.discPath;
					return {
						name: `${drive.discPath} - ${drive.name}`,
						value: `${drive.driveNumber}`,
					};
				}),
		});

		const title = prompt("What is the title of the media?");

		const selectedDrive =
			driveInfo.drives[parseInt(driveNumber, 10)].driveNumber;

		console.log("Reading disc...");
		const discInfo = await getDiscInfo(ref, selectedDrive);

		const selected = autoSelect(this.config, discInfo.titlesByMkv);

		const pluginOut = {
			title,
			titleId: selected.video,
			driveId: selectedDrive,
			driveLetter: driveLetters[driveNumber],
			audioTracks: selected.audio,
			subtitleTracks: selected.subtitles,
			outputDir: path.join(this.config.defaults.outputDir, title, "tmp"),
		};

		await ripTitle(ref, pluginOut);

		const oldPath = path.join(
			this.config.defaults.outputDir,
			title,
			"tmp",
			selected.name
		);
		const newPath = path.join(
			this.config.defaults.outputDir,
			title,
			"tmp",
			`${title}.mkv`
		);

		await Deno.rename(oldPath, newPath);

		return {
			title,
			fullPath: newPath,
			fileName: `${title}.mkv`,
			outputDir: path.join(this.config.defaults.outputDir, title),
		};
	};
}
