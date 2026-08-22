const INVITE_KEY = "groxbot.invite";

export function rememberInvite(id: string | undefined) {
  if (typeof window === "undefined") return;
  const trimmed = id?.trim();
  if (trimmed) sessionStorage.setItem(INVITE_KEY, trimmed);
}

export function readRememberedInvite(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(INVITE_KEY)?.trim() ?? "";
}

export function clearRememberedInvite() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(INVITE_KEY);
}
