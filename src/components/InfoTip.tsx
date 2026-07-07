import { useState } from "react";

/**
 * Small, accessible information hint: an "i" button next to a label that toggles a
 * short explanatory popover. Click or keyboard activated, closes on blur, so it works
 * on touch devices where the native title attribute does not. Purely presentational,
 * no external dependency, scoped by the `.info-tip*` classes in the page stylesheet.
 */
export function InfoTip({ text, label = "Information" }: { text: string; label?: string }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <span className="info-tip">
      <button
        type="button"
        className="info-tip-btn"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      {open && (
        <span role="tooltip" className="info-tip-pop">
          {text}
        </span>
      )}
    </span>
  );
}
