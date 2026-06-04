export const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return null;
  }
};
