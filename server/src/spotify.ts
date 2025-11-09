import {
  clearSpotifyTokens,
  getSpotifyTokens,
  setSpotifyTokens,
} from "./db";

type SpotifyConfig = {
  clientId: string;
  clientSecret: string;
};

type SpotifyTokens = {
  accessToken: string;
  expiresAt: number;
};

export type SpotifyPlaybackState = {
  isPlaying: boolean;
  track: string | null;
};

const config: SpotifyConfig | null =
  process.env.SPOTIFY_CLIENT_ID &&
  process.env.SPOTIFY_CLIENT_SECRET
    ? {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      }
    : null;

let cachedTokens: SpotifyTokens | null = null;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const REQUEST_SCOPE =
  "user-read-currently-playing user-read-playback-state";

function fallbackRefreshToken(): string | null {
  return process.env.SPOTIFY_REFRESH_TOKEN ?? null;
}

async function refreshAccessToken(): Promise<SpotifyTokens | null> {
  if (!config) {
    return null;
  }

  const stored = getSpotifyTokens();
  const refreshToken =
    stored.refresh_token ?? fallbackRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const basicAuth = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn(
      "[spotify] Failed to refresh access token",
      response.status,
      text
    );
    return null;
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
  };

  const expiresAt = Date.now() + (data.expires_in - 30) * 1000;

  cachedTokens = {
    accessToken: data.access_token,
    expiresAt,
  };

  setSpotifyTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? stored.refresh_token ?? refreshToken,
    expiresAt,
    tokenType: data.token_type ?? "Bearer",
    scope: data.scope ?? stored.scope ?? REQUEST_SCOPE,
  });

  return cachedTokens;
}

async function getAccessToken(): Promise<string | null> {
  if (!config) {
    return null;
  }

  const stored = getSpotifyTokens();
  if (
    stored.access_token &&
    stored.expires_at &&
    stored.expires_at > Date.now()
  ) {
    cachedTokens = {
      accessToken: stored.access_token,
      expiresAt: stored.expires_at,
    };
  }

  if (cachedTokens && cachedTokens.expiresAt > Date.now()) {
    return cachedTokens.accessToken;
  }

  const refreshed = await refreshAccessToken();
  return refreshed?.accessToken ?? null;
}

export async function fetchSpotifyPlayback(
  hasRetried = false
): Promise<SpotifyPlaybackState | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 204) {
    return { isPlaying: false, track: null };
  }

  if (response.status === 200) {
    const body = (await response.json()) as {
      is_playing: boolean;
      item?: {
        name?: string;
        artists?: { name?: string }[];
      };
    };

    if (!body.is_playing || !body.item) {
      return { isPlaying: false, track: null };
    }

    const name = body.item.name ?? "Unknown Track";
    const artists =
      body.item.artists?.map((artist) => artist.name).filter(Boolean) ?? [];
    const track =
      artists.length > 0 ? `${name} — ${artists.join(", ")}` : name;

    return { isPlaying: true, track };
  }

  if (response.status === 401 && !hasRetried) {
    // Access token expired or revoked. Try one refresh and retry once.
    cachedTokens = null;
    await refreshAccessToken();
    return fetchSpotifyPlayback(true);
  }

  if (response.status === 401) {
    console.warn("[spotify] Unauthorized; clearing stored tokens");
    clearSpotifyTokens();
  }

  const text = await response.text();
  console.warn("[spotify] Unexpected playback response", response.status, text);
  return null;
}

export function spotifyIntegrationEnabled() {
  if (!config) {
    return false;
  }
  const tokens = getSpotifyTokens();
  return Boolean(tokens.refresh_token ?? fallbackRefreshToken());
}

export function spotifyAuthConfigured() {
  return config !== null;
}

export function getSpotifyAuthorizeUrl(state: string, redirectUri: string) {
  if (!config) {
    throw new Error("Spotify client credentials are not configured");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    scope: REQUEST_SCOPE,
    redirect_uri: redirectUri,
    state,
    show_dialog: "true",
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeSpotifyCode(
  code: string,
  redirectUri: string
): Promise<boolean> {
  if (!config) {
    return false;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const basicAuth = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(
      "[spotify] Failed to exchange authorization code",
      response.status,
      text
    );
    return false;
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type?: string;
    scope?: string;
  };

  const expiresAt = Date.now() + (data.expires_in - 30) * 1000;

  setSpotifyTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    tokenType: data.token_type ?? "Bearer",
    scope: data.scope ?? REQUEST_SCOPE,
  });

  cachedTokens = {
    accessToken: data.access_token,
    expiresAt,
  };

  return true;
}
