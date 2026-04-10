export function normalizeLoopValue(value, setWidth) {
  if (!setWidth) return value;

  let normalized = value;

  while (normalized <= -2 * setWidth) {
    normalized += setWidth;
  }

  while (normalized >= 0) {
    normalized -= setWidth;
  }

  return normalized;
}
