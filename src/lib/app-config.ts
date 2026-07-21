// Resolves the PUBLIC base URL of the deployed app (APP_URL on the server).
// Links embedded in outgoing emails (tracking pixel, unsubscribe) must always
// point at the public domain: window.location.origin is only a fallback,
// because an email sent from a localhost/dev session would otherwise carry
// links the lead's mail client can never reach — opens and unsubscribes for
// those sends would silently never be recorded.
let cachedBaseUrl: string | null = null;

export async function getPublicBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      const appUrl = String(data?.appUrl || "").trim().replace(/\/+$/, "");
      if (appUrl) {
        cachedBaseUrl = appUrl;
        return cachedBaseUrl;
      }
    }
  } catch {
    // Server unreachable or misconfigured: fall through to origin.
  }
  cachedBaseUrl = window.location.origin;
  return cachedBaseUrl;
}
