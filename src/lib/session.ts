export interface SessionData {
  user_id: string;
  password_hash: string;
  business_id: string;
  telegram_bot_token: string | null;
  upload_batch_id?: string;
}

const SESSION_KEY = "amfa_session";

export function getSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function setSession(data: SessionData): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function updateSession(partial: Partial<SessionData>): void {
  const current = getSession();
  if (current) {
    setSession({ ...current, ...partial });
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export function isAdmin(): boolean {
  const s = getSession();
  return s?.telegram_bot_token === null;
}

export function hasUploadBatch(): boolean {
  return !!getSession()?.upload_batch_id;
}
