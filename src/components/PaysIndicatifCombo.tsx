import { useState } from "react";

import { PAYS, filtrerPays } from "../countries.js";

/**
 * Searchable country + dialling-code selector for the check-in phone step. The
 * member types the first letters of their country (accent-insensitive) or the
 * code, then selects it; the dialling code (e.g. "+33") is returned. No free
 * typing of the code, so nobody mistypes "+225" or "+33". Styled to the ADSUM
 * design system like the other form fields.
 */
export function PaysIndicatifCombo({
  indicatif,
  onChange,
  placeholder = "Choisissez votre pays",
}: {
  indicatif: string;
  onChange: (indicatif: string) => void;
  placeholder?: string;
}): JSX.Element {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  // Show the first country matching the current dialling code as the label.
  const selected = PAYS.find((p) => p.indicatif === indicatif);
  const results = (q.trim() ? filtrerPays(q) : PAYS).slice(0, 80);
  const label = selected ? `${selected.nom} (${selected.indicatif})` : "";

  return (
    <div className="em-combo">
      <input
        className="em-combo-input"
        value={open ? q : label}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQ("");
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        aria-label="Pays et indicatif"
        inputMode="text"
      />
      {open && (
        <ul className="em-combo-list">
          {results.map((p) => (
            <li key={p.code}>
              <button
                type="button"
                className="em-combo-opt"
                onMouseDown={() => {
                  onChange(p.indicatif);
                  setOpen(false);
                }}
              >
                <span>{p.nom}</span>
                <span className="em-combo-code">{p.indicatif}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="em-combo-empty">Aucun pays trouvé</li>}
        </ul>
      )}
    </div>
  );
}
