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

import { Config } from "../types.ts";

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
	config: Config,
	options: RippingOptions
): Promise<void> {
	const { title, driveId, titleId, audioTracks, subtitleTracks, outputDir } =
		options;

	// MakeMKV expects something like:
	// makemkvcon mkv disc:0 <titleId> "outputDir" --minlength=120 --audio=... --subtitle=...
	// If you have a single optical drive and it’s the only BD in the system, it’s often disc:0.
	// But we can also specify the drive letter: file:"G:"
	// According to the docs, if you use file:"G:", MakeMKV treats it as disc input from that drive.

	// Construct audio and subtitle arguments. If empty, we omit them to select all.
	const audioArg =
		audioTracks.length > 0 ? `--audio=${audioTracks.join(",")}` : "";
	const subtitleArg =
		subtitleTracks.length > 0
			? `--subtitle=${subtitleTracks.join(",")}`
			: "";

	const args = [
		"mkv",
		`disc:${driveId.toString()}`, // Source from the specified drive
		titleId.toString(), // Title ID
		`"${outputDir}"`, // Output directory
	];

	// Add optional arguments if they have values
	if (audioArg) args.push(audioArg);
	if (subtitleArg) args.push(subtitleArg);

	console.log(`Starting to rip ${title}`);
	console.log(`Command: ${config.dependencies.makemkv} ${args.join(" ")}`);

	const process = new Deno.Command(config.dependencies.makemkv, {
		args,
		stdout: "piped",
		stderr: "piped",
	}).spawn();

	// Use a reader to handle output line-by-line
	const stdoutReader = process.stdout.getReader();
	const stderrReader = process.stderr.getReader();

	// Function to handle output lines
	async function readStream(
		reader: ReadableStreamDefaultReader<Uint8Array>,
		isStdErr = false
	) {
		const decoder = new TextDecoder();
		let buffer = "";
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			let lines = buffer.split("\n");
			// Save the last partial line for next iteration
			buffer = lines.pop() || "";

			for (const line of lines) {
				handleLine(line.trim(), isStdErr);
			}
		}
		// Flush remaining buffer
		if (buffer) {
			handleLine(buffer.trim(), isStdErr);
		}
	}

	function handleLine(line: string, isStdErr: boolean) {
		if (!line) return;
		// For now, just print lines to console. You can parse MSG lines for progress.
		// MSG lines might look like: MSG:5010,0,0,"Copying title 1...","Copying title 1..."
		// You could parse these further and extract actual progress if needed.

		if (line.startsWith("MSG:")) {
			// Simple progress info: Just log it
			console.log(`[MakeMKV - MSG]: ${line}`);
		} else {
			// General output
			if (isStdErr) {
				console.error(`[MakeMKV - ERR]: ${line}`);
			} else {
				console.log(`[MakeMKV]: ${line}`);
			}
		}
	}

	// Run in parallel
	const [status] = await Promise.all([
		process.status,
		readStream(stdoutReader),
		readStream(stderrReader, true),
	]);

	if (status.success) {
		console.log(`Ripping completed successfully for title ${titleId}.`);
	} else {
		console.error(
			`Ripping failed for title ${titleId} with code ${status.code}.`
		);
		throw new Error(`MakeMKV rip failed with code ${status.code}`);
	}
}

// Example usage:
// await ripTitle({
//   makemkvPath: 'C:\\Program Files (x86)\\MakeMKV\\makemkvcon64.exe',
//   driveLetter: 'G:',
//   titleId: 1,
//   audioTracks: [2,3],
//   subtitleTracks: [10],
//   outputDir: 'M:\\Video\\Automated'
// });
