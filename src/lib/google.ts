import { OAuth2Client } from "google-auth-library";
import type { GoogleConexion } from "@prisma/client";

// Solo lectura: el CRM nunca escribe/borra en el calendario.
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function getOAuthClient(): OAuth2Client {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });
}

// Cliente autenticado con los tokens guardados (refresca el access token solo si hace falta).
export function getAuthedClient(conexion: GoogleConexion): OAuth2Client {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: conexion.accessToken,
    refresh_token: conexion.refreshToken ?? undefined,
    expiry_date: conexion.expiryDate ? conexion.expiryDate.getTime() : undefined,
  });
  return client;
}

export type CalendarioGoogle = {
  id: string;
  summary: string;
  primary?: boolean;
};

// Lista los calendarios de la cuenta conectada.
export async function listarCalendarios(
  client: OAuth2Client
): Promise<CalendarioGoogle[]> {
  const res = await client.request<{
    items?: { id: string; summary: string; primary?: boolean }[];
  }>({
    url: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
  });
  return (res.data.items ?? []).map((c) => ({
    id: c.id,
    summary: c.summary,
    primary: c.primary,
  }));
}

export type EventoGoogle = {
  id: string;
  summary: string;
  start: string;
  end: string | null;
};

// Trae los eventos de un calendario en una ventana de -30 a +90 días.
export async function listarEventos(
  client: OAuth2Client,
  calendarId: string
): Promise<EventoGoogle[]> {
  const now = Date.now();
  const timeMin = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString();

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const res = await client.request<{
    items?: {
      id?: string;
      status?: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }[];
  }>({ url: url.toString() });

  return (res.data.items ?? [])
    .filter(
      (e) => e.id && e.status !== "cancelled" && (e.start?.dateTime || e.start?.date)
    )
    .map((e) => ({
      id: e.id as string,
      summary: e.summary || "(sin título)",
      start: (e.start!.dateTime ?? e.start!.date) as string,
      end: e.end?.dateTime ?? e.end?.date ?? null,
    }));
}
