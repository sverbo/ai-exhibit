/** Logical stage size. Scene components lay out in these pixels. */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

export interface StageFit {
  /** CSS scale applied to the 1920x1080 stage. */
  scale: number;
  /** Left/top offset of the scaled stage inside the container (letterbox bars). */
  offsetX: number;
  offsetY: number;
  /** Size of the scaled stage in container pixels. */
  width: number;
  height: number;
}

/** Fits the logical stage inside a container, preserving 16:9 and centering it. */
export function fitStage(
  containerWidth: number,
  containerHeight: number,
  stageWidth = STAGE_WIDTH,
  stageHeight = STAGE_HEIGHT,
): StageFit {
  const w = Math.max(0, containerWidth);
  const h = Math.max(0, containerHeight);
  if (w === 0 || h === 0) return { scale: 0, offsetX: 0, offsetY: 0, width: 0, height: 0 };
  const scale = Math.min(w / stageWidth, h / stageHeight);
  const width = stageWidth * scale;
  const height = stageHeight * scale;
  return { scale, offsetX: (w - width) / 2, offsetY: (h - height) / 2, width, height };
}
