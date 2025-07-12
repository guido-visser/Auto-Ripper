export const downloadFileWithProgress = async (
	pluginName: string,
	url: string,
	destination: string
): Promise<void> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(
			`[${pluginName}] Failed to download file from ${url}: ${response.status} ${response.statusText}`
		);
	}

	// Try to get total size from 'content-length' header
	const contentLengthHeader = response.headers.get("content-length") ?? "0";
	const totalSize = parseInt(contentLengthHeader, 10);

	// Open file for writing
	const file = await Deno.open(destination, {
		write: true,
		create: true,
		truncate: true,
	});

	try {
		let downloaded = 0;
		const reader = response.body?.getReader();

		if (!reader) {
			// No body to read
			console.warn(`[${pluginName}] Response has no body to read.`);
			return;
		}

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			// Write chunk to file
			file.writeSync(value);
			downloaded += value.length;

			// Log progress if total size is known
			if (totalSize > 0) {
				const percent = ((downloaded / totalSize) * 100).toFixed(2);
				console.log(`[${pluginName}] Downloaded: ${percent}%`);
			} else {
				// If content-length is unavailable, just log bytes downloaded
				console.log(
					`[${pluginName}] Downloaded ${downloaded} bytes (unknown total).`
				);
			}
		}
	} finally {
		file.close();
	}

	console.log(`[${pluginName}] File downloaded and saved as: ${destination}`);
};
