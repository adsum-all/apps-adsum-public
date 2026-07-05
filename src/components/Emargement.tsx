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

type Etape = "accueil" | "identite" | "questionnaire" | "confirme";

function formatDate(iso: string | null): { jour: string; heure: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString("fr-FR"),
    heure: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

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
    <div className="emargement">
      <header className="em-topbar">
        <span className="em-brand">ADSUM</span>
        <span className="em-topbar-tag">Pointage présence</span>
      </header>
      <main className="em-main">
        {chargement && <p className="em-muted em-center">Chargement...</p>}
        {!chargement && erreurEvent && (
          <div className="em-card em-pad">
            <h1 className="em-h1">Lien indisponible</h1>
            <p className="em-muted">{erreurEvent}</p>
          </div>
        )}
        {!chargement && event && <Flux event={event} evenementId={evenementId} />}
      </main>
      <footer className="em-footer">Présence enregistrée côté serveur. Un seul pointage par personne, tous canaux confondus.</footer>
    </div>
  );
}

function Flux({ event, evenementId }: { event: EventCard; evenementId: string }): JSX.Element {
  const [etape, setEtape] = useState<Etape>("accueil");
  const [identite, setIdentite] = useState<Identite | null>(null);
  const [statutFinal, setStatutFinal] = useState<string | null>(null);

  const debut = formatDate(event.debut);
  const fin = formatDate(event.fin);

  function onIdentifie(id: Identite): void {
    setIdentite(id);
    if (id.deja_enregistre) {
      setStatutFinal(id.statut);
      setEtape("confirme");
    } else {
      setEtape("questionnaire");
    }
  }

  if (etape === "confirme") {
    return (
      <div className="em-card em-pad">
        <Confirmation identite={identite} statut={statutFinal} />
      </div>
    );
  }

  if (etape === "identite") {
    return (
      <div className="em-card em-pad">
        <button type="button" className="em-back" onClick={() => setEtape("accueil")}>&larr; Retour</button>
        <Identification evenementId={evenementId} onIdentifie={onIdentifie} />
      </div>
    );
  }

  if (etape === "questionnaire" && identite) {
    return (
      <div className="em-card em-pad">
        <Questionnaire
          evenementId={evenementId}
          identite={identite}
          onEmarge={(statut) => {
            setStatutFinal(statut);
            setEtape("confirme");
          }}
        />
      </div>
    );
  }

  // Accueil: la carte de l'activite + le bouton d'entree.
  return (
    <div className="em-card">
      <div className="em-hero">
        <div className="em-badges">
          <span className={`em-badge ${event.cloture ? "em-badge-off" : "em-badge-on"}`}>
            <span className="em-dot" /> {event.cloture ? "Pointage clôturé" : event.ouvert ? "Pointage ouvert" : "Pas encore ouvert"}
          </span>
          <span className="em-badge em-badge-neutral">{event.en_ligne ? "En ligne" : "Présentiel"}</span>
        </div>
        <h1 className="em-title">{event.titre}</h1>
      </div>

      <div className="em-info">
        {debut && (
          <div className="em-info-card">
            <span className="em-info-label">Début</span>
            <span className="em-info-value">{debut.jour}</span>
            <span className="em-info-time">{debut.heure}</span>
          </div>
        )}
        {fin && (
          <div className="em-info-card">
            <span className="em-info-label">Fin</span>
            <span className="em-info-value">{fin.jour}</span>
            <span className="em-info-time">{fin.heure}</span>
          </div>
        )}
      </div>
      {event.lieu && (
        <div className="em-info-lieu">
          <span className="em-info-label">Lieu</span>
          <span className="em-info-value">{event.lieu}</span>
        </div>
      )}

      <div className="em-pad-btn">
        {event.cloture ? (
          <p className="em-banner em-banner-ko">Le pointage de cette activité est clôturé.</p>
        ) : !event.ouvert ? (
          <p className="em-banner">Le pointage ouvrira au début de l&apos;activité.</p>
        ) : (
          <>
            <button type="button" className="em-cta" onClick={() => setEtape("identite")}>
              Marquer ma présence
            </button>
            <p className="em-hint">Votre matricule vous sera demandé.</p>
          </>
        )}
      </div>
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
  const [mode, setMode] = useState<"matricule" | "telephone">("matricule");
  const [matricule, setMatricule] = useState("");
  const [indicatif, setIndicatif] = useState("+33");
  const [telephone, setTelephone] = useState("");
  const [nom, setNom] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErreur(null);
    if (mode === "matricule") {
      if (!matricule.trim()) {
        setErreur("Saisissez votre matricule.");
        return;
      }
    } else if (!telephone.trim() || !nom.trim()) {
      setErreur("Indiquez votre numéro et votre nom de famille.");
      return;
    }
    setBusy(true);
    try {
      const id =
        mode === "matricule"
          ? await identifier(evenementId, { matricule: matricule.trim() })
          : await identifier(evenementId, { indicatif: indicatif.trim(), telephone: telephone.trim(), nom: nom.trim() });
      onIdentifie(id);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="em-form" onSubmit={soumettre}>
      {mode === "matricule" ? (
        <>
          <div className="em-key">🔑</div>
          <h2 className="em-h2">Votre matricule</h2>
          <p className="em-muted em-center">
            Saisissez le matricule membre qui vous a été attribué et communiqué. Si vous ne l&apos;avez pas,
            rapprochez-vous d&apos;un berger.
          </p>
          <label className="em-field">
            <span>Matricule membre</span>
            <input
              value={matricule}
              onChange={(e) => setMatricule(e.target.value.toUpperCase())}
              placeholder="ADS-000000"
              inputMode="text"
              autoComplete="off"
              style={{ textTransform: "uppercase" }}
            />
          </label>
          {erreur && <p className="em-banner em-banner-ko">{erreur}</p>}
          <button type="submit" className="em-cta" disabled={busy}>
            {busy ? "Vérification..." : "Valider"}
          </button>
          <button type="button" className="em-link" onClick={() => { setMode("telephone"); setErreur(null); }}>
            Je n&apos;ai pas mon matricule - utiliser mon numéro de téléphone
          </button>
        </>
      ) : (
        <>
          <h2 className="em-h2">Numéro et nom</h2>
          <p className="em-muted em-center">Identifiez-vous avec votre indicatif, votre numéro et votre nom de famille.</p>
          <div className="em-row">
            <label className="em-field em-indic">
              <span>Indicatif</span>
              <input list="indicatifs" value={indicatif} onChange={(e) => setIndicatif(e.target.value)} inputMode="tel" placeholder="+33" />
              <datalist id="indicatifs">
                {INDICATIFS.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </label>
            <label className="em-field em-tel">
              <span>Numéro de téléphone</span>
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" />
            </label>
          </div>
          <label className="em-field">
            <span>Nom de famille</span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value.toUpperCase())}
              autoComplete="family-name"
              placeholder="VOTRE NOM"
              style={{ textTransform: "uppercase" }}
            />
          </label>
          {erreur && <p className="em-banner em-banner-ko">{erreur}</p>}
          <button type="submit" className="em-cta" disabled={busy}>
            {busy ? "Vérification..." : "Valider"}
          </button>
          <button type="button" className="em-link" onClick={() => { setMode("matricule"); setErreur(null); }}>
            J&apos;ai mon matricule
          </button>
        </>
      )}
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
    <form className="em-form" onSubmit={soumettre}>
      <div className="em-ident">
        <span className="em-ident-nom">{nomAffiche}</span>
        <span className="em-muted">{identite.matricule}</span>
      </div>
      <p className="em-recognized">Nous vous avons reconnu. Confirmez votre présence.</p>

      <fieldset className="em-fieldset">
        <legend>Votre présence</legend>
        <div className="em-choices">
          {[
            ["present", "Présent"],
            ["partiel", "Partiel"],
            ["absent", "Absent"],
          ].map(([v, l]) => (
            <label key={v} className={`em-choice ${statut === v ? "em-choice-on" : ""}`}>
              <input type="radio" name="statut" value={v} checked={statut === v} onChange={() => setStatut(v)} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      {statut !== "absent" && (
        <fieldset className="em-fieldset">
          <legend>Comment avez-vous suivi ?</legend>
          <div className="em-choices">
            {[
              ["presentiel", "En présentiel"],
              ["en_ligne", "En ligne"],
            ].map(([v, l]) => (
              <label key={v} className={`em-choice ${modalite === v ? "em-choice-on" : ""}`}>
                <input type="radio" name="modalite" value={v} checked={modalite === v} onChange={() => setModalite(v)} />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className="em-field">
        <span>Un mot (facultatif)</span>
        <textarea value={avis} onChange={(e) => setAvis(e.target.value)} rows={2} maxLength={2000} placeholder="Votre ressenti..." />
      </label>
      <div className="em-field">
        <span>Note (facultatif)</span>
        <div className="em-notes">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`em-note ${note >= n ? "em-note-on" : ""}`}
              onClick={() => setNote(note === n ? 0 : n)}
              aria-label={`${n} sur 5`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      {erreur && <p className="em-banner em-banner-ko">{erreur}</p>}
      <button type="submit" className="em-cta" disabled={busy}>
        {busy ? "Enregistrement..." : "Valider ma participation"}
      </button>
    </form>
  );
}

function Confirmation({ identite, statut }: { identite: Identite | null; statut: string | null }): JSX.Element {
  const label = statut === "absent" ? "Absence enregistrée" : statut === "partiel" ? "Présence partielle enregistrée" : "Présence enregistrée";
  return (
    <div className="em-done">
      <div className="em-check" aria-hidden="true">✓</div>
      <h2 className="em-h2">{label}</h2>
      {identite && (
        <p className="em-muted em-center">
          {[identite.prenom, identite.nom].filter(Boolean).join(" ")} - {identite.matricule}
        </p>
      )}
      <p className="em-muted em-center">Merci, votre pointage est pris en compte. Il ne peut être soumis qu&apos;une fois, quel que soit le canal.</p>
    </div>
  );
}
