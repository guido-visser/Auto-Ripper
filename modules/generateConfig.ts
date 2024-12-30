import jsonfile from "npm:jsonfile";
import { Config } from "../types.ts";

const generateConfig = async () => {
	const basicObject: Config = {
		defaults: {
			outputDir: "",
			audioLanguages: ["eng"],
			audioCodec: ["DTS-HD MA", "DTS", "DD"],
			audioName: ["Surround 7.1", "Surround 5.1"],
			includeSubs: true,
			subLanguages: ["eng"],
		},
		drive: [],
		plugins: [
			{
				enabled: true,
				name: "makemkv",
				path: "C:\\Program Files (x86)\\MakeMKV\\makemkvcon64.exe",
			},
			{
				enabled: false,
				name: "handbrake",
				path: "C:\\Program Files\\HandBrake\\HandBrakeCLI.exe",
			},
		],
	};

	await jsonfile.writeFile(basicObject, "./config.json");
};

export default generateConfig;
