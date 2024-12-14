import { execCommand } from "./execCommand.ts";
import { parseMakemkvOutput, ParseResult } from "./parser.ts";

export async function getDiscInfo(driveIndex: number): Promise<ParseResult> {
	const output = await execCommand([
		"makemkvcon64.exe",
		"-r",
		"info",
		`disc:${driveIndex}`,
		"--directio=true",
	]);
	return parseMakemkvOutput(output);
}
