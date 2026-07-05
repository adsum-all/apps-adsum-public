import { useEffect, useState } from "react";

import {
  ApiError,
  type EventCard,
  type Identite,
  emarger,
  getEventCard,
  identifier,
} from "../emargement.js";

// A short, extensible list of dial codes as a convenience datalist. The field
// stays free-text so any country works; the server normalizes the value.
const INDICATIFS = ["+33", "+225", "+1", "+229", "+228", "+237", "+233", "+234", "+221", "+32", "+41", "+44"];

type Etape = "identite" | "questionnaire" | "confirme";

export function Emargement({ evenementId }: { evenementId: string }): JSX.Element {
  const [event, setEvent] = useState<EventCard | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreurEvent, setErreurEvent] = useState<string | null>(null);

  useEffect(() => {
    let vivant = true;
    getEventCard(evenementId)
      .then((e) => vivant && setEvent(e))
      .catch((e: unknown) => vivant && setErreurEvent(e instanceof ApiError ? e.message : "Lien indisponible."))
      .finally(() => vivant && setChargement(false));
    return () => {
      vivant = false;
    };
  }, [evenementId]);

  return (
    <div className="emarg-wrap">
      <header className="emarg-head">
        <span className="brand">ADSUM</span>
        <span className="nav-tag">Émargement</span>
      </header>
      <main className="emarg-main">
        {chargement && <p className="emarg-muted">Chargement...</p>}
        {!chargement && erreurEvent && (
          <div className="emarg-card">
            <h1>Lien indisponible</h1>
            <p className="emarg-muted">{erreurEvent}</p>
          </div>
        )}
        {!chargement && event && <Flux event={event} evenementId={evenementId} />}
      </main>
      <footer className="emarg-foot">Présence enregistrée côté serveur. Un seul émargement par personne.</footer>
    </div>
  );
}

function Flux({ event, evenementId }: { event: EventCard; evenementId: string }): JSX.Element {
  const [etape, setEtape] = useState<Etape>("identite");
  const [identite, setIdentite] = useState<Identite | null>(null);
  const [statutFinal, setStatutFinal] = useState<string | null>(null);

  const debut = event.debut ? new Date(event.debut).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : null;

  return (
    <div className="emarg-card">
      <p className="emarg-eyebrow">Activité</p>
      <h1>{event.titre}</h1>
      <p className="emarg-muted">
        {[event.lieu, debut].filter(Boolean).join(" - ")}
      </p>

      {event.cloture ? (
        <p className="emarg-banner emarg-ko">L&apos;émargement de cette activité est clôturé.</p>
      ) : !event.ouvert ? (
        <p className="emarg-banner">L&apos;émargement ouvrira au début de l&apos;activité.</p>
      ) : etape === "identite" ? (
        <Identification
          evenementId={evenementId}
          onIdentifie={(id) => {
            setIdentite(id);
            setEtape(id.deja_enregistre ? "confirme" : "questionnaire");
            if (id.deja_enregistre) setStatutFinal(id.statut);
          }}
        />
      ) : etape === "questionnaire" && identite ? (
        <Questionnaire
          evenementId={evenementId}
          identite={identite}
          onEmarge={(statut) => {
            setStatutFinal(statut);
            setEtape("confirme");
          }}
        />
      ) : (
        <Confirmation identite={identite} statut={statutFinal} />
      )}
    </div>
  );
}

function Identification({
  evenementId,
  onIdentifie,
}: {
  evenementId: string;
  onIdentifie: (id: Identite) => void;
}): JSX.Element {
  const [indicatif, setIndicatif] = useState("+33");
  const [telephone, setTelephone] = useState("");
  const [nom, setNom] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!telephone.trim() || !nom.trim()) {
      setErreur("Indiquez votre numéro et votre nom de famille.");
      return;
    }
    setBusy(true);
    setErreur(null);
    try {
      const id = await identifier(evenementId, { indicatif: indicatif.trim(), telephone: telephone.trim(), nom: nom.trim() });
      onIdentifie(id);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="emarg-form" onSubmit={soumettre}>
      <p className="emarg-step">Identifiez-vous pour confirmer votre présence.</p>
      <div className="emarg-row">
        <label className="emarg-field emarg-indic">
          <span>Indicatif</span>
          <input
            list="indicatifs"
            value={indicatif}
            onChange={(e) => setIndicatif(e.target.value)}
            inputMode="tel"
            placeholder="+33"
          />
          <datalist id="indicatifs">
            {INDICATIFS.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </label>
        <label className="emarg-field emarg-tel">
          <span>Numéro de téléphone</span>
          <input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
          />
        </label>
      </div>
      <label className="emarg-field">
        <span>Nom de famille</span>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value.toUpperCase())}
          autoComplete="family-name"
          placeholder="VOTRE NOM"
          style={{ textTransform: "uppercase" }}
        />
      </label>
      {erreur && <p className="emarg-banner emarg-ko">{erreur}</p>}
      <button type="submit" className="btn btn-primary emarg-cta" disabled={busy}>
        {busy ? "Vérification..." : "M'identifier"}
      </button>
    </form>
  );
}

