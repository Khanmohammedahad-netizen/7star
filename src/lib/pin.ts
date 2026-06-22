const UNLOCK_KEY = 'personal_unlocked';
const UNLOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`sevenstar:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function markUnlocked(): void {
  sessionStorage.setItem(UNLOCK_KEY, String(Date.now()));
}

export function isUnlocked(): boolean {
  const ts = sessionStorage.getItem(UNLOCK_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < UNLOCK_WINDOW_MS;
}

export function lock(): void {
  sessionStorage.removeItem(UNLOCK_KEY);
}
