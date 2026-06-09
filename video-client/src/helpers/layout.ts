const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|CriOS|FxiOS/i;

export function isMobile(
  userAgent: string = typeof navigator !== "undefined"
    ? navigator.userAgent
    : "",
): boolean {
  if (!userAgent) return false;

  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
}

export function isAndroidTV() {
  const userAgent = navigator.userAgent.toLowerCase();

  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has("tv")) return true;

  return (
    userAgent.includes("android") &&
    (userAgent.includes("googletv") ||
      userAgent.includes("smarttv") ||
      userAgent.includes("chromecast") ||
      userAgent.includes("large screen"))
  );
}
