import { generateKeyPair, signQrToken, verifyQrToken, type VerifyResult } from "@adsum/qr";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

// Live cryptographic demonstrator of the core ADSUM mechanism: a member QR token
// is signed with Ed25519, rendered as a real QR, and verified offline. Tampering
// with one byte invalidates the signature. No fictional member data: the member
// is represented by a real generated UUID, the label is free user input.

interface DemoState {
  token: string;
  membreId: string;
  jetonId: string;
  result: VerifyResult | null;
}

function newIds(): { membreId: string; jetonId: string } {
  return { membreId: crypto.randomUUID(), jetonId: crypto.randomUUID() };
}

export function QrDemo(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keyRef = useRef(generateKeyPair());
  const [label, setLabel] = useState("");
  const [state, setState] = useState<DemoState | null>(null);

  const issue = useCallback(() => {
    const { membreId, jetonId } = newIds();
    const token = signQrToken({
      membreId,
      jetonId,
      versionCle: 1,
      privateKey: keyRef.current.privateKey,
    });
    setState({ token, membreId, jetonId, result: null });
  }, []);

  useEffect(() => {
    issue();
  }, [issue]);

  useEffect(() => {
    if (state && canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, state.token, { width: 232, margin: 1 });
    }
  }, [state]);

  const verify = useCallback(() => {
    if (!state) return;
    const result = verifyQrToken(state.token, { 1: keyRef.current.publicKey });
    setState({ ...state, result });
  }, [state]);

  const tamper = useCallback(() => {
    if (!state) return;
    const flipped = state.token.slice(0, 8) + (state.token[8] === "A" ? "B" : "A") + state.token.slice(9);
    const result = verifyQrToken(flipped, { 1: keyRef.current.publicKey });
    setState({ ...state, result });
  }, [state]);

  return (
    <div className="demo">
      <div className="demo-qr">
        <canvas ref={canvasRef} width={232} height={232} aria-label="QR signe" />
      </div>
      <div className="demo-controls">
        <label className="demo-field">
          <span>Libelle (facultatif)</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex: carte de membre" />
        </label>
        <p className="demo-id">membre&nbsp;: <code>{state?.membreId ?? "..."}</code></p>
        <div className="demo-actions">
          <button type="button" className="btn btn-primary" onClick={issue}>Emettre un QR signe</button>
          <button type="button" className="btn" onClick={verify}>Verifier</button>
          <button type="button" className="btn btn-ghost" onClick={tamper}>Falsifier 1 octet</button>
        </div>
        {state?.result && (
          <p className={`demo-result ${state.result.valid ? "ok" : "ko"}`}>
            {state.result.valid
              ? `Signature valide. Jeton ${state.result.fields.jetonId.slice(0, 8)}, cle v${state.result.fields.versionCle}.`
              : `Rejete: ${state.result.reason}.`}
          </p>
        )}
        <p className="demo-note">
          Signature Ed25519 reelle, verifiee dans votre navigateur, hors-ligne. Cle publique embarquee, cle privee
          jamais exposee. C'est le mecanisme exact du pointage ADSUM.
        </p>
      </div>
    </div>
  );
}
