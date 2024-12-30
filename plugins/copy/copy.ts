import { Config, PluginOutput, PluginRef } from "../../types.ts";
import { existsSync } from "https://deno.land/std@0.203.0/fs/mod.ts";
import { dirname, join } from "https://deno.land/std@0.203.0/path/mod.ts";

export default class Copy {
	config: Config;
	prev: PluginOutput;

	constructor(config: Config, prevPluginOutput: PluginOutput) {
		this.config = config;
		this.prev = prevPluginOutput;
	}

	init = async (ref: PluginRef) => {
		console.log("[Copy] Plugin Initialized");
		await this.copyFolderWithProgress(
			this.prev.outputDir,
			join(ref.path, this.prev.title)
		);
	};

	/**
	 * Recursively calculates the total byte size of all files within a folder.
	 */
	private getFolderSize = async (folderPath: string): Promise<number> => {
		let totalSize = 0;

		for await (const entry of Deno.readDir(folderPath)) {
			const entryPath = join(folderPath, entry.name);
			const fileInfo = await Deno.stat(entryPath);

			if (fileInfo.isDirectory) {
				totalSize += await this.getFolderSize(entryPath);
			} else {
				totalSize += fileInfo.size;
			}
		}

		return totalSize;
	};

	/**
	 * Copies a single file in chunks to display progress.
	 */
	copyFileWithProgress = async (
		src: string,
		dest: string,
		onProgress: (chunkSize: number) => void
	): Promise<void> => {
		// Ensure the destination folder structure exists
		const destDir = dirname(dest);
		if (!existsSync(destDir)) {
			await Deno.mkdir(destDir, { recursive: true });
		}

		const sourceFile = await Deno.open(src, { read: true });
		const destFile = await Deno.open(dest, {
			write: true,
			create: true,
			truncate: true,
		});

		try {
			const buffer = new Uint8Array(64_000); // 64 KB chunks
			let bytesRead: number | null;
			while ((bytesRead = await sourceFile.read(buffer)) !== null) {
				if (bytesRead > 0) {
					await destFile.write(buffer.subarray(0, bytesRead));
					onProgress(bytesRead);
				}
			}
		} finally {
			sourceFile.close();
			destFile.close();
		}
	};

	/**
	 * Recursively copies a folder from `source` to `destination`, showing a progress indicator.
	 */
	private copyFolderWithProgress = async (
		source: string,
		destination: string
	) => {
		// Sanity checks
		const sourceInfo = await Deno.stat(source);
		if (!sourceInfo.isDirectory) {
			throw new Error(
				`Source path ${source} is not a directory or doesn't exist.`
			);
		}

		// Calculate total size
		const totalSize = await this.getFolderSize(source);
		if (totalSize === 0) {
			console.log("Source folder is empty; nothing to copy.");
			return;
		}

		let copiedBytes = 0;
		const updateProgress = (bytes: number) => {
			copiedBytes += bytes;
			const progressPercentage = (
				(copiedBytes / totalSize) *
				100
			).toFixed(2);
			Deno.stdout.writeSync(
				new TextEncoder().encode(
					`\r[Copy] Progress: ${progressPercentage}%`
				)
			);
		};

		// Create the destination folder if it does not exist
		if (!existsSync(destination)) {
			await Deno.mkdir(destination, { recursive: true });
		}

		// Recursively walk through the source folder
		for await (const entry of Deno.readDir(source)) {
			const srcPath = join(source, entry.name);
			const destPath = join(destination, entry.name);

			const fileInfo = await Deno.stat(srcPath);
			if (fileInfo.isDirectory) {
				// Recursively copy subdirectories
				await this.copyFolderWithProgress(srcPath, destPath);
			} else {
				await this.copyFileWithProgress(
					srcPath,
					destPath,
					updateProgress
				);
			}
		}

		// Final newline after progress
		console.log("\nCopy completed!");
	};
}
