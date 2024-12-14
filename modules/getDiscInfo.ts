import { Config } from "../types.ts";
import { execCommand } from "./execCommand.ts";
import { parseMakemkvOutput, ParseResult } from "./parser.ts";

export async function getDiscInfo(
	config: Config,
	driveIndex: number
): Promise<ParseResult> {
	const output = await execCommand([
		config.dependencies.makemkv,
		"-r",
		"info",
		`disc:${driveIndex}`,
		"--directio=true",
	]);
	return parseMakemkvOutput(output);
}
