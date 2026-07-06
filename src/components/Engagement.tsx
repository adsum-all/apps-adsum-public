import { useEffect, useState } from "react";

import { PAYS } from "../countries.js";
import { PaysIndicatifCombo } from "./PaysIndicatifCombo.js";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://adsum-api.vercel.app";

type Etat = "saisie" | "envoi" | "succes" | "deja" | "erreur";

function Brandbar(): JSX.Element {
  return (
    <div className="eng-brand">
      <div className="eng-logo">A</div>
      <div className="eng-brand-text">
        <span className="eng-brand-name">ADSUM</span>
        <span className="eng-brand-sub">Sacerdoce Royal</span>
      </div>
    </div>
  );
}

/**
 * Public "I want to engage" form, opened by scanning the engagement QR at a public
 * event. Rendered on the ADSUM Design System (light theme, blue accent, Space
 * Grotesk / IBM Plex Sans): a white card on a soft light background, a clear
 * hierarchy and a premium form. Very short: e-mail (required), first name, uppercase
 * family name, one phone with a searchable country dialling code. When the QR is tied
 * to an activity, the form shows that activity as a discreet context.
 */
export function Engagement({ evenementId }: { evenementId: string | null }): JSX.Element {
  const [email, setEmail] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [nom, setNom] = useState("");
  const [indicatif, setIndicatif] = useState("");
  const [telephone, setTelephone] = useState("");
  const [etat, setEtat] = useState<Etat>("saisie");
  const [erreur, setErreur] = useState<string | null>(null);
  const [activite, setActivite] = useState<string | null>(null);

  useEffect(() => {
    if (!evenementId) return;
    let cancelled = false;
    void fetch(`${BASE}/api/v1/public/engagement/contexte?evenement_id=${encodeURIComponent(evenementId)}`)
      .then((r) => (r.ok ? r.json() : { titre: null }))
      .then((d: { titre: string | null }) => {
        if (!cancelled) setActivite(d.titre);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [evenementId]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email.includes("@")) {
      setErreur("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    if (telephone.trim() && !indicatif) {
      setErreur("Sélectionnez l'indicatif du pays correspondant à votre numéro.");
      return;
    }
    setEtat("envoi");
    setErreur(null);
    const pays_code = PAYS.find((p) => p.indicatif === indicatif)?.code ?? null;
    try {
      const res = await fetch(`${BASE}/api/v1/public/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          prenoms: prenoms.trim() || null,
          nom: nom.trim() || null,
          telephone: telephone.trim() ? `${indicatif} ${telephone.trim()}`.trim() : null,
          pays_indicatif: indicatif || null,
          pays_code,
          evenement_id: evenementId,
        }),
      });
      if (res.status === 201) setEtat("succes");
      else if (res.status === 409) setEtat("deja");
      else {
        setEtat("erreur");
        setErreur("Envoi impossible pour le moment. Veuillez réessayer dans un instant.");
      }
    } catch {
      setEtat("erreur");
      setErreur("Connexion au serveur impossible. Vérifiez votre réseau.");
    }
  }

  if (etat === "succes" || etat === "deja") {
    return (
      <div className="eng-shell">
        <div className="eng-card eng-done">
          <Brandbar />
          <div className="eng-done-icon" aria-hidden="true">✓</div>
          <h1 className="eng-title">{etat === "deja" ? "Vous êtes déjà enregistré" : "Merci pour votre engagement"}</h1>
          <p className="eng-intro" style={{ textAlign: "center" }}>
            {etat === "deja"
              ? "Cette adresse e-mail a déjà exprimé le souhait de s'engager. Nous reviendrons vers vous très prochainement."
              : "Merci d'avoir fait ce beau choix et d'avoir exprimé votre souhait de vous engager au sein de la fraternité du Sacerdoce Royal. Votre demande a bien été reçue ; un membre de l'équipe vous recontactera avec les prochaines étapes."}
          </p>
          <p className="eng-sign">Bien fraternellement, l'équipe du Sacerdoce Royal</p>
        </div>
      </div>
    );
  }

  const busy = etat === "envoi";

  return (
    <div className="eng-shell">
      <form className="eng-card" onSubmit={submit}>
        <Brandbar />
        <div className="eng-head">
          <h1 className="eng-title">Je souhaite m'engager</h1>
          <p className="eng-intro">
            Laissez vos coordonnées pour rejoindre la fraternité du Sacerdoce Royal. Un membre de l'équipe vous
            recontactera avec les prochaines étapes.
          </p>
          {activite && (
            <span className="eng-context">
              <span className="eng-context-dot" aria-hidden="true" />
              Dans le cadre de : {activite}
            </span>
          )}
        </div>

        <div className="eng-form">
          <label className="eng-field">
            <span>Adresse e-mail *</span>
            <input className="eng-input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
          </label>
          <div className="eng-row">
            <label className="eng-field">
              <span>Prénom(s)</span>
              <input className="eng-input" autoComplete="given-name" value={prenoms} onChange={(e) => setPrenoms(e.target.value)} placeholder="Vos prénoms" />
            </label>
            <label className="eng-field">
              <span>Nom de famille</span>
              <input className="eng-input" autoComplete="family-name" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="NOM" style={{ textTransform: "uppercase" }} />
            </label>
          </div>
          <label className="eng-field">
            <span>Indicatif du pays{telephone.trim() ? " *" : ""}</span>
            <PaysIndicatifCombo indicatif={indicatif} onChange={setIndicatif} placeholder="Sélectionnez le pays et l'indicatif" />
          </label>
          <label className="eng-field">
            <span>Téléphone</span>
            <input className="eng-input" type="tel" inputMode="tel" autoComplete="tel-national" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Numéro sans l'indicatif" />
          </label>

          {erreur && <p className="eng-error">{erreur}</p>}
          <button type="submit" className="eng-cta" disabled={busy || !email}>
            {busy ? "Envoi en cours..." : "Valider mon engagement"}
          </button>
          <p className="eng-note">Vos données servent uniquement à vous recontacter. Elles ne sont jamais partagées.</p>
        </div>
      </form>
    </div>
  );
}
