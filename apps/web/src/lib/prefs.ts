export type LocalComputerPref = "ask" | "always" | "never";

const notifyKey = (botId: string) => `grogbot.notify.${botId}`;

export function readNotify(botId: string): boolean {
  return localStorage.getItem(notifyKey(botId)) === "1";
}

export function writeNotify(botId: string, value: boolean): void {
  localStorage.setItem(notifyKey(botId), value ? "1" : "0");
}

export function readLocalComputer(): LocalComputerPref {
  const value = localStorage.getItem("grogbot.localComputer");
  if (value === "ask" || value === "always" || value === "never") return value;
  return "ask";
}

export function writeLocalComputer(value: LocalComputerPref): void {
  localStorage.setItem("grogbot.localComputer", value);
}

export function readAutoReview(): boolean {
  return localStorage.getItem("grogbot.autoReview") === "1";
}

export function writeAutoReview(value: boolean): void {
  localStorage.setItem("grogbot.autoReview", value ? "1" : "0");
}

export function readHardwareAccel(): boolean {
  return localStorage.getItem("grogbot.hwAccel") !== "0";
}

export function writeHardwareAccel(value: boolean): void {
  localStorage.setItem("grogbot.hwAccel", value ? "1" : "0");
}

export function readAutoReviewRules(): string {
  return localStorage.getItem("grogbot.autoReviewRules") ?? "";
}

export function writeAutoReviewRules(value: string): void {
  localStorage.setItem("grogbot.autoReviewRules", value);
}
