# Changelog

## [0.1] — 2026-05-31

### Added

- **SCAFFOLD-ONLY** initial release. Demonstrates the API shape for a productized host of the `cui-data-vault-contract-profile` schema. **NOT production deployable** without the hardening steps in README's operator checklist.
- `src/server.mjs` — minimal Node HTTP server with 5 endpoints (`/health`, `/contract`, `/resolve`, `/tokenize`, `/detokenize`).
- `src/policy-engine.mjs` — inlined N-axis policy resolver (same shape as `kg-suite-vault-contract-resolver`).
- `src/vault-store.mjs` — in-memory token store using SHA-256-hashed seed-randomized tokens. **NOT FIPS-140 validated.** Replace with KMS adapter in production.
- `docker/Dockerfile` — Alpine-based, non-root, healthcheck-equipped container image.
- `k8s/deployment.yaml` — Deployment + Service with hardened security context (runAsNonRoot, readOnlyRootFilesystem, all caps dropped).
- `docs/openapi.yaml` — OpenAPI 3.0.3 spec for the 5 endpoints.
- 5 unit tests covering: policy intersection, tokenize+detokenize round-trip, target-mismatch denial, unknown-token denial, listTarget per-target isolation.
- CI: Node test suite + Docker image build.

### Not yet (production gap)

- KMS adapter (Azure Government Key Vault / AWS GovCloud KMS / on-prem HSM).
- TLS termination + mTLS / OIDC authn.
- Audit-stream emission per request.
- Rate limiting + DoS protection.
- NetworkPolicy + PodSecurityPolicy.
- Hardened OS image build pipeline.
- DCSA IS-1 system security plan template.
- Helm chart (today only raw k8s YAML).
- Production runbook + incident response.
