# Dockerfile — kg-cui-vault-host scaffold container.
#
# NOT a production deployment. Operators wanting to deploy production
# defense-grade CUI vault hosting need to:
#   1. Replace vault-store.mjs with FIPS-140-3-validated KMS adapter
#      (Azure Government Key Vault, AWS GovCloud KMS, or on-prem HSM)
#   2. Add TLS termination at a load balancer
#   3. Add structured logging + audit-stream emission per request
#   4. Add authn/authz middleware (mTLS or OIDC)
#   5. Run on hardened OS image (RHEL CIS / Ubuntu STIG)
#   6. Subject to your DCSA-approved IS-1 system security plan
#
# This image is for development + integration testing only.

FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund --omit=dev

COPY src/ ./src/

ENV NODE_ENV=production
EXPOSE 7443
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:7443/health || exit 1

USER node
CMD ["node", "src/server.mjs"]
