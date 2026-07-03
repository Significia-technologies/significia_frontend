import { getBackendBaseUrl } from "./backend-url";

export async function refreshBackendTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const res = await fetch(`${getBackendBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  if (!data?.access_token) return null;

  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}
