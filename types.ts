export type Config = {
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
