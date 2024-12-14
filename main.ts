import { parseArgs } from "https://deno.land/std/cli/parse_args.ts";
import { Select } from "https://deno.land/x/cliffy@v0.25.7/prompt/select.ts";
import * as path from "node:path";

import { Config } from "./types.ts";
import { scanDrives } from "./modules/scanDrives.ts";
import { getDiscInfo } from "./modules/getDiscInfo.ts";
import { autoSelect } from "./modules/autoSelect.ts";
import { ripTitle } from "./modules/ripTitle.ts";

const configText = await Deno.readTextFile("./config.json");
const config: Config = JSON.parse(configText);

const args = parseArgs(Deno.args, {
	string: ["drive", "output"],
	boolean: ["help", "version"],
	alias: {
		h: "help",
		v: "version",
		d: "drive",
		o: "output",
	},
	default: {
		drive: "0",
		output: "./output",
	},
});

async function main() {
	if (args.help) {
		console.log(
			"Usage: deno run main.ts -d <drive_index> -o <output_directory>"
		);
		Deno.exit(0);
	}

	if (args.version) {
		console.log("MakeMKV Automation v1.0.0");
		Deno.exit(0);
	}

	const driveIndex = args.drive;
	const outputDir = args.output;

	console.log("Scanning drives...");
	const driveInfo = await scanDrives(config);
	let driveLetters: { [driveId: string]: string } = {};

	const driveNumber: string = await Select.prompt({
		message: "What drive do you want to use?",
		options: driveInfo.drives.map((drive) => {
			driveLetters[drive.driveNumber] = drive.driveLetter;
			return {
				name: `${drive.driveLetter} - ${drive.description}`,
				value: `${drive.driveNumber}`,
			};
		}),
	});

	const title = prompt("What is the title of the media?");

	const selectedDrive =
		driveInfo.drives[parseInt(driveNumber, 10)].driveNumber;

	console.log("Reading disc...");
	const discInfo = await getDiscInfo(config, selectedDrive);

	const selected = autoSelect(discInfo.titlesByMkv, config);

	await ripTitle(config, {
		title,
		titleId: selected.video,
		driveId: selectedDrive,
		driveLetter: driveLetters[driveNumber],
		audioTracks: selected.audio,
		subtitleTracks: selected.subtitles,
		outputDir: path.join(config.defaults.outputDir, title),
	});
}

main().catch(console.error);
