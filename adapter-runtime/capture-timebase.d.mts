export type CompositionToCaptureFrameInput = {
  captureFps: number;
  captureFrameCount: number;
  compositionFps: number;
  compositionFrame: number;
};

export type CaptureToCompositionFrameInput = {
  captureFrame: number;
  captureFps: number;
  compositionFps: number;
};

export declare const compositionFrameToCaptureFrame: (
  input: CompositionToCaptureFrameInput,
) => number;

export declare const captureFrameToCompositionFrame: (
  input: CaptureToCompositionFrameInput,
) => number;
