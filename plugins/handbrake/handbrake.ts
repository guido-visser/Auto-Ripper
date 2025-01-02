import { execCommand, execProgress } from "../../execCommand.ts";
import { Config, PluginOutput, PluginRef } from "../../types.ts";
import { autoSelect } from "./autoSelect.ts";
import * as path from "node:path";
import jsonfile from "jsonfile";

export default class Handbrake {
	config: Config;
	prev: PluginOutput;

	constructor(config: Config, prevPluginOutput: PluginOutput) {
		this.config = config;
		this.prev = prevPluginOutput;
	}

	init = async (ref: PluginRef) => {
		console.log("[HandBrake] Plugin Initialized");
		const output = await execCommand([
			ref.path,
			"-i",
			this.prev.fullPath,
			"--scan",
			"--json",
		]);
		const fileInfo = JSON.parse(output.split("JSON Title Set: ")[1].trim());
		const selected = autoSelect(this.config, fileInfo);

		const audioTracks = selected.audio.join(",");
		let subtitleTracks = selected.subtitles.join(",");
		const outputPath = path.join(
			this.prev.outputDir,
			`${this.prev.title}.mkv`
		);

		if (!this.config.defaults.includeSubs) {
			subtitleTracks = "none";
		}

		const args: string[] = [
			"-i",
			`${this.prev.fullPath}`,
			"--audio-lang-list",
			this.config.defaults.audioLanguages.join(","),
			"-s",
			subtitleTracks,
			"-o",
			outputPath,
			"--json",
		];

		if (ref.options.preset) {
			const preset = await jsonfile.readFile(ref.options.preset);
			const presetName = preset.PresetList[0].PresetName;
			args.push("--preset-import-file");
			args.push(`${ref.options.preset}`);
			args.push("--preset");
			args.push(`${presetName}`);
		}

		await execProgress(ref.path, args, (line: string, log) => {
			if (!line.startsWith('"Progress": ')) return;

			const percentageStr = (
				parseFloat(line.split('"Progress": ')[1]) * 100
			).toFixed(2);
			log(`[HandBrake] Progress: ${percentageStr}%`);
		});

		const pathToDelete = path.join(this.prev.outputDir, "tmp");

		await Deno.remove(pathToDelete, { recursive: true });

		return {
			title: this.prev.title,
			outputDir: this.prev.outputDir,
			fullPath: path.join(this.prev.outputDir, `${this.prev.title}.mkv`),
			fileName: `${this.prev.title}.mkv`,
		};
	};
}
