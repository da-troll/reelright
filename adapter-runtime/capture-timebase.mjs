const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export const compositionFrameToCaptureFrame = ({
  captureFps,
  captureFrameCount,
  compositionFps,
  compositionFrame,
}) =>
  clamp(
    Math.floor((compositionFrame * captureFps) / compositionFps),
    0,
    captureFrameCount - 1,
  );

export const captureFrameToCompositionFrame = ({
  captureFrame,
  captureFps,
  compositionFps,
}) => Math.round((captureFrame * compositionFps) / captureFps);
