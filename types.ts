export type Config = {
	plugins: PluginRef[];
	dependencies: {
		makemkv: string;
		handbrake: string;
		subsync: string;
	};
	drive: string[];
	defaults: {
		outputDir: string;
		audioLanguages: string[];
		subLanguages: string[];
		includeSubs: boolean;
		audioCodec: string[];
		audioName: string[];
	};
};

export type PluginRef = { name: string; path: string };

export type PluginOutput = {
	title: string;
	titleId: number;
	driveId: number;
	driveLetter: string;
	audioTracks: number[];
	subtitleTracks: number[];
	outputDir: string;
};
