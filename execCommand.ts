export async function execCommand(
	cmd: string[],
	options: Deno.CommandOptions = {}
): Promise<string> {
	const command = new Deno.Command(cmd[0], {
		args: cmd.slice(1),
		stdout: "piped",
		stderr: "piped",
		...options,
	});

	const { code, stdout, stderr } = await command.output();

	if (code === 1) {
		return new TextDecoder().decode(stdout);
	}

	if (code !== 0) {
		throw new Error(new TextDecoder().decode(stderr));
	}

	return new TextDecoder().decode(stdout);
}

export async function execProgress(
	path: string,
	args: string[],
	liveOutputFunc: (line: string, consolelog: (line: string) => void) => void
) {
	const process = new Deno.Command(path, {
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
			const lines = buffer.split("\n");
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

	function handleLine(line: string, _isStdErr: boolean) {
		if (!line) return;
		const enc = (s: string) => new TextEncoder().encode(s);
		const clearLine = "\x1b[2K";

		const denoConsoleLog = (line: string) => {
			Deno.stdout.write(enc(`${clearLine}${line}\r`));
		};

		liveOutputFunc(line, denoConsoleLog);
	}

	// Run in parallel
	const [status] = await Promise.all([
		process.status,
		readStream(stdoutReader),
		readStream(stderrReader, true),
	]);

	return status;
}
