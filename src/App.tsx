import { QrDemo } from "./components/QrDemo.js";

const FEATURES = [
  {
    title: "QR signe, infalsifiable",
    body: "Chaque membre porte un QR code unique signe en Ed25519. Son contenu ne peut etre ni modifie ni falsifie, et il se verifie hors-ligne.",
  },
  {
    title: "Pointage en moins d'une seconde",
    body: "A l'entree, le controleur scanne, la fiche et la photo s'affichent, il confirme. La presence est rattachee a l'evenement du jour.",
  },
  {
    title: "Hors-ligne par conception",
    body: "Le scan fonctionne sans reseau. Les pointages sont mis en file locale puis synchronises sans doublon des le retour du reseau.",
  },
  {
    title: "Temps reel et historique",
    body: "Les tableaux de bord se mettent a jour en quelques secondes. Le parcours de chaque membre est reconstituable et exportable.",
  },
  {
    title: "Donnees minimisees",
    body: "La photo sert a la verification visuelle, pas a une reconnaissance automatique. Aucune piece d'identite n'est archivee.",
  },
  {
    title: "Autonome et portable",
    body: "Base PostgreSQL dediee, standard et portable. Chaque service externe passe par une passerelle interne, sans verrouillage fournisseur.",
  },
];

const NUMBERS = [
  { value: "10 000+", label: "membres cibles" },
  { value: "< 1 s", label: "scan vers confirmation" },
  { value: "Ed25519", label: "signature du QR" },
  { value: "0", label: "donnee fictive" },
];

export function App(): JSX.Element {
  return (
    <div className="page">
      <header className="nav">
        <span className="brand">ADSUM</span>
        <span className="nav-tag">Presence des membres</span>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Plateforme de presence et de comptage</p>
          <h1>
            Le suivi des presences, <span className="accent">fiable a cent pour cent</span>, meme hors-ligne.
          </h1>
          <p className="lede">
            ADSUM remplace les fichiers Excel par une plateforme numerique. Un QR code signe par membre, un scan
            qui fonctionne sans reseau, des statistiques en temps reel pour la direction.
          </p>
          <div className="hero-numbers">
            {NUMBERS.map((n) => (
              <div key={n.label} className="stat">
                <strong>{n.value}</strong>
                <span>{n.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="demo-section" id="demo">
          <div className="section-head">
            <h2>Le QR signe, demontre en direct</h2>
            <p>Emettez un QR, verifiez sa signature, puis falsifiez un octet et constatez le rejet. Tout se passe dans votre navigateur.</p>
          </div>
          <QrDemo />
        </section>

        <section className="features">
          <div className="section-head">
            <h2>Ce que fait ADSUM</h2>
          </div>
          <div className="grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="card">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>ADSUM</span>
        <span>Donnees reelles, zero mock. Signature et validation cote serveur.</span>
      </footer>
    </div>
  );
}
