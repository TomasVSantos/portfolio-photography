export interface ImagePipelineConfig {
  version: string;
  widths: readonly number[];
  canonicalMaxWidth: number;
  quality: Readonly<{ canonical: number; variant: number; blur: number }>;
  blurWidth: number;
  supportedSourceExtensions: readonly string[];
}

export const imagePipelineConfig: Readonly<ImagePipelineConfig>;
export const pipelineSignature: string;
