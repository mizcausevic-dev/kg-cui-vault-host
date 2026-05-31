import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePolicy } from "../src/policy-engine.mjs";
import { tokenize, detokenize, listTarget, _clear } from "../src/vault-store.mjs";

const TEST_AXES = [
  { name: "cui",            policies: { "CUI-BASIC": { allowed_actions: ["read","search"], minimum_human_user_status: "us-person-verified", requires_audit_stream_event: true } } },
  { name: "export_control", policies: { "ITAR":      { allowed_actions: ["read"],          minimum_human_user_status: "us-person-verified", requires_distribution_statement: true } } },
  { name: "foreign_person", policies: { "US-PERSON-ONLY": { allowed_actions: ["read","search","generate"], minimum_human_user_status: "us-person-verified", requires_audit_stream_event: true } } }
];

test("resolvePolicy intersects to most-restrictive (read only)", () => {
  const r = resolvePolicy({ axes: TEST_AXES, tierTuple: { cui: "CUI-BASIC", export_control: "ITAR", foreign_person: "US-PERSON-ONLY" } });
  assert.deepEqual(r.resolved_allowed_actions, ["read"]);
  assert.equal(r.resolved_minimum_human_user_status, "us-person-verified");
  assert.equal(r.requires_distribution_statement, true);
  assert.equal(r.requires_audit_stream_event, true);
});

test("tokenize + detokenize round-trips", () => {
  _clear();
  const token = tokenize("secret_data_42", "vault-test", "agent-1");
  assert.ok(token.startsWith("tok_vault-test_"));
  const r = detokenize(token, "vault-test", "agent-2");
  assert.equal(r.ok, true);
  assert.equal(r.plaintext, "secret_data_42");
  assert.ok(r.audit.detokenized_by === "agent-2");
});

test("detokenize denied on target mismatch", () => {
  _clear();
  const token = tokenize("x", "vault-a", "agent-1");
  const r = detokenize(token, "vault-b", "agent-1");
  assert.equal(r.ok, false);
  assert.match(r.reason, /target mismatch/);
});

test("detokenize denied on unknown token", () => {
  _clear();
  const r = detokenize("tok_vault-test_bogus", "vault-test", "agent-1");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "token not found");
});

test("listTarget returns tokens for that target only", () => {
  _clear();
  tokenize("a", "vault-x", "agent-1");
  tokenize("b", "vault-x", "agent-1");
  tokenize("c", "vault-y", "agent-1");
  assert.equal(listTarget("vault-x").length, 2);
  assert.equal(listTarget("vault-y").length, 1);
});
