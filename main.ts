import { parseArgs } from "https://deno.land/std/cli/parse_args.ts";
import { Select } from "https://deno.land/x/cliffy@v0.25.7/prompt/select.ts";

import { Config } from "./types.ts";
import { scanDrives } from "./modules/scanDrives.ts";
import { getDiscInfo } from "./modules/getDiscInfo.ts";
import { autoSelect } from "./modules/autoSelect.ts";

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

	const driveNumber = await Select.prompt({
		message: "What drive do you want to use?",
		options: driveInfo.drives.map((drive) => {
			return {
				name: `${drive.driveLetter} - ${drive.description}`,
				value: `${drive.driveNumber}`,
			};
		}),
	});

	console.log("Reading disc...");
	const discInfo = await getDiscInfo(
		driveInfo.drives[parseInt(driveNumber, 10)].driveNumber
	);
	const title = prompt("What is the title of the media?");

	const selectedTitle = autoSelect(discInfo.titlesByMkv, config);
	debugger;
	/* 	console.log(`Getting disc info for drive ${driveIndex}...`);
	const { titleIndex, audioTracks, subtitleTracks } = await getDiscInfo(driveIndex);
  
	console.log(`Ripping title ${titleIndex} to ${outputDir}...`);
	await ripDisc(driveIndex, titleIndex, audioTracks, subtitleTracks, outputDir);
  
	console.log("Ripping complete!"); */
}

main().catch(console.error);
