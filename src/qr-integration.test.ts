import { generateKeyPair, signQrToken, verifyQrToken } from "@adsum/qr";
import { describe, expect, it } from "vitest";

// Proves adsum-public really consumes the published @adsum/qr package end to end.
describe("@adsum/qr integration in adsum-public", () => {
  it("signs and verifies a member token", () => {
    const kp = generateKeyPair();
    const token = signQrToken({
      membreId: crypto.randomUUID(),
      jetonId: crypto.randomUUID(),
      versionCle: 1,
      privateKey: kp.privateKey,
    });
    const result = verifyQrToken(token, { 1: kp.publicKey });
    expect(result.valid).toBe(true);
  });

  it("rejects a token verified with the wrong key", () => {
    const signer = generateKeyPair();
    const other = generateKeyPair();
    const token = signQrToken({
      membreId: crypto.randomUUID(),
      jetonId: crypto.randomUUID(),
      versionCle: 1,
      privateKey: signer.privateKey,
    });
    expect(verifyQrToken(token, { 1: other.publicKey }).valid).toBe(false);
  });
});
