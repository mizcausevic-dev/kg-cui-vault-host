# kg-cui-vault-host

> **SCAFFOLD-ONLY** productized host for the [`cui-data-vault-contract-profile`](https://github.com/mizcausevic-dev/cui-data-vault-contract-profile) schema. Implements the runtime API surface (resolve · tokenize · detokenize) + ships a Dockerfile, Kubernetes deployment manifest, and OpenAPI 3.0 spec. Aimed at DIB contractors needing a defense-grade vault that enforces the **3-axis CUI × export-control × foreign-person** policy at runtime.

Part of the [Kinetic Gain Protocol Suite](https://suite.kineticgain.com).

> ⚠️ **NOT PRODUCTION.** This is a scaffold + integration-testing harness. Operators wanting to deploy a production defense-grade CUI vault must replace `vault-store.mjs` with a FIPS-140-3-validated KMS adapter, add TLS termination, structured audit-stream emission, authn/authz middleware, and hardened OS imaging. See the operator deployment checklist in `docs/`.

## What's in the scaffold

| File | Purpose |
| --- | --- |
| `src/server.mjs` | Minimal Node HTTP server demonstrating the API surface (5 endpoints) |
| `src/policy-engine.mjs` | Inlined N-axis policy resolver (same shape as [`kg-suite-vault-contract-resolver`](https://github.com/mizcausevic-dev/kg-suite-vault-contract-resolver)) |
| `src/vault-store.mjs` | In-memory token store. **Replace in production** with KMS-backed adapter |
| `docker/Dockerfile` | Non-root, Alpine-based, healthcheck-equipped container image |
| `k8s/deployment.yaml` | Deployment + Service with security context (runAsNonRoot, readOnlyRootFilesystem, no caps) |
| `docs/openapi.yaml` | OpenAPI 3.0.3 spec for the 5 endpoints |

## API surface (5 endpoints)

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/health` | GET | Liveness probe |
| `/contract` | GET | Return the active vault contract (axes + per-tier policies) |
| `/resolve` | POST | Resolve a tier tuple against the N-axis contract → returns resolved policy |
| `/tokenize` | POST | Tokenize plaintext into a vault target → returns token |
| `/detokenize` | POST | Detokenize a token (audit-logged; denies on target mismatch / unknown) |

```bash
npm install && npm start
# → kg-cui-vault-host scaffold listening on :7443 — NOT PRODUCTION

curl -X POST localhost:7443/resolve \
  -H 'content-type: application/json' \
  -d '{"tierTuple": {"cui":"CUI-BASIC", "export_control":"NOT-EXPORT-CONTROLLED", "foreign_person":"US-PERSON-ONLY"}}'
# → {"resolved_allowed_actions":["read","search","generate"], "resolved_minimum_human_user_status":"us-person-verified", "requires_audit_stream_event":true}
```

## Operator deployment checklist (production hardening)

Before deploying to a DIB-contractor environment touching real CUI / ITAR / classified data:

- [ ] **Replace `vault-store.mjs`** with an adapter to Azure Government Key Vault, AWS GovCloud KMS, or on-prem FIPS-140-3 HSM
- [ ] **Add TLS termination** at a load balancer (no plaintext HTTP, ever)
- [ ] **Add authn/authz middleware** (mTLS with KG-signed client certs, or OIDC w/ short-lived tokens)
- [ ] **Emit audit-stream events** on every `/detokenize` to a sibling [`defense-decision-record-audit-stream`](https://github.com/mizcausevic-dev/defense-decision-record-audit-stream) endpoint
- [ ] **Add rate limiting + denial-of-service protection** at the ingress
- [ ] **Add NetworkPolicy** preventing pod outbound egress except to KMS + audit-stream
- [ ] **Run on hardened OS image** (RHEL CIS or Ubuntu STIG)
- [ ] **Subject to your DCSA-approved IS-1 system security plan**
- [ ] **CMMC L2/L3 readiness** evidence collected into [`cmmc-l2-l3-readiness-evidence-bundle`](https://github.com/mizcausevic-dev/cmmc-l2-l3-readiness-evidence-bundle)

## Composes with

- [`cui-data-vault-contract-profile`](https://github.com/mizcausevic-dev/cui-data-vault-contract-profile) — the schema this scaffolds a runtime for
- [`kg-suite-vault-contract-resolver`](https://github.com/mizcausevic-dev/kg-suite-vault-contract-resolver) — the policy resolver shipped inline here
- [`defense-decision-record-audit-stream`](https://github.com/mizcausevic-dev/defense-decision-record-audit-stream) — production endpoint must emit events to this stream
- [`defense-decision-record-audit-stream-reference`](https://github.com/mizcausevic-dev/defense-decision-record-audit-stream-reference) — companion reference impl for the audit-stream layer
- [Kinetic Gain Embedded](https://kineticgain.com/embedded) — the broader KGE product lane this fits under
- [Kinetic Gain Protocol Suite](https://suite.kineticgain.com) — umbrella

## Compliance posture

**Scaffold-only readiness scaffolding** for DFARS / CMMC / NIST 800-171/172 / ITAR / EAR / DCSA IS-1. Does NOT constitute a deployable product without the operator hardening steps above. The in-memory `vault-store.mjs` is NOT FIPS-140 validated. Per the standing Suite public-language guardrail: *readiness · evidence · posture · controls · scaffolding* — never "compliant" / "certified" without external attestation.

## License

AGPL-3.0-only. The scaffold encourages operators to ship their hardened deployments back to the community under the same license.
