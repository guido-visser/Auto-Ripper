export type Config = {
	plugins: PluginRef[];
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

export type PluginRef = {
	enabled: boolean;
	name: string;
	path: string;
	options?: { [key: string]: any };
};

export type PluginOutput = {
	title: string;
	outputDir: string;
	fullPath: string;
	fileName: string;
};

/**
 * Represents the root of the HandBrakeCLI JSON output.
 */
export interface HandBrakeOutput {
	MainFeature: number;
	TitleList: HBTitle[];
}

/**
 * Represents a single title within the TitleList.
 */
export interface HBTitle {
	AngleCount: number;
	AudioList: HBAudio[];
	ChapterList: HBChapter[];
	Color: HBColor;
	Container: string;
	Crop: number[];
	Duration: HBTimeDuration;
	FrameRate: HBFrameRate;
	Geometry: HBGeometry;
	Index: number;
	InterlaceDetected: boolean;
	KeepDuplicateTitles: boolean;
	LooseCrop: number[];
	Metadata: Record<string, unknown>;
	Name: string;
	Path: string;
	Playlist: number;
	SubtitleList: HBSubtitle[];
	Type: number;
	VideoCodec: string;
}

/**
 * Represents an audio track within the AudioList.
 */
interface HBAudio {
	Attributes: HBAudioAttributes;
	BitRate: number;
	ChannelCount: number;
	ChannelLayout: number;
	ChannelLayoutName: string;
	Codec: number;
	CodecName: string;
	CodecParam: number;
	Description: string;
	LFECount: number;
	Language: string;
	LanguageCode: string;
	Name: string;
	SampleRate: number;
	TrackNumber: number;
}

/**
 * Represents the attributes of an audio track.
 */
interface HBAudioAttributes {
	AltCommentary: boolean;
	Commentary: boolean;
	Default: boolean;
	Normal: boolean;
	Secondary: boolean;
	VisuallyImpaired: boolean;
}

/**
 * Represents a chapter within the ChapterList.
 */
interface HBChapter {
	Duration: HBTimeDuration;
	Name: string;
}

/**
 * Represents the color information.
 */
interface HBColor {
	BitDepth: number;
	ChromaLocation: number;
	ChromaSubsampling: string;
	Format: number;
	Matrix: number;
	Primary: number;
	Range: number;
	Transfer: number;
}

/**
 * Represents the frame rate information.
 */
interface HBFrameRate {
	Den: number;
	Num: number;
}

/**
 * Represents the geometry information.
 */
interface HBGeometry {
	Height: number;
	PAR: HBPixelAspectRatio;
	Width: number;
}

/**
 * Represents the pixel aspect ratio.
 */
interface HBPixelAspectRatio {
	Den: number;
	Num: number;
}

/**
 * Represents a subtitle track within the SubtitleList.
 */
interface HBSubtitle {
	Attributes: HBSubtitleAttributes;
	Format: string;
	Language: string;
	LanguageCode: string;
	Source: number;
	SourceName: string;
	TrackNumber: number;
}

/**
 * Represents the attributes of a subtitle track.
 */
interface HBSubtitleAttributes {
	Children: boolean;
	ClosedCaption: boolean;
	Commentary: boolean;
	Default: boolean;
	Forced: boolean;
	Large: boolean;
	Letterbox: boolean;
	Normal: boolean;
	PanScan: boolean;
	Wide: boolean;
}

/**
 * Represents the duration of a section (e.g., Chapter, Overall Duration).
 */
interface HBTimeDuration {
	Hours: number;
	Minutes: number;
	Seconds: number;
	Ticks: number;
}

interface HBProgress {
	state: string;
}

export type Software = {
	DisplayName: string;
	DisplayVersion: string;
	InstallDate: string;
	InstallLocation: string;
	Publisher: string;
};
