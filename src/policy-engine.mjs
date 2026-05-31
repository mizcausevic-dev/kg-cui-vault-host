// policy-engine.mjs — Inlined N-axis resolver (same shape as kg-suite-vault-contract-resolver).

export function resolvePolicy({ axes, tierTuple }) {
  const policies = axes.map((axis) => {
    const tier = tierTuple[axis.name];
    if (tier === undefined) throw new Error(`tierTuple missing axis "${axis.name}"`);
    const p = axis.policies[tier];
    if (p === undefined) throw new Error(`axis "${axis.name}" tier "${tier}" not declared`);
    return { axis: axis.name, tier, policy: p };
  });
  const actionSets = policies.map((p) => new Set(p.policy.allowed_actions ?? []));
  const intersected = [...actionSets[0]].filter((a) => actionSets.every((s) => s.has(a)));
  const statusRank = ["any","us-person-verified","authorized-foreign-person-with-license","secret-clearance","top-secret-clearance","ts-sci-clearance"];
  const maxStatusIdx = Math.max(...policies.map((p) => statusRank.indexOf(p.policy.minimum_human_user_status ?? "any")));
  const reqs = {};
  for (const p of policies) for (const k of Object.keys(p.policy)) if (k.startsWith("requires_")) reqs[k] = (reqs[k] || p.policy[k] === true);
  return { resolved_allowed_actions: intersected, resolved_minimum_human_user_status: statusRank[maxStatusIdx], ...reqs };
}
