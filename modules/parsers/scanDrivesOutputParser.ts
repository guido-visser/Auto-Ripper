type Message = {
	code: string;
	value1: string;
	value2: string;
	description: string;
	extended: string;
};

type Drive = {
	driveNumber: number;
	flags: string;
	status: string;
	type: string;
	description: string;
	driveLetter: string;
	deviceName: string;
};

export function parseMakeMKVOutput(output: string): {
	message: Message[];
	drives: Drive[];
} {
	const lines = output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	const result: { message: Message[]; drives: Drive[] } = {
		message: [],
		drives: [],
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const parts = line.split(",");
		const driveLetter = parts[6]?.replace(/"/g, "") ?? "";
		const prefix = parts[0];

		if (driveLetter === "") continue;

		if (prefix.startsWith("MSG")) {
			result.message.push({
				code: parts[1],
				value1: parts[2],
				value2: parts[3],
				description: parts[4].replace(/"/g, ""), // Remove quotes
				extended: parts[5]?.replace(/"/g, "") ?? "",
			});
		} else if (prefix.startsWith("DRV")) {
			result.drives.push({
				driveNumber: parseInt(prefix.split(":")[1], 10),
				flags: parts[1],
				status: parts[2],
				type: parts[3],
				description: parts[4]?.replace(/"/g, "") ?? "",
				driveLetter: parts[6]?.replace(/"/g, "") ?? "",
				deviceName: parts[5]?.replace(/"/g, "") ?? "",
			});
		}
	}

	return result;
}
