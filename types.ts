export type Config = {
	makemkv: string;
	drive: string[];
	defaults: {
		outputDir: string;
		languages: string[];
		includeSubs: boolean;
		audioCodec: string[];
	};
};