function Questionnaire({
  evenementId,
  identite,
  onEmarge,
}: {
  evenementId: string;
  identite: Identite;
  onEmarge: (statut: string) => void;
}): JSX.Element {
  const [statut, setStatut] = useState("present");
  const [modalite, setModalite] = useState("presentiel");
  const [avis, setAvis] = useState("");
  const [note, setNote] = useState(0);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const nomAffiche = [identite.prenom, identite.nom].filter(Boolean).join(" ");

  async function soumettre(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setErreur(null);
    try {
      const res = await emarger(evenementId, {
        token: identite.token,
        statut,
        modalite: statut === "absent" ? null : modalite,
        avis: avis.trim() || null,
        note: note > 0 ? note : null,
      });
      onEmarge(res.statut);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="emarg-form" onSubmit={soumettre}>
      <div className="emarg-ident">
        <span className="emarg-ident-nom">{nomAffiche}</span>
        <span className="emarg-muted">{identite.matricule}</span>
      </div>
      <fieldset className="emarg-fieldset">
        <legend>Votre présence</legend>
        {[
          ["present", "Présent"],
          ["partiel", "Partiel"],
          ["absent", "Absent"],
        ].map(([v, l]) => (
          <label key={v} className={`emarg-choice ${statut === v ? "emarg-choice-on" : ""}`}>
            <input type="radio" name="statut" value={v} checked={statut === v} onChange={() => setStatut(v)} />
            {l}
          </label>
        ))}
      </fieldset>
      {statut !== "absent" && (
        <fieldset className="emarg-fieldset">
          <legend>Comment avez-vous suivi ?</legend>
          {[
            ["presentiel", "En présentiel"],
            ["en_ligne", "En ligne"],
          ].map(([v, l]) => (
            <label key={v} className={`emarg-choice ${modalite === v ? "emarg-choice-on" : ""}`}>
              <input type="radio" name="modalite" value={v} checked={modalite === v} onChange={() => setModalite(v)} />
              {l}
            </label>
          ))}
        </fieldset>
      )}
      <label className="emarg-field">
        <span>Un mot (facultatif)</span>
        <textarea value={avis} onChange={(e) => setAvis(e.target.value)} rows={2} maxLength={2000} placeholder="Votre ressenti..." />
      </label>
      <div className="emarg-field">
        <span>Note (facultatif)</span>
        <div className="emarg-notes">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`emarg-note ${note >= n ? "emarg-note-on" : ""}`}
              onClick={() => setNote(note === n ? 0 : n)}
              aria-label={`${n} sur 5`}
            >
              *
            </button>
          ))}
        </div>
      </div>
      {erreur && <p className="emarg-banner emarg-ko">{erreur}</p>}
      <button type="submit" className="btn btn-primary emarg-cta" disabled={busy}>
        {busy ? "Enregistrement..." : "Confirmer ma présence"}
      </button>
    </form>
  );
}

function Confirmation({ identite, statut }: { identite: Identite | null; statut: string | null }): JSX.Element {
  const label = statut === "absent" ? "Absence enregistrée" : statut === "partiel" ? "Présence partielle enregistrée" : "Présence enregistrée";
  return (
    <div className="emarg-done">
      <div className="emarg-check">OK</div>
      <h2>{label}</h2>
      {identite && (
        <p className="emarg-muted">
          {[identite.prenom, identite.nom].filter(Boolean).join(" ")} - {identite.matricule}
        </p>
      )}
      <p className="emarg-muted">Merci, votre émargement est pris en compte. Il ne peut être soumis qu&apos;une fois.</p>
    </div>
  );
}
