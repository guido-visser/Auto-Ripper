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
		debugger;
	}

	return new TextDecoder().decode(stdout);
}
