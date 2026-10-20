import type { Item } from "./types";

const templates = [
  { code: "CMP", category: "Compliance", title: "Regulatory compliance attestation", owner: "Alex Morgan", action: "Review compliance evidence" },
  { code: "ELG", category: "Eligibility", title: "Member eligibility reconciliation", owner: "Maya Chen", action: "Reconcile enrollment discrepancies" },
  { code: "CRD", category: "Credentialing", title: "Provider credentialing audit", owner: "Jon Bell", action: "Validate provider credentials" },
  { code: "CLM", category: "Claims", title: "Claims timeliness review", owner: "Sam Lee", action: "Review claims aging report" },
  { code: "NET", category: "Provider Network", title: "Network adequacy assessment", owner: "Dana Wright", action: "Validate network coverage" },
  { code: "QLM", category: "Quality Management", title: "Quality performance submission", owner: "Priya Shah", action: "Validate quality measure totals" },
  { code: "UTL", category: "Utilization Management", title: "Authorization turnaround audit", owner: "Maya Chen", action: "Review authorization decisions" },
  { code: "FIN", category: "Finance", title: "Capitation payment reconciliation", owner: "Alex Morgan", action: "Reconcile payment control totals" },
  { code: "MEM", category: "Member Services", title: "Member grievance reporting", owner: "Sam Lee", action: "Review grievance resolution evidence" },
  { code: "DAT", category: "Data Reporting", title: "Encounter data completeness review", owner: "Priya Shah", action: "Validate encounter submission file" },
];

const payers = ["Northstar Health", "Meridian Choice", "HarborCare", "Summit Advantage", "Summit Health Plan", "Horizon Care", "Evergreen Health", "Pacific Health Partners"];
const stages = [
  { execution: "Not started", deadline: "Upcoming", verification: "Pending", risk: "Low", day: 28 },
  { execution: "In progress", deadline: "On track", verification: "Pending", risk: "Medium", day: 20 },
  { execution: "In progress", deadline: "At risk", verification: "Pending", risk: "High", day: 8 },
  { execution: "Blocked", deadline: "Overdue", verification: "Pending", risk: "Critical", day: 1 },
  { execution: "Submitted / awaiting verification", deadline: "On track", verification: "Pending", risk: "Medium", day: 22 },
  { execution: "Submitted / awaiting verification", deadline: "At risk", verification: "Failed", risk: "High", day: 7 },
  { execution: "Not started", deadline: "Upcoming", verification: "Not required", risk: "Medium", day: 29 },
  { execution: "In progress", deadline: "On track", verification: "Pending", risk: "High", day: 25 },
];

// Ten obligation types across eight payers add 80 open sample occurrences.
export const additionalObligations: Item[] = templates.flatMap((template, templateIndex) =>
  payers.map((payer, payerIndex) => {
    const index = templateIndex * payers.length + payerIndex;
    const stage = stages[(templateIndex + payerIndex) % stages.length];
    const owner = index % 13 === 0 ? "Unassigned" : template.owner;
    const next = owner === "Unassigned" ? "Assign accountable owner"
      : stage.verification === "Failed" ? "Resolve rejected evidence and resubmit"
      : stage.execution === "Blocked" ? "Resolve missing source data"
      : stage.execution === "Submitted / awaiting verification" ? "Await reviewer approval"
      : template.action;
    return {
      id: `${template.code}-SEED-2026-${String(index + 1).padStart(3, "0")}`,
      title: `${template.title} - ${payer}`,
      category: template.category,
      payer,
      period: "April 2026",
      due: `May ${stage.day}, 2026 · 5:00 PM ET`,
      owner,
      ...stage,
      next,
    };
  }),
);
