// Public API client for the external attendance check-in link.
// No authentication: the flow identifies a member from their dial code, phone and
// last name, then submits the attendance questionnaire with a signed token.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://adsum-api.vercel.app";

export interface EventCard {
  id: string;
  titre: string;
  lieu: string | null;
  debut: string | null;
  fin: string | null;
  en_ligne: boolean;
  ouvert: boolean;
  cloture: boolean;
  cloture_le: string | null;
}

export interface Identite {
  token: string;
  prenom: string | null;
  nom: string;
  matricule: string;
  deja_enregistre: boolean;
  statut: string | null;
}

export interface EmargementResult {
  ok: boolean;
  statut: string;
  valide: boolean;
  modalite: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function send<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Connexion impossible. Vérifiez votre réseau.", 0);
  }
  if (!res.ok) {
    let detail = "Une erreur est survenue.";
    try {
      const data = (await res.json()) as { detail?: string };
      if (data.detail) detail = data.detail;
    } catch {
      /* keep the default message */
    }
    throw new ApiError(detail, res.status);
  }
  return (await res.json()) as T;
}

export function getEventCard(evenementId: string): Promise<EventCard> {
  return send<EventCard>(`/api/v1/public/emargement/${evenementId}`, "GET");
}

export function identifier(
  evenementId: string,
  input: { matricule: string } | { indicatif: string; telephone: string; nom: string },
): Promise<Identite> {
  return send<Identite>(`/api/v1/public/emargement/${evenementId}/identifier`, "POST", input);
}

export function emarger(
  evenementId: string,
  input: { token: string; statut: string; modalite?: string | null; avis?: string | null; note?: number | null },
): Promise<EmargementResult> {
  return send<EmargementResult>(`/api/v1/public/emargement/${evenementId}/participation`, "POST", input);
}
