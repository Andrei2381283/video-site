export const safeJsonParse = <T = unknown>(str: string | null): T | null => {
  if (!str) return null;

  try {
    return JSON.parse(str) as T;
  } catch (err) {
    return null;
  }
};
