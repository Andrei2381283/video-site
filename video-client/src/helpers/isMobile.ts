const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|CriOS|FxiOS/i;

export function isMobile(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
): boolean {
  if (!userAgent) return false;

  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
}
