import { existsSync } from "https://deno.land/std/fs/mod.ts";

/**
 * Starts the ripping process for a given title using MakeMKV.
 *
 * Parameters:
 *   - makemkvPath: Path to makemkvcon executable
 *   - driveLetter: Drive letter where the disc is located (e.g. "G:")
 *   - titleId: The numeric title ID to rip
 *   - audioTracks: An array of track numbers for the desired audio tracks
 *   - subtitleTracks: An array of track numbers for the desired subtitle tracks
 *   - outputDir: Directory where the resulting MKV file(s) should be saved
 *
 * This function will:
 *   1. Construct the `makemkvcon mkv` command with the given parameters.
 *   2. Run the process in a subprocess.
 *   3. Continuously read stdout and stderr, parse progress messages, and log them to the console.
 *   4. Resolve the returned Promise when ripping finishes or fails.
 *
 * Progress is reported by reading MSG lines (MSG:xxxx,...) from makemkvcon output.
 * MakeMKV emits various messages including progress updates. For example, lines starting with "MSG"
 * may contain progress info. You can parse them or just print them directly.
 */

import { PluginRef } from "../../types.ts";
import { execProgress } from "../../execCommand.ts";

interface RippingOptions {
	title: string;
	driveLetter: string;
	driveId: number; // e.g. "G:"
	titleId: number; // e.g. 1
	audioTracks: number[]; // e.g. [2,3]
	subtitleTracks: number[]; // e.g. [10,12]
	outputDir: string; // e.g. "M:\\Video\\Automated"
}

export async function ripTitle(
	ref: PluginRef,
	options: RippingOptions
): Promise<void> {
	const { driveId, titleId, outputDir } = options;

	//Check if Output dir exists, if not, create it
	if (!existsSync(outputDir)) {
		await Deno.mkdir(outputDir, { recursive: true });
	}

	const args = [
		"--progress=-same",
		"--noscan",
		"-r",
		"mkv",
		`disc:${driveId.toString()}`, // Source from the specified drive
		titleId.toString(), // Title ID
		outputDir, // Output directory
	];

	let state = 0;
	let currentStateString = "";
	await execProgress(ref.path, args, (line: string, log) => {
		if (line.startsWith("MSG:")) {
			return;
		} else if (line.startsWith("PRGC:")) {
			state++;
			const stateMsg = line.split(":")[1].split(",")[2].split('"')[1];
			currentStateString = `[MakeMKV] [${state}/7] - __% / ___% - ${stateMsg}\r`;
		} else if (line.startsWith("PRGV:")) {
			const [current, total, max] = line.split(":")[1].split(",");

			const percentage1 = (
				(parseInt(current) / parseInt(max)) *
				100
			).toFixed(2);

			const percentage2 = (
				(parseInt(total) / parseInt(max)) *
				100
			).toFixed(2);

			log(
				currentStateString
					.replace("__", percentage1)
					.replace("___", percentage2)
			);
		}
	});
}
