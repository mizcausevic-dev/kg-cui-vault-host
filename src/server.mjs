// server.mjs — Minimal HTTP scaffold demonstrating the API shape.
// NOT production. Real deployment uses TLS-terminated load balancer +
// service mesh + structured logging + audit-stream emission per request.

import { createServer } from "node:http";
import { resolvePolicy } from "./policy-engine.mjs";
import { tokenize, detokenize, listTarget } from "./vault-store.mjs";

const PORT = process.env.PORT || 7443;

const DEMO_CONTRACT = {
  contract_id: "DEMO-VAULT-2026Q4",
  axes: [
    { name: "cui",            policies: { "PUBLIC": { allowed_actions: ["read","search","generate"], minimum_human_user_status: "any" }, "CUI-BASIC": { allowed_actions: ["read","search"], minimum_human_user_status: "us-person-verified", requires_audit_stream_event: true }, "CUI-SPECIFIED-NOFORN": { allowed_actions: ["read"], minimum_human_user_status: "us-person-verified", requires_distribution_statement: true, requires_audit_stream_event: true } } },
    { name: "export_control", policies: { "NOT-EXPORT-CONTROLLED": { allowed_actions: ["read","search","generate"], minimum_human_user_status: "any" }, "ITAR": { allowed_actions: ["read","search"], minimum_human_user_status: "us-person-verified", requires_audit_stream_event: true } } },
    { name: "foreign_person", policies: { "US-PERSON-ONLY": { allowed_actions: ["read","search","generate"], minimum_human_user_status: "us-person-verified", requires_audit_stream_event: true }, "NO-RESTRICTION": { allowed_actions: ["read","search","generate"], minimum_human_user_status: "any" } } }
  ]
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let s = ""; for await (const c of req) s += c; return s ? JSON.parse(s) : {};
}

export const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true, version: "0.1.0" });
    if (req.method === "GET" && url.pathname === "/contract") return json(res, 200, DEMO_CONTRACT);

    if (req.method === "POST" && url.pathname === "/resolve") {
      const body = await readBody(req);
      const resolved = resolvePolicy({ axes: DEMO_CONTRACT.axes, tierTuple: body.tierTuple });
      return json(res, 200, resolved);
    }

    if (req.method === "POST" && url.pathname === "/tokenize") {
      const body = await readBody(req);
      const token = tokenize(body.plaintext, body.target_id, body.agent_id);
      return json(res, 200, { token });
    }

    if (req.method === "POST" && url.pathname === "/detokenize") {
      const body = await readBody(req);
      const result = detokenize(body.token, body.target_id, body.requester_id);
      return json(res, result.ok ? 200 : 403, result);
    }

    return json(res, 404, { error: "not found" });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
});

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  server.listen(PORT, () => console.log(`kg-cui-vault-host scaffold listening on :${PORT} — NOT PRODUCTION`));
}
