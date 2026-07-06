import { useState } from "react";

import { PAYS } from "../countries.js";
import { PaysIndicatifCombo } from "./PaysIndicatifCombo.js";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://adsum-api.vercel.app";

type Etat = "saisie" | "envoi" | "succes" | "deja" | "erreur";

function Brandbar(): JSX.Element {
  return (
    <header className="em-brandbar">
      <div className="em-logo">A</div>
      <div className="em-brandtext">
        <span className="em-b1">ADSUM</span>
        <span className="em-b2">Sacerdoce Royal</span>
      </div>
    </header>
  );
}

/**
 * Public "I want to engage" form, opened by scanning the engagement QR at a public
 * event. Very short: e-mail (required), first name, family name and one phone number
 * with a searchable country dialling code. The person becomes an engagement lead,
 * not yet a member; an internal team converts them later. E-mail is unique.
 */
export function Engagement({ evenementId }: { evenementId: string | null }): JSX.Element {
  const [email, setEmail] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [nom, setNom] = useState("");
  const [indicatif, setIndicatif] = useState("+225");
  const [telephone, setTelephone] = useState("");
  const [etat, setEtat] = useState<Etat>("saisie");
  const [erreur, setErreur] = useState<string | null>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email.includes("@")) {
      setErreur("Veuillez saisir une adresse e-mail valide.");
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
          telephone: telephone.trim() ? `${indicatif} ${telephone.trim()}` : null,
          pays_indicatif: indicatif,
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
      <main className="em-main">
        <Brandbar />
        <div className="em-hero em-center">
          <h1 className="em-title">{etat === "deja" ? "Vous êtes déjà enregistré" : "Merci pour votre engagement"}</h1>
          <p className="em-muted">
            {etat === "deja"
              ? "Cette adresse e-mail a déjà exprimé le souhait de s'engager. Nous reviendrons vers vous très prochainement."
              : "Merci d'avoir fait ce beau choix et d'avoir exprimé votre souhait de vous engager au sein de la fraternité du Sacerdoce Royal. Votre demande a bien été reçue. Nous reviendrons vers vous très prochainement avec les prochaines étapes."}
          </p>
          <p className="em-muted em-center">Bien fraternellement, l'équipe du Sacerdoce Royal.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="em-main">
      <Brandbar />
      <div className="em-hero">
        <h1 className="em-title">Je souhaite m'engager</h1>
        <p className="em-muted em-center">
          Laissez vos coordonnées pour rejoindre la fraternité du Sacerdoce Royal. Un membre de l'équipe vous
          recontactera.
        </p>
      </div>
      <form className="em-form" onSubmit={submit}>
        <label className="em-field">
          <span>Adresse e-mail *</span>
          <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
        </label>
        <div className="em-row">
          <label className="em-field">
            <span>Prénom(s)</span>
            <input value={prenoms} onChange={(e) => setPrenoms(e.target.value)} placeholder="Vos prénoms" />
          </label>
          <label className="em-field">
            <span>Nom de famille</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="NOM" style={{ textTransform: "uppercase" }} />
          </label>
        </div>
        <label className="em-field">
          <span>Pays (indicatif)</span>
          <PaysIndicatifCombo indicatif={indicatif} onChange={setIndicatif} />
        </label>
        <label className="em-field">
          <span>Téléphone</span>
          <input type="tel" inputMode="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Numéro sans l'indicatif" />
        </label>

        {erreur && <p className="em-banner em-banner-ko">{erreur}</p>}
        <button type="submit" className="em-cta" disabled={etat === "envoi" || !email}>
          {etat === "envoi" ? "Envoi..." : "Valider mon engagement"}
        </button>
      </form>
    </main>
  );
}
