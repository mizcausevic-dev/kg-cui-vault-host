// vault-store.mjs — In-memory + crypto.subtle token store SCAFFOLD.
//
// NOT PRODUCTION. Operators replacing this with a real backend should swap
// implementation while preserving the interface:
//
//   - tokenize(plaintext, target_id, agent_id)   → token
//   - detokenize(token, target_id, requester_id) → plaintext | denied
//   - list_target(target_id)                      → token[]
//
// In production: backend by Azure Government Key Vault or AWS GovCloud KMS
// using FIPS-140-3-validated AES-GCM; never store plaintext in memory or
// disk; log every detokenize() to the audit-stream.

import { createHash, randomBytes } from "node:crypto";

const STORE = new Map();   // token → { plaintext, target_id, created_at }

function makeToken(plaintext, target_id) {
  const seed = randomBytes(16).toString("hex");
  const h = createHash("sha256").update(`${target_id}:${plaintext}:${seed}`).digest("hex").slice(0, 16);
  return `tok_${target_id}_${h}`;
}

export function tokenize(plaintext, target_id, agent_id) {
  const token = makeToken(plaintext, target_id);
  STORE.set(token, { plaintext, target_id, created_at: new Date().toISOString(), tokenized_by: agent_id });
  return token;
}

export function detokenize(token, target_id, requester_id) {
  const e = STORE.get(token);
  if (!e) return { ok: false, reason: "token not found" };
  if (e.target_id !== target_id) return { ok: false, reason: `target mismatch (token from ${e.target_id})` };
  return { ok: true, plaintext: e.plaintext, audit: { detokenized_by: requester_id, at: new Date().toISOString() } };
}

export function listTarget(target_id) {
  return [...STORE.entries()].filter(([_, e]) => e.target_id === target_id).map(([t]) => t);
}

export function _clear() { STORE.clear(); }
