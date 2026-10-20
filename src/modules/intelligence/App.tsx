import { useEffect, useMemo, useState } from "react";

import type { PageNavigation, Page, ProviderFilterPreset, ComplianceFilterPreset, AdequacyFilterPreset, ReferralFilterPreset, ProviderPeriodData, DetailValue, ProviderDetails, Provider, Action, WorkTask, WorkMilestone, WorkKpi, WorkRisk, WorkPlan } from './types';
export type { Page } from './types';

const counties = ["Alameda", "Contra Costa", "Marin", "Napa", "San Francisco", "San Mateo"];
const specialties = ["Primary Care", "Cardiology", "Dermatology", "Endocrinology", "Gastroenterology", "Neurology", "Orthopedics", "Behavioral Health"];
const firstNames = ["Amelia", "Benjamin", "Chloe", "Daniel", "Elena", "Farid", "Grace", "Henry", "Isabel", "James", "Katherine", "Luis", "Mei", "Noah", "Olivia", "Priya", "Quinn", "Rafael", "Sophia", "Thomas"];
const lastNames = ["Chen", "Patel", "Rodriguez", "Williams", "Nguyen", "Brooks", "Kim", "Shah", "Martinez", "Thompson", "Anderson", "Bennett", "Cruz", "Desai", "Edwards", "Foster", "Garcia", "Hernandez", "Ito", "Johnson"];
const languages = [["English", "Spanish"], ["English", "Mandarin"], ["English", "Hindi"], ["English", "Tagalog"], ["English", "Vietnamese"], ["English", "Arabic"]];
const reportingPeriods = [
  { id: "2026-Q1", short: "Q1 2026", label: "Jan 1 – Mar 31, 2026", endDate: "2026-03-31" },
  { id: "2025-Q4", short: "Q4 2025", label: "Oct 1 – Dec 31, 2025", endDate: "2025-12-31" },
  { id: "2025-Q3", short: "Q3 2025", label: "Jul 1 – Sep 30, 2025", endDate: "2025-09-30" },
  { id: "2025-Q2", short: "Q2 2025", label: "Apr 1 – Jun 30, 2025", endDate: "2025-06-30" },
  { id: "2025-Q1", short: "Q1 2025", label: "Jan 1 – Mar 31, 2025", endDate: "2025-03-31" },
];
const nav: { id: Page; label: string; short: string }[] = [
  { id: "dashboard", label: "Membership workflow", short: "EX" },
  { id: "providers", label: "Provider Directory", short: "PD" },
  { id: "compliance", label: "Preventive Care", short: "PC" },
  { id: "adequacy", label: "Network Adequacy", short: "NA" },
  { id: "dofr", label: "DOFR Risk Expansion", short: "DR" },
  { id: "referrals", label: "OON Referrals", short: "OR" },
  { id: "facilities", label: "Facility Quality", short: "FQ" },
  { id: "actions", label: "Action Tracker", short: "AT" },
  { id: "relations", label: "Provider Relations", short: "PR" },
  { id: "analytics", label: "Analytics", short: "AN" },
];

const makeProviders = (): Provider[] => {
  const individuals: Omit<Provider, "details" | "periodData">[] = Array.from({ length: 360 }, (_, i) => {
    const specialty = specialties[i % specialties.length];
    const base = 65 + ((i * 7) % 27);
    return {
      id: `IND-${String(i + 1).padStart(4, "0")}`,
      type: "Individual",
      name: `Dr. ${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`,
      specialty,
      county: counties[i % counties.length],
      location: `${110 + i} Market Street`,
      network: i % 9 === 0 ? "Out of Network" : "In Network",
      status: i % 13 === 0 ? "Pending" : i % 17 === 0 ? "Inactive" : "Active",
      members: specialty === "Primary Care" ? 180 + ((i * 47) % 280) : 0,
      rates: [Math.max(48, base - 4), Math.max(48, base - 1), base],
    };
  });
  const facilities: Omit<Provider, "details" | "periodData">[] = Array.from({ length: 92 }, (_, i) => ({
    id: `FAC-${String(i + 1).padStart(4, "0")}`,
    type: "Facility",
    name: ["Bayview Medical Center", "Redwood Community Hospital", "Golden Gate Surgery Center", "Harbor Behavioral Health", "North County Medical Pavilion", "Mission Skilled Nursing"][i % 6] + (i > 5 ? ` — ${counties[i % counties.length]} Campus ${Math.floor(i / 6) + 1}` : ""),
    specialty: ["Hospital", "Hospital", "Ambulatory Surgery", "Behavioral Health", "Medical Group", "Skilled Nursing"][i % 6],
    county: counties[i % counties.length],
    location: `${400 + i * 12} Health Plaza`,
    network: "In Network",
    status: i === 10 ? "Pending" : "Active",
    members: 0,
    rates: [],
    satisfaction: [91, 84, 76, 88, 69, 93, 81, 73, 95, 86, 78, 90][i % 12],
    hospitalization: [5.2, 7.8, 4.9, 8.4, 9.1, 4.3, 6.7, 9.5, 3.9, 7.2, 8.8, 5.5][i % 12],
  }));
  return [...individuals, ...facilities].map(enrichProvider);
};

function enrichProvider(provider: Omit<Provider, "details" | "periodData"> | Provider, index: number): Provider {
  const facility = provider.type === "Facility";
  const suffix = String(index + 1).padStart(6, "0");
  const defaults: ProviderDetails = {
    npi: `${facility ? "18" : "14"}39${suffix}`,
    taxonomyCode: facility ? "282N00000X" : ["207Q00000X", "207RC0000X", "207N00000X", "207RE0101X"][index % 4],
    taxId: `94-${String(1300000 + index * 791).slice(-7)}`,
    legacyId: `AW-${facility ? "F" : "P"}-${String(8200 + index)}`,
    caqhId: facility ? "Not applicable" : `CAQH-${510000 + index * 37}`,
    medicareId: `MCR-${String(700100 + index)}`,
    medicaidId: `MCD-CA-${String(410090 + index)}`,
    legalName: provider.name.replace("Dr. ", ""),
    credential: facility ? "Licensed organization" : ["MD", "DO", "MD", "NP"][index % 4],
    gender: facility ? "Not applicable" : ["Female", "Male", "Female", "Nonbinary"][index % 4],
    pronouns: facility ? "Not applicable" : ["she/her", "he/him", "she/her", "they/them"][index % 4],
    dateOfBirth: facility ? "Not applicable" : `${1968 + (index % 22)}-${String((index % 12) + 1).padStart(2, "0")}-15`,
    languages: languages[index % languages.length],
    culturalCompetencies: ["LGBTQ+ affirming", "Trauma-informed care", "Disability competent"].slice(0, 1 + (index % 3)),
    phone: `(415) 555-${String(1100 + index).slice(-4)}`,
    fax: `(415) 556-${String(2100 + index).slice(-4)}`,
    email: `directory.${provider.id.toLowerCase()}@arcwell.example`,
    website: `www.arcwell.example/${provider.id.toLowerCase()}`,
    locationName: facility ? provider.name : `${provider.name.replace("Dr. ", "")} Medical Office`,
    addressLine1: provider.location,
    addressLine2: index % 3 === 0 ? `Suite ${200 + index}` : "",
    city: ["Oakland", "Walnut Creek", "San Rafael", "Napa", "San Francisco", "San Mateo"][index % 6],
    state: "CA",
    zip: `${94102 + (index % 37)}`,
    serviceArea: `${provider.county} County`,
    officeHours: "Mon–Fri, 8:00 AM–5:00 PM",
    afterHours: facility ? "24/7 access" : "Nurse line and on-call coverage",
    adaAccessible: true,
    publicTransit: index % 4 !== 0,
    parking: index % 3 === 0 ? "Validated garage" : "On-site parking",
    telehealth: !facility && index % 4 !== 0,
    acceptingNewPatients: provider.status === "Active" && index % 5 !== 0,
    ageGroups: facility ? ["All ages"] : index % 4 === 0 ? ["Adults", "Seniors"] : ["Adolescents", "Adults", "Seniors"],
    panelCapacity: facility ? 0 : 450 + (index % 5) * 100,
    nextAvailable: facility ? "Referral dependent" : `${3 + (index % 19)} days`,
    referralRequired: !["Primary Care", "Behavioral Health"].includes(provider.specialty),
    groupName: facility ? provider.name : ["Arcwell Medical Group", "Bay Clinical Partners", "Independent Practice Association"][index % 3],
    groupNpi: `19${String(28000000 + index * 113)}`,
    hospitalAffiliations: facility ? ["Self"] : ["Bayview Medical Center", "Redwood Community Hospital"].slice(0, 1 + (index % 2)),
    admittingPrivileges: facility ? "Not applicable" : index % 5 === 0 ? "Courtesy" : "Active",
    primaryCareDesignation: provider.specialty === "Primary Care",
    licenseNumber: facility ? `HSP-CA-${82000 + index}` : `A${120000 + index * 43}`,
    licenseState: "CA",
    licenseStatus: "Clear / active",
    licenseExpiry: `202${7 + (index % 2)}-${String((index % 12) + 1).padStart(2, "0")}-30`,
    boardCertified: facility ? "Not applicable" : index % 7 !== 0,
    certifyingBoard: facility ? "Not applicable" : `American Board of ${provider.specialty === "Primary Care" ? "Family Medicine" : provider.specialty}`,
    boardExpiry: facility ? "Not applicable" : `202${7 + (index % 3)}-12-31`,
    medicalSchool: facility ? "Not applicable" : ["UCSF School of Medicine", "Stanford School of Medicine", "UC Davis School of Medicine"][index % 3],
    graduationYear: facility ? "Not applicable" : 1994 + (index % 22),
    residency: facility ? "Not applicable" : `${provider.specialty} Residency, Bay Area`,
    fellowship: facility || index % 3 ? "Not applicable" : `${provider.specialty} Fellowship`,
    deaStatus: facility ? "Not applicable" : "Active",
    malpracticeCarrier: facility ? "California Healthcare Risk Pool" : "Medical Insurance Exchange of California",
    malpracticeExpiry: "2027-01-31",
    sanctions: "No exclusions or sanctions found",
    credentialingStatus: provider.status === "Pending" ? "Primary source verification" : "Credentialed",
    initialCredentialing: `202${1 + (index % 5)}-0${(index % 8) + 1}-15`,
    recredentialingDue: `202${7 + (index % 2)}-0${(index % 8) + 1}-15`,
    committeeDecision: provider.status === "Pending" ? "Pending committee" : "Approved",
    contractId: `IPA-CA-${facility ? "FAC" : "PRO"}-${3000 + index}`,
    contractEffective: `202${1 + (index % 4)}-01-01`,
    contractTerm: "Evergreen; 90-day notice",
    products: ["Commercial HMO", "Medicare Advantage", ...(index % 2 ? ["Medi-Cal"] : [])],
    reimbursementModel: facility ? "Case rate + quality incentive" : index % 3 === 0 ? "Capitation + quality incentive" : "Fee schedule",
    riskArrangement: index % 3 === 0 ? "Professional shared risk" : "Upside quality shared savings",
    feeSchedule: `AW-${facility ? "Facility" : "Professional"} 2026`,
    delegatedEntity: "Arcwell IPA",
    attributionModel: provider.specialty === "Primary Care" ? "Member-selected PCP" : "Claims and referral based",
    currentPanel: provider.members || (facility ? 0 : 85 + index * 3),
    panelUtilization: facility ? 0 : Math.min(98, Math.round(((provider.members || 85 + index * 3) / (450 + (index % 5) * 100)) * 100)),
    referralsYtd: 38 + index * 7,
    claimsYtd: 210 + index * 19,
    paidAmountYtd: `$${(184000 + index * 17250).toLocaleString()}`,
    pmpm: `$${(36 + (index % 8) * 4).toFixed(2)}`,
    denialRate: `${(2.1 + (index % 6) * 0.7).toFixed(1)}%`,
    lastClaimDate: `2026-03-${String(10 + (index % 19)).padStart(2, "0")}`,
    qualityScore: `${72 + (index * 7) % 24}%`,
    patientExperience: `${78 + (index * 5) % 20}%`,
    stars: `${(3.2 + (index % 9) * 0.2).toFixed(1)} / 5`,
    readmissionRate: facility ? `${(6.2 + (index % 5) * 0.8).toFixed(1)}%` : "Not applicable",
    erUtilization: `${142 + (index % 7) * 11} / 1,000`,
    careGapClosure: `${66 + (index * 3) % 29}%`,
    dataSource: "Provider attestation, CAQH, claims",
    lastVerified: `2026-0${1 + (index % 3)}-${String(10 + (index % 18)).padStart(2, "0")}`,
    verificationStatus: index % 8 === 0 ? "Attestation due" : "Verified",
    verifiedBy: ["Maya Ortiz", "Jordan Lee", "Priya Shah"][index % 3],
    directoryPublish: provider.network === "In Network" && provider.status === "Active",
    rosterSource: index % 2 ? "Monthly delegated roster" : "Direct contract feed",
    recordUpdated: `2026-03-${String(12 + (index % 17)).padStart(2, "0")} 09:30 PT`,
  };
  const mergedDetails = { ...defaults, ...("details" in provider ? provider.details : {}) };
  const basePanel = Number(mergedDetails.currentPanel) || 0;
  const panelCapacity = Number(mergedDetails.panelCapacity) || 0;
  const existingPeriods = "periodData" in provider ? provider.periodData : {};
  const periodData = Object.fromEntries(reportingPeriods.map((period, periodIndex) => {
    const factor = 1 - periodIndex * .025;
    const panelSize = facility ? 0 : Math.max(0, Math.round(basePanel * factor));
    const periodDefaults: ProviderPeriodData = {
      attributedMembers: provider.specialty === "Primary Care" ? Math.max(0, Math.round(provider.members * factor)) : 0,
      panelSize,
      panelUtilization: panelCapacity ? Math.min(100, Math.round((panelSize / panelCapacity) * 100)) : 0,
      preventiveCompliance: facility ? 0 : Math.max(45, Math.min(99, (provider.rates.at(-1) ?? 75) - periodIndex)),
      referrals: Math.max(0, Math.round((38 + index * 7) * factor)),
      claims: Math.max(0, Math.round((210 + index * 19) * factor)),
      lastClaimDate: period.endDate,
      paidAmount: Math.max(0, Math.round((184000 + index * 17250) * factor)),
      pmpm: Number(((36 + (index % 8) * 4) * (1 - periodIndex * .01)).toFixed(2)),
      denialRate: Number((2.1 + (index % 6) * .7 + periodIndex * .1).toFixed(1)),
      qualityScore: Math.max(0, 72 + (index * 7) % 24 - periodIndex),
      patientExperience: Math.max(0, 78 + (index * 5) % 20 - periodIndex),
      starRating: Number(Math.max(1, 3.2 + (index % 9) * .2 - periodIndex * .1).toFixed(1)),
      careGapClosure: Math.max(0, 66 + (index * 3) % 29 - periodIndex),
      erUtilization: 142 + (index % 7) * 11 + periodIndex * 3,
      satisfaction: facility ? Math.max(0, (provider.satisfaction ?? 80) - periodIndex) : 0,
      hospitalization: facility ? Number(((provider.hospitalization ?? 7) + periodIndex * .2).toFixed(1)) : 0,
      readmissionRate: facility ? Number((6.2 + (index % 5) * .8 + periodIndex * .15).toFixed(1)) : 0,
      responseCount: facility ? Math.max(30, Math.round((76 + (index % 100) * 7) * factor)) : 0,
    };
    return [period.id, { ...periodDefaults, ...(existingPeriods[period.id] || {}) }];
  }));
  return { ...provider, details: mergedDetails, periodData } as Provider;
}

function getPeriod(provider: Provider, period: string) {
  return provider.periodData[period] || provider.periodData[reportingPeriods[0].id];
}

function getPeriodLabel(period: string) {
  return reportingPeriods.find((item) => item.id === period)?.short || period;
}

const initialActions: Action[] = [
  { id: "ACT-1042", category: "Provider Education", subject: "Improve annual wellness visit compliance", reason: "Selected PCP cohort remains below preventive-care target", owner: "Maya Ortiz", priority: "High", due: "2026-06-30", status: "In Execution", approval: "Approved", department: "Quality Improvement", expectedResult: "Increase compliant visits to at least 82%", evidence: "Q1 2026 preventive-care cohort analysis", start: "2026-04-01", nextReview: "2026-04-30", workPlanId: "WP-2001" },
  { id: "ACT-1043", category: "Recruitment", subject: "Increase in-network cardiology capacity in Napa", reason: "Highest remaining cardiology access pressure in an underserved county", owner: "Jordan Lee", priority: "High", due: "2026-07-31", status: "Approved", approval: "Approved", department: "Provider Relations", expectedResult: "Add two participating cardiologists", evidence: "Network adequacy and OON referral analysis", start: "2026-04-15", nextReview: "2026-05-15" },
  { id: "ACT-1044", category: "Facility Improvement", subject: "Close provider directory gaps in priority county", reason: "Provider data validation is delaying directory publication", owner: "Priya Shah", priority: "High", due: "2026-05-30", status: "In Execution", approval: "Approved", department: "Provider Relations", expectedResult: "Validate and publish all priority records", evidence: "Directory attestation queue", start: "2026-03-15", nextReview: "2026-04-20", workPlanId: "WP-2003" },
  { id: "ACT-1045", category: "DOFR Review", subject: "Evaluate additional DOFR risk for imaging", reason: "Stable utilization and partial network coverage require financial and clinical review", owner: "Evan Brooks", priority: "Medium", due: "2026-08-15", status: "In Execution", approval: "Approved", department: "Finance", expectedResult: "Deliver an authorized risk recommendation", evidence: "Utilization and expenditure assessment", start: "2026-04-01", nextReview: "2026-05-01", workPlanId: "WP-2004" },
];

const initialWorkPlans: WorkPlan[] = [
  { id: "WP-2001", name: "Improve annual wellness visit compliance", actionId: "ACT-1042", objective: "Improve preventive-care compliance for selected PCPs.", rationale: "Persistent performance gap requires coordinated provider outreach.", expectedResult: "Reach at least 82% compliance.", successCriteria: "Remeasurement completed with documented provider actions.", owner: "Maya Ortiz", department: "Quality Improvement", supporting: ["Provider Relations", "Clinical Leadership", "Analytics"], sponsor: "Dr. Lena Park", priority: "High", start: "2026-04-01", due: "2026-06-30", status: "In Progress", health: "On Track", progress: 48, nextReview: "2026-04-30", template: "Improve Preventive-Care Compliance", lastUpdated: "2026-04-12",
    tasks: [{ id: "T-1", name: "Validate PCP cohort and baseline", owner: "Maya Ortiz", department: "Analytics", due: "2026-04-10", status: "Completed", note: "Baseline validated." }, { id: "T-2", name: "Complete provider outreach", owner: "Priya Shah", department: "Provider Relations", due: "2026-05-10", status: "In Progress" }, { id: "T-3", name: "Remeasure compliance", owner: "Jordan Lee", department: "Quality Improvement", due: "2026-06-20", status: "Not Started", dependency: "T-2" }],
    milestones: [{ id: "M-1", name: "Provider action plans agreed", owner: "Priya Shah", due: "2026-05-15", status: "Upcoming" }, { id: "M-2", name: "Compliance remeasurement completed", owner: "Maya Ortiz", due: "2026-06-20", status: "Upcoming" }],
    kpis: [{ id: "K-1", name: "Preventive-care compliance", baseline: 71, target: 82, actual: 76, unit: "%", period: "Q1 2026", owner: "Maya Ortiz", status: "On Track" }], risks: [], activity: [{ date: "2026-04-12", text: "Provider outreach started", by: "Priya Shah" }, { date: "2026-04-01", text: "Work plan created from ACT-1042", by: "Maya Ortiz" }] },
  { id: "WP-2002", name: "Reduce out-of-network orthopedic referrals", objective: "Reduce referral leakage through capacity and routing improvements.", rationale: "Orthopedics generated 208 OON referrals.", expectedResult: "Reduce OON referrals by 15%.", successCriteria: "Approved routing change and post-period measurement.", owner: "Jordan Lee", department: "Network Management", supporting: ["Provider Relations", "Utilization Management"], sponsor: "Evan Brooks", priority: "High", start: "2026-05-01", due: "2026-08-31", status: "Ready to Start", health: "At Risk", progress: 10, nextReview: "2026-05-15", template: "Reduce Out-of-Network Referrals", lastUpdated: "2026-04-11",
    tasks: [{ id: "T-4", name: "Analyze referral drivers", owner: "Jordan Lee", department: "Analytics", due: "2026-05-10", status: "Not Started" }, { id: "T-5", name: "Approve routing recommendation", owner: "Unassigned", department: "Network Management", due: "2026-05-24", status: "Blocked", dependency: "T-4" }], milestones: [{ id: "M-3", name: "Network routing decision made", owner: "Evan Brooks", due: "2026-05-24", status: "At Risk" }], kpis: [{ id: "K-2", name: "OON orthopedic referral rate", baseline: 18.6, target: 15, actual: 18.6, unit: "%", period: "Q1 2026", owner: "Jordan Lee", status: "At Risk" }], risks: [{ id: "R-1", issue: "Network decision required", impact: "Routing change cannot start", severity: "High", owner: "Evan Brooks", due: "2026-05-10", decisionFrom: "Network Management", status: "Open" }], activity: [{ date: "2026-04-11", text: "Decision request added", by: "Jordan Lee" }] },
  { id: "WP-2003", name: "Close provider directory gaps in priority county", actionId: "ACT-1044", objective: "Validate and publish provider directory records.", rationale: "Attestation backlog affects directory accuracy.", expectedResult: "Complete priority validations.", successCriteria: "All priority records verified and published.", owner: "Priya Shah", department: "Provider Relations", supporting: ["Credentialing", "Compliance"], sponsor: "Maya Ortiz", priority: "High", start: "2026-03-15", due: "2026-05-30", status: "In Progress", health: "Blocked", progress: 62, nextReview: "2026-04-20", template: "Custom Work plan", lastUpdated: "2026-04-14",
    tasks: [{ id: "T-6", name: "Validate source roster", owner: "Priya Shah", department: "Provider Relations", due: "2026-04-05", status: "Completed" }, { id: "T-7", name: "Complete credentialing validation", owner: "Unassigned", department: "Credentialing", due: "2026-04-12", status: "Blocked", dependency: "T-6" }], milestones: [{ id: "M-4", name: "Credentialing handoff accepted", owner: "Unassigned", due: "2026-04-18", status: "Missed" }], kpis: [{ id: "K-3", name: "Priority records published", baseline: 0, target: 57, actual: 31, unit: "records", period: "Q1 2026", owner: "Priya Shah", status: "At Risk" }], risks: [{ id: "R-2", issue: "Credentialing owner missing", impact: "Publication milestone missed", severity: "High", owner: "Priya Shah", due: "2026-04-18", decisionFrom: "Credentialing Director", status: "Open" }], activity: [{ date: "2026-04-14", text: "Plan marked Blocked", by: "Priya Shah" }] },
  { id: "WP-2004", name: "Evaluate additional DOFR risk for imaging", actionId: "ACT-1045", objective: "Develop an evidence-based DOFR recommendation.", rationale: "Imaging has stable utilization but incomplete coverage.", expectedResult: "Authorized go/no-go decision.", successCriteria: "Clinical and finance approvals documented.", owner: "Evan Brooks", department: "Finance", supporting: ["Clinical Leadership", "Provider Relations", "Analytics"], sponsor: "Maya Ortiz", priority: "Medium", start: "2026-04-01", due: "2026-08-15", status: "In Progress", health: "At Risk", progress: 35, nextReview: "2026-05-01", template: "Assess Additional DOFR Risk", lastUpdated: "2026-04-13",
    tasks: [{ id: "T-8", name: "Validate utilization and exposure", owner: "Evan Brooks", department: "Finance", due: "2026-04-20", status: "In Progress" }, { id: "T-9", name: "Clinical risk review", owner: "Dr. Lena Park", department: "Clinical Leadership", due: "2026-05-05", status: "Not Started", dependency: "T-8" }], milestones: [{ id: "M-5", name: "Executive recommendation approved", owner: "Maya Ortiz", due: "2026-06-15", status: "Upcoming" }], kpis: [{ id: "K-4", name: "Required specialty coverage", baseline: 64, target: 85, actual: 68, unit: "%", period: "Q1 2026", owner: "Jordan Lee", status: "At Risk" }], risks: [{ id: "R-3", issue: "Finance assumptions pending", impact: "Decision package delayed", severity: "Medium", owner: "Evan Brooks", due: "2026-04-30", status: "Mitigating" }], activity: [{ date: "2026-04-13", text: "Finance review updated", by: "Evan Brooks" }] },
];

function Button({ children, onClick, variant = "primary", type = "button", disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Select({ value, onChange, children, label }: { value: string; onChange: (value: string) => void; children: React.ReactNode; label?: string }) {
  return <label className="control">{label && <span>{label}</span>}<select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select></label>;
}
function TextInput({ value, onChange, placeholder, label, required = false }: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string; required?: boolean }) {
  return <label className="control">{label && <span>{label}{required && " *"}</span>}<input value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  return <span className={`badge badge-${tone}`}><i />{children}</span>;
}
function toneFor(value: string) {
  if (["Active", "Completed", "Approved", "On Track", "Target Met", "Resolved", "Acceptable", "Retain", "Approved for further evaluation"].includes(value)) return "good" as const;
  if (["High", "Terminated", "Blocked", "Overdue", "Missed", "Target Missed", "Find Replacement", "Not Acceptable"].includes(value)) return "bad" as const;
  if (["Pending", "Under Review", "In Progress", "In Execution", "At Risk", "On Hold", "Awaiting Review", "Educate", "Potentially manageable"].includes(value)) return "warn" as const;
  if (["Ready to Start", "Upcoming", "On Track"].includes(value)) return "info" as const;
  return "neutral" as const;
}
function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subhead">{description}</p></div>{action}</div>;
}
function Stat({ label, value, note, tone = "default", onClick }: { label: string; value: string | number; note: string; tone?: "default" | "blue" | "amber" | "red"; onClick?: () => void }) {
  const content = <><span>{label}</span><strong>{value}</strong><small>{note}</small></>;
  return onClick ? <button className={`stat stat-${tone}`} onClick={onClick}>{content}</button> : <div className={`stat stat-${tone}`}>{content}</div>;
}
function BarChart({ data, suffix = "" }: { data: { label: string; value: number }[]; suffix?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return <div className="bar-chart">{data.map((d) => <div className="bar-row" key={d.label}><span>{d.label}</span><div className="bar-track"><div style={{ width: `${Math.max(4, (d.value / max) * 100)}%` }} /></div><b>{d.value}{suffix}</b></div>)}</div>;
}
function Empty({ title, message }: { title: string; message: string }) {
  return <div className="empty"><strong>{title}</strong><p>{message}</p></div>;
}

export default function App({ page, setPage, navigation = {} }: { page: Page; setPage: (page: Page, navigation?: PageNavigation) => void; navigation?: PageNavigation }) {
  const [providers, setProviders] = useState<Provider[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ipa-providers") || "");
      const seeded = makeProviders();
      if (!stored) {
        localStorage.setItem("ipa-provider-seed-version", "2");
        return seeded;
      }
      const current = stored.map(enrichProvider);
      if (localStorage.getItem("ipa-provider-seed-version") !== "2") {
        const existingIds = new Set(current.map((provider: Provider) => provider.id));
        localStorage.setItem("ipa-provider-seed-version", "2");
        return [...current, ...seeded.filter((provider) => !existingIds.has(provider.id))];
      }
      return current;
    } catch { return makeProviders(); }
  });
  const [actions, setActions] = useState<Action[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ipa-actions") || "");
      return stored ? stored.map((action: Action) => ({ ...(initialActions.find((seed) => seed.id === action.id) || {}), ...action })) : initialActions;
    } catch { return initialActions; }
  });
  const [workPlans, setWorkPlans] = useState<WorkPlan[]>(() => {
    try { return JSON.parse(localStorage.getItem("ipa-work-plans") || "") || initialWorkPlans; } catch { return initialWorkPlans; }
  });
  const [complianceTarget, setComplianceTarget] = useState(75);
  const [ratioTarget, setRatioTarget] = useState(250);
  const [reportingPeriod, setReportingPeriod] = useState(reportingPeriods[0].id);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [providerPreset, setProviderPreset] = useState<ProviderFilterPreset>("all");
  const [compliancePreset, setCompliancePreset] = useState<ComplianceFilterPreset>("below-target");
  const [adequacyPreset, setAdequacyPreset] = useState<AdequacyFilterPreset>("gaps");
  const [referralPreset, setReferralPreset] = useState<ReferralFilterPreset>("volume");
  const selectedWorkPlanId = navigation.planId || null;
  const setSelectedWorkPlanId = (id: string | null) => setPage("workplans", id ? { planId: id } : { filter: navigation.filter });
  const [actionFocusId, setActionFocusId] = useState<string | null>(null);
  const [setupSource, setSetupSource] = useState<string | "direct" | null>(null);

  useEffect(() => localStorage.setItem("ipa-providers", JSON.stringify(providers)), [providers]);
  useEffect(() => localStorage.setItem("ipa-actions", JSON.stringify(actions)), [actions]);
  useEffect(() => localStorage.setItem("ipa-work-plans", JSON.stringify(workPlans)), [workPlans]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 2800); return () => clearTimeout(id); }, [toast]);

  const addAction = (category: string, subject: string, reason: string, priority: Action["priority"] = "High") => {
    if (actions.some((a) => a.subject === subject && a.category === category && !["Completed", "Dismissed"].includes(a.status))) {
      setToast("An open action already exists for this issue.");
      return;
    }
    const due = new Date(); due.setDate(due.getDate() + 21);
    setActions((current) => [{ id: `ACT-${1042 + current.length}`, category, subject, reason, owner: "Unassigned", priority, due: due.toISOString().slice(0, 10), status: "New" }, ...current]);
    setToast("Action added to the tracker.");
  };
  const go = (next: Page) => {
    if (next === "providers") setProviderPreset("all");
    if (next === "compliance") setCompliancePreset("below-target");
    if (next === "adequacy") setAdequacyPreset("gaps");
    if (next === "referrals") setReferralPreset("volume");
    setPage(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openProviders = (preset: ProviderFilterPreset) => {
    setProviderPreset(preset);
    setPage("providers");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openCompliance = (preset: ComplianceFilterPreset) => {
    setCompliancePreset(preset);
    setPage("compliance");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openAdequacy = (preset: AdequacyFilterPreset) => {
    setAdequacyPreset(preset);
    setPage("adequacy");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openReferrals = (preset: ReferralFilterPreset) => {
    setReferralPreset(preset);
    setPage("referrals");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openWorkPlan = (id: string) => { setSelectedWorkPlanId(id); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openSourceAction = (id: string) => { setActionFocusId(id); setPage("actions"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const createWorkPlan = (plan: WorkPlan) => {
    const existing = plan.actionId ? workPlans.find((item) => item.actionId === plan.actionId && !["Completed", "Cancelled"].includes(item.status)) : undefined;
    if (existing) {
      setSetupSource(null);
      setToast("An active work plan already exists for this action.");
      openWorkPlan(existing.id);
      return;
    }
    setWorkPlans((current) => [plan, ...current]);
    if (plan.actionId) setActions((current) => current.map((action) => action.id === plan.actionId ? { ...action, status: "In Execution", workPlanId: plan.id, approval: "Approved" } : action));
    setSetupSource(null);
    setToast("Work plan created and linked.");
    openWorkPlan(plan.id);
  };

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="brand"><div className="brand-mark">AP</div><div><b>Arcwell IPA</b><span>Membership Management</span></div></div>
        <nav aria-label="Main navigation">
          <p>Workspace</p>
          {nav.map((item) => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => go(item.id)}><span>{item.short}</span>{item.label}{item.id === "actions" && <em>{actions.filter((a) => a.status === "New").length}</em>}</button>)}
        </nav>
        <div className="sidebar-foot"><Badge tone="info">Mock data environment</Badge><p>Q1 2026 performance period</p></div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>Menu</button>
          {page !== "relations" && page !== "workplans" && <label className="period period-picker"><span>Reporting period</span><select value={reportingPeriod} onChange={(event) => setReportingPeriod(event.target.value)}>{reportingPeriods.map((period) => <option value={period.id} key={period.id}>{period.label}</option>)}</select></label>}
          <div className="top-actions"><button className="icon-btn" title="Help" onClick={() => window.alert("This prototype uses fictional healthcare data. Select a module from the sidebar to explore its workflow.")}>?</button><div className="profile"><span>MO</span><div><b>Maya Ortiz</b><small>Network Administrator</small></div></div></div>
        </header>
        <main>
          {page === "dashboard" && <Dashboard providers={providers} period={reportingPeriod} actions={actions} complianceTarget={complianceTarget} ratioTarget={ratioTarget} go={go} openProviders={openProviders} openCompliance={openCompliance} openAdequacy={openAdequacy} openReferrals={openReferrals} />}
          {page === "analytics" && <Analytics providers={providers} period={reportingPeriod} complianceTarget={complianceTarget} />}
          {page === "providers" && <Providers providers={providers} period={reportingPeriod} preset={providerPreset} setProviders={setProviders} setToast={setToast} />}
          {page === "compliance" && <Compliance providers={providers} period={reportingPeriod} preset={compliancePreset} target={complianceTarget} setTarget={setComplianceTarget} addAction={addAction} />}
          {page === "adequacy" && <Adequacy providers={providers} preset={adequacyPreset} threshold={ratioTarget} setThreshold={setRatioTarget} addAction={addAction} />}
          {page === "dofr" && <Dofr addAction={addAction} go={go} />}
          {page === "referrals" && <Referrals providers={providers} preset={referralPreset} addAction={addAction} />}
          {page === "facilities" && <Facilities providers={providers} period={reportingPeriod} addAction={addAction} />}
          {page === "actions" && <Actions actions={actions} setActions={setActions} workPlans={workPlans} focusId={actionFocusId} clearFocus={() => setActionFocusId(null)} onInitiate={(action) => setSetupSource(action.id)} onOpenPlan={openWorkPlan} />}
          {(page === "relations" || page === "workplans") && <ProviderRelations view={page} filter={navigation.filter} onOpenRegister={(filter) => setPage("workplans", { filter })} workPlans={workPlans} setWorkPlans={setWorkPlans} actions={actions} selectedId={selectedWorkPlanId} setSelectedId={setSelectedWorkPlanId} openSourceAction={openSourceAction} onCreate={() => setSetupSource("direct")} />}
        </main>
      </div>
      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      {toast && <div className="toast">{toast}</div>}
      {setupSource && <WorkPlanSetup source={setupSource === "direct" ? null : actions.find((action) => action.id === setupSource) || null} onClose={() => setSetupSource(null)} onCreate={createWorkPlan} />}
    </div>
  );
}

function Dashboard({ providers, period, actions, complianceTarget, ratioTarget, go, openProviders, openCompliance, openAdequacy, openReferrals }: { providers: Provider[]; period: string; actions: Action[]; complianceTarget: number; ratioTarget: number; go: (p: Page) => void; openProviders: (preset: ProviderFilterPreset) => void; openCompliance: (preset: ComplianceFilterPreset) => void; openAdequacy: (preset: AdequacyFilterPreset) => void; openReferrals: (preset: ReferralFilterPreset) => void }) {
  const individuals = providers.filter((p) => p.type === "Individual" && p.status === "Active");
  const facilities = providers.filter((p) => p.type === "Facility" && p.status === "Active");
  const pcps = individuals.filter((p) => p.specialty === "Primary Care");
  const compliancePcps = providers.filter((p) => p.type === "Individual" && p.specialty === "Primary Care");
  const avgCompliance = Math.round(pcps.reduce((sum, provider) => sum + getPeriod(provider, period).preventiveCompliance, 0) / Math.max(pcps.length, 1));
  const directoryCompliance = Math.round(compliancePcps.reduce((sum, provider) => sum + getPeriod(provider, period).preventiveCompliance, 0) / Math.max(compliancePcps.length, 1));
  const poorFacilities = facilities.filter((provider) => { const metrics = getPeriod(provider, period); return metrics.satisfaction < 80 || metrics.hospitalization > 7; }).length;
  const adequacy = adequacyRows(providers, ratioTarget);
  const gapRows = adequacy.filter((row) => row.gap > 0);
  const gapCounties = new Set(gapRows.map((row) => row.county));
  const membersInGapAreas = [...gapCounties].reduce((sum, county) => sum + memberCounts[county], 0);
  const topAdequacyPressure = [...adequacy].sort((a, b) => b.gap - a.gap || b.ratio - a.ratio)[0];
  const totalReferrals = referralData.reduce((sum, row) => sum + row.referrals, 0);
  const affectedMembers = referralData.reduce((sum, row) => sum + row.members, 0);
  const highPriorityReferrals = referralData.filter((row) => row.priority === "High");
  return <>
    <PageHeader eyebrow="Network performance" title="Membership workflow" description="A focused view of participation, quality performance, and network growth opportunities." action={<Button onClick={() => go("actions")}>Review action plan</Button>} />
    <div className="stat-grid">
      <Stat label="Preventive care compliance" value={`${avgCompliance}%`} note={`${getPeriodLabel(period)} · target ${complianceTarget}%`} tone={avgCompliance >= complianceTarget ? "blue" : "amber"} onClick={() => go("compliance")} />
      <Stat label="County-specialty gaps" value={gapRows.length} note="Require network growth" tone="amber" onClick={() => go("adequacy")} />
      <Stat label="Manageable DOFR services" value={3} note="Awaiting expanded review" tone="blue" onClick={() => go("dofr")} />
      <Stat label="Out-of-network referrals" value={totalReferrals.toLocaleString()} note="+8.4% over prior period" tone="red" onClick={() => go("referrals")} />
      <Stat label="Facilities requiring action" value={poorFacilities} note="Education or replacement" tone="red" onClick={() => go("facilities")} />
    </div>
    <div className="section-heading">
      <div><h2>Provider directory snapshot</h2><p>Operational views of participation, patient access, and directory accuracy.</p></div>
      <Button variant="ghost" onClick={() => openProviders("all")}>Open full directory</Button>
    </div>
    <div className="stat-grid compact provider-snapshot">
      <Stat label="Total directory records" value={providers.length} note={`${providers.filter((p) => p.type === "Individual").length} clinicians · ${providers.filter((p) => p.type === "Facility").length} facilities`} onClick={() => openProviders("all")} />
      <Stat label="Active in-network" value={providers.filter((p) => p.status === "Active" && p.network === "In Network").length} note="Contracted and participating" tone="blue" onClick={() => openProviders("active-in-network")} />
      <Stat label="Accepting new patients" value={providers.filter((p) => p.details.acceptingNewPatients).length} note={`${providers.filter((p) => p.details.telehealth).length} offer telehealth`} onClick={() => openProviders("accepting-patients")} />
      <Stat label="Attestations due" value={providers.filter((p) => p.details.verificationStatus === "Attestation due").length} note="Directory validation required" tone="amber" onClick={() => openProviders("attestations-due")} />
      <Stat label="Pending credentialing" value={providers.filter((p) => p.status === "Pending").length} note="Primary-source review in progress" tone="amber" onClick={() => openProviders("pending-credentialing")} />
    </div>
    <div className="section-heading">
      <div><h2>Preventive care compliance</h2><p>Performance, eligible cohorts, and active improvement work.</p></div>
      <Button variant="ghost" onClick={() => openCompliance("below-target")}>Open compliance</Button>
    </div>
    <div className="stat-grid compact provider-snapshot">
      <Stat label="IPA compliance" value={`${directoryCompliance}%`} note={`${getPeriodLabel(period)} evaluated PCPs`} tone="blue" onClick={() => openCompliance("all")} />
      <Stat label="Below period target" value={compliancePcps.filter((provider) => getPeriod(provider, period).preventiveCompliance < complianceTarget).length} note={getPeriodLabel(period)} tone="red" onClick={() => openCompliance("below-target")} />
      <Stat label="PCPs evaluated" value={compliancePcps.length} note="Minimum 30 eligible members" onClick={() => openCompliance("evaluated")} />
      <Stat label="Improvement plans open" value={3} note="1 due within 14 days" tone="amber" onClick={() => openCompliance("improvement-plans")} />
    </div>
    <div className="section-heading">
      <div><h2>Network adequacy</h2><p>Coverage gaps, member impact, and recruitment demand.</p></div>
      <Button variant="ghost" onClick={() => openAdequacy("gaps")}>Open adequacy</Button>
    </div>
    <div className="stat-grid compact provider-snapshot">
      <Stat label="County-specialty gaps" value={gapRows.length} note={`Across ${gapCounties.size} counties`} tone="red" onClick={() => openAdequacy("gaps")} />
      <Stat label="Additional providers needed" value={adequacy.reduce((sum, row) => sum + row.gap, 0)} note="Prioritized by largest gap" tone="amber" onClick={() => openAdequacy("providers-needed")} />
      <Stat label="Members in gap areas" value={membersInGapAreas.toLocaleString()} note="Prioritized by member impact" onClick={() => openAdequacy("member-impact")} />
      <Stat label="Recruitment opportunities" value={Math.min(6, gapRows.length)} note="Top opportunities to action" tone="blue" onClick={() => openAdequacy("recruitment")} />
    </div>
    <div className="section-heading">
      <div><h2>Out-of-network referrals</h2><p>Referral leakage, member impact, and specialty priorities.</p></div>
      <Button variant="ghost" onClick={() => openReferrals("volume")}>Open referrals</Button>
    </div>
    <div className="stat-grid compact provider-snapshot">
      <Stat label="OON referrals" value={totalReferrals.toLocaleString()} note="Ranked by referral volume" tone="red" onClick={() => openReferrals("volume")} />
      <Stat label="Affected members" value={affectedMembers.toLocaleString()} note="Specialties affecting 125+ members" onClick={() => openReferrals("member-impact")} />
      <Stat label="OON share" value="18.6%" note="Rising contributors to leakage" tone="amber" onClick={() => openReferrals("rising-share")} />
      <Stat label="High-priority specialties" value={highPriorityReferrals.length} note={`Combined ${highPriorityReferrals.reduce((sum, row) => sum + row.referrals, 0).toLocaleString()} referrals`} tone="blue" onClick={() => openReferrals("high-priority")} />
    </div>
    <div className="dashboard-grid action-grid">
      <section className="card wide"><div className="card-head"><div><h2>Recommended actions</h2><p>Prioritized from current network and quality signals</p></div><Button variant="ghost" onClick={() => go("actions")}>View all {actions.length}</Button></div>
        <div className="recommendations">
          {[
            [topAdequacyPressure.gap ? "High" : "Medium", `${topAdequacyPressure.gap ? "Recruit" : "Monitor"} ${topAdequacyPressure.specialty} coverage in ${topAdequacyPressure.county}`, `${topAdequacyPressure.ratio.toLocaleString()} members per provider; ${topAdequacyPressure.gap ? `add ${topAdequacyPressure.gap} provider${topAdequacyPressure.gap === 1 ? "" : "s"}` : "currently within threshold"}`, "adequacy" as Page],
            ["High", "Review low-performing PCP cohort", `${pcps.filter((provider) => getPeriod(provider, period).preventiveCompliance < complianceTarget).length} PCPs below target in ${getPeriodLabel(period)}`, "compliance" as Page],
            ["Medium", "Assess advanced imaging for DOFR expansion", "Stable utilization; local specialist capacity requires validation", "dofr" as Page],
          ].map(([priority, title, reason, target]) => <div className="recommendation" key={title}><Badge tone={priority === "High" ? "bad" : "warn"}>{priority}</Badge><div><b>{title}</b><p>{reason}</p></div><Button variant="secondary" onClick={() => go(target as Page)}>Open workflow</Button></div>)}
        </div>
      </section>
    </div>
  </>;
}

function Analytics({ providers, period, complianceTarget }: { providers: Provider[]; period: string; complianceTarget: number }) {
  const individuals = providers.filter((p) => p.type === "Individual" && p.status === "Active");
  const facilities = providers.filter((p) => p.type === "Facility" && p.status === "Active");
  const pcps = individuals.filter((p) => p.specialty === "Primary Care");
  const avgCompliance = Math.round(pcps.reduce((sum, provider) => sum + getPeriod(provider, period).preventiveCompliance, 0) / Math.max(pcps.length, 1));
  const attributedMembers = pcps.filter((provider) => provider.network === "In Network").reduce((sum, provider) => sum + getPeriod(provider, period).attributedMembers, 0);
  const representedCounties = new Set(providers.filter((provider) => provider.status === "Active").map((provider) => provider.county)).size;
  const specialtyCounts = specialties.slice(0, 6).map((specialty) => ({ label: specialty.replace("Primary Care", "PCP"), value: individuals.filter((provider) => provider.specialty === specialty).length }));
  const retainedFacilities = facilities.filter((facility) => { const metrics = getPeriod(facility, period); return metrics.satisfaction >= 80 && metrics.hospitalization <= 7; }).length;
  const educatedFacilities = facilities.filter((facility) => { const metrics = getPeriod(facility, period); return (metrics.satisfaction >= 80) !== (metrics.hospitalization <= 7); }).length;
  const replacementFacilities = facilities.filter((facility) => { const metrics = getPeriod(facility, period); return metrics.satisfaction < 80 && metrics.hospitalization > 7; }).length;
  const complianceTrend = reportingPeriods.slice(0, 3).reverse().map((reportingPeriod) => ({
    label: reportingPeriod.short,
    value: Math.round(pcps.reduce((sum, provider) => sum + getPeriod(provider, reportingPeriod.id).preventiveCompliance, 0) / Math.max(pcps.length, 1)),
  }));
  const totalReferrals = referralData.reduce((sum, referral) => sum + referral.referrals, 0);
  return <>
    <PageHeader eyebrow="Performance intelligence" title="Analytics" description="Explore passive network, quality, membership, and participation signals across the current reporting period." />
    <div className="stat-grid analytics-stats">
      <Stat label="Attributed members" value={attributedMembers.toLocaleString()} note={`${getPeriodLabel(period)} active PCP panels`} tone="blue" />
      <Stat label="Active providers" value={individuals.length} note="Participating individual clinicians" />
      <Stat label="Active facilities" value={facilities.length} note="Across 6 counties" />
      <Stat label="Counties represented" value={representedCounties} note="Northern California service area" />
      <Stat label="Quality target" value={`${complianceTarget}%`} note={`${avgCompliance >= complianceTarget ? "Currently achieved" : `${complianceTarget - avgCompliance} points to target`}`} tone={avgCompliance >= complianceTarget ? "blue" : "amber"} />
    </div>
    <div className="dashboard-grid analytics-grid">
      <section className="card wide"><div className="card-head"><div><h2>Preventive care trend</h2><p>IPA performance across core measures</p></div><Badge tone={avgCompliance >= complianceTarget ? "good" : "warn"}>{avgCompliance >= complianceTarget ? "On target" : `${complianceTarget - avgCompliance} pts below target`}</Badge></div>
        <div className="trend-chart"><div className="chart-labels"><span>90%</span><span>80%</span><span>70%</span><span>60%</span></div><div className="trend-bars">{complianceTrend.map((item) => <div key={item.label}><span style={{ height: `${item.value}%` }}><b>{item.value}%</b></span><small>{item.label}</small></div>)}</div></div>
      </section>
      <section className="card"><div className="card-head"><div><h2>Provider participation</h2><p>Active in-network by specialty</p></div></div><BarChart data={specialtyCounts} /></section>
      <section className="card"><div className="card-head"><div><h2>Facility quality</h2><p>Recommended disposition</p></div></div>
        <div className="donut-row"><div className="donut"><span>{facilities.length}</span><small>Total</small></div><div className="legend"><span><i className="green" />Retain <b>{retainedFacilities}</b></span><span><i className="amber" />Educate <b>{educatedFacilities}</b></span><span><i className="red" />Replace <b>{replacementFacilities}</b></span></div></div>
      </section>
    </div>
    <div className="section-heading">
      <div><h2>Referral analytics</h2><p>Specialty-level leakage and network distribution for the current reporting period.</p></div>
    </div>
    <div className="dashboard-grid referral-grid">
      <section className="card"><div className="card-head"><div><h2>Referral volume by specialty</h2><p>Current reporting period</p></div></div><BarChart data={referralData.map((referral) => ({ label: referral.specialty, value: referral.referrals }))} /></section>
      <section className="card"><div className="card-head"><div><h2>Network distribution</h2><p>All specialty referrals</p></div></div><div className="distribution"><div className="distribution-bar"><span style={{ width: "81.4%" }}>81.4% in network</span><span style={{ width: "18.6%" }}>18.6%</span></div><div className="mini-stats"><div><b>5,462</b><span>In-network</span></div><div><b>{totalReferrals.toLocaleString()}</b><span>Out-of-network</span></div><div><b>186</b><span>Clinical exception</span></div></div></div></section>
    </div>
  </>;
}

function Providers({ providers, period, preset, setProviders, setToast }: { providers: Provider[]; period: string; preset: ProviderFilterPreset; setProviders: React.Dispatch<React.SetStateAction<Provider[]>>; setToast: (s: string) => void }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState(preset === "active-in-network" ? "Active" : preset === "pending-credentialing" ? "Pending" : "All");
  const [network, setNetwork] = useState(preset === "active-in-network" ? "In Network" : "All");
  const [county, setCounty] = useState("All");
  const [specialty, setSpecialty] = useState("All");
  const [access, setAccess] = useState(preset === "accepting-patients" ? "Accepting patients" : preset === "attestations-due" ? "Attestation due" : "All");
  const [editing, setEditing] = useState<Provider | null>(null);
  const [viewing, setViewing] = useState<Provider | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const resetPage = (setter: (value: string) => void) => (value: string) => { setter(value); setPageNo(1); };
  useEffect(() => {
    setSearch("");
    setType("All");
    setStatus(preset === "active-in-network" ? "Active" : preset === "pending-credentialing" ? "Pending" : "All");
    setNetwork(preset === "active-in-network" ? "In Network" : "All");
    setCounty("All");
    setSpecialty("All");
    setAccess(preset === "accepting-patients" ? "Accepting patients" : preset === "attestations-due" ? "Attestation due" : "All");
    setPageNo(1);
  }, [preset]);
  const filtered = providers.filter((p) =>
    (type === "All" || p.type === type) &&
    (status === "All" || p.status === status) &&
    (network === "All" || p.network === network) &&
    (county === "All" || p.county === county) &&
    (specialty === "All" || p.specialty === specialty) &&
    (access === "All" || (access === "Accepting patients" ? p.details.acceptingNewPatients : access === "Telehealth" ? p.details.telehealth : p.details.verificationStatus === "Attestation due")) &&
    `${p.name} ${p.id} ${p.details.npi} ${p.specialty} ${p.county} ${p.details.groupName} ${p.details.languages}`.toLowerCase().includes(search.toLowerCase())
  );
  const pageItems = filtered.slice((pageNo - 1) * 10, pageNo * 10);
  const save = (provider: Provider) => {
    setProviders((current) => current.some((p) => p.id === provider.id) ? current.map((p) => p.id === provider.id ? provider : p) : [provider, ...current]);
    setEditing(null); setToast("Provider record saved.");
  };
  const remove = (p: Provider) => { if (window.confirm(`Delete ${p.name}? This cannot be undone.`)) { setProviders((current) => current.filter((x) => x.id !== p.id)); setToast("Provider deleted."); } };
  return <>
    <PageHeader eyebrow="Network operations" title="Provider Directory" description="A unified source of truth for provider identity, credentials, access, contracts, capacity, quality, and directory accuracy." action={<Button onClick={() => setEditing(blankProvider(providers))}>Add provider</Button>} />
    <div className="toolbar directory-toolbar">
      <TextInput value={search} onChange={(v) => { setSearch(v); setPageNo(1); }} placeholder="Search name, NPI, group, language, specialty…" />
      <Select value={type} onChange={resetPage(setType)}><option>All</option><option>Individual</option><option>Facility</option></Select>
      <Select value={status} onChange={resetPage(setStatus)}><option>All</option><option>Active</option><option>Pending</option><option>Inactive</option><option>Terminated</option></Select>
      <Select value={network} onChange={resetPage(setNetwork)}><option>All</option><option>In Network</option><option>Out of Network</option></Select>
      <Select value={county} onChange={resetPage(setCounty)}><option>All</option>{counties.map((item) => <option key={item}>{item}</option>)}</Select>
      <Select value={specialty} onChange={resetPage(setSpecialty)}><option>All</option>{[...new Set(providers.map((p) => p.specialty))].sort().map((item) => <option key={item}>{item}</option>)}</Select>
      <Select value={access} onChange={resetPage(setAccess)}><option>All</option><option>Accepting patients</option><option>Telehealth</option><option>Attestation due</option></Select>
      <span className="result-count">{filtered.length} records</span>
    </div>
    <section className="table-card provider-table"><div className="table-wrap"><table><thead><tr><th>Provider identity</th><th>Specialty / group</th><th>Location & contact</th><th>Access</th><th>Network</th><th>Credentialing</th><th>{getPeriodLabel(period)} panel / quality</th><th>Directory status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {pageItems.map((provider) => { const metrics = getPeriod(provider, period); return <tr key={provider.id}><td><button className="link-cell" onClick={() => setViewing(provider)}><b>{provider.name}</b><small>{provider.details.credential} · {provider.id}</small><small>NPI {provider.details.npi}</small></button></td><td><b>{provider.specialty}</b><small>{String(provider.details.groupName)}</small><small>{provider.type}</small></td><td><b>{String(provider.details.city)}, CA {String(provider.details.zip)}</b><small>{provider.location}</small><small>{provider.details.phone}</small></td><td><Badge tone={provider.details.acceptingNewPatients ? "good" : "neutral"}>{provider.details.acceptingNewPatients ? "Accepting" : "Closed panel"}</Badge><small>{provider.details.telehealth ? "Telehealth available" : String(provider.details.nextAvailable)}</small></td><td><Badge tone={provider.network === "In Network" ? "good" : "neutral"}>{provider.network}</Badge><small>{String(provider.details.reimbursementModel)}</small></td><td><Badge tone={provider.details.credentialingStatus === "Credentialed" ? "good" : "warn"}>{provider.details.credentialingStatus}</Badge><small>Due {String(provider.details.recredentialingDue)}</small></td><td><b>{provider.type === "Individual" ? `${metrics.panelSize} / ${provider.details.panelCapacity}` : `${metrics.satisfaction}%`}</b><small>{provider.type === "Individual" ? `${metrics.panelUtilization}% panel utilization` : "Member satisfaction"}</small><small>{metrics.qualityScore}% quality score</small></td><td><Badge tone={provider.details.verificationStatus === "Verified" ? "good" : "warn"}>{String(provider.details.verificationStatus)}</Badge><small>Checked {provider.details.lastVerified}</small></td><td><div className="row-actions"><Button variant="ghost" onClick={() => setViewing(provider)}>View</Button><Button variant="ghost" onClick={() => setEditing(provider)}>Edit</Button><Button variant="ghost" onClick={() => remove(provider)}>Delete</Button></div></td></tr>; })}
    </tbody></table></div>{!pageItems.length && <Empty title="No providers found" message="Try clearing or changing your search filters." />}
      <div className="pagination"><span>Showing {Math.min((pageNo - 1) * 10 + 1, filtered.length)}–{Math.min(pageNo * 10, filtered.length)} of {filtered.length}</span><div><Button variant="secondary" disabled={pageNo === 1} onClick={() => setPageNo(pageNo - 1)}>Previous</Button><Button variant="secondary" disabled={pageNo * 10 >= filtered.length} onClick={() => setPageNo(pageNo + 1)}>Next</Button></div></div>
    </section>
    {editing && <ProviderModal provider={editing} period={period} onClose={() => setEditing(null)} onSave={save} />}
    {viewing && <DetailPanel provider={viewing} period={period} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); }} />}
  </>;
}

function blankProvider(providers: Provider[]): Provider {
  const next = providers.length + 1;
  return enrichProvider({ id: `IND-${String(next).padStart(4, "0")}`, type: "Individual", name: "", specialty: "Primary Care", county: "Alameda", location: "", network: "In Network", status: "Active", members: 0, rates: [75, 75, 75] }, next);
}
function ProviderModal({ provider, period, onClose, onSave }: { provider: Provider; period: string; onClose: () => void; onSave: (p: Provider) => void }) {
  const [form, setForm] = useState(provider);
  const [metricPeriod, setMetricPeriod] = useState(period);
  const [section, setSection] = useState<"identity" | "access" | "participation" | "metrics">("identity");
  const update = (key: keyof Provider, value: string | number) => setForm({ ...form, [key]: value });
  const updateDetail = (key: string, value: DetailValue) => setForm({ ...form, details: { ...form.details, [key]: value } });
  const metrics = getPeriod(form, metricPeriod);
  const updateMetric = (key: keyof ProviderPeriodData, value: string) => setForm({ ...form, periodData: { ...form.periodData, [metricPeriod]: { ...metrics, [key]: key === "lastClaimDate" ? value : Number(value) } as ProviderPeriodData } });
  const changeType = (value: string) => setForm(enrichProvider({ ...form, type: value as Provider["type"], id: `${value === "Facility" ? "FAC" : "IND"}-${String(Date.now()).slice(-4)}`, specialty: value === "Facility" ? "Hospital" : "Primary Care", rates: value === "Facility" ? [] : [75, 75, 75], satisfaction: value === "Facility" ? 80 : undefined, hospitalization: value === "Facility" ? 7 : undefined }, 0));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) { setSection("identity"); return; }
    if (!form.location.trim()) { setSection("access"); return; }
    onSave(form);
  };
  return <div className="modal-backdrop"><form className="modal provider-modal" onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">Provider record</p><h2>{provider.name ? "Edit provider" : "Add provider"}</h2></div><button type="button" className="close" onClick={onClose}>×</button></div>
    <div className="provider-form-tabs" role="tablist" aria-label="Provider form sections">{([["identity", "Identity"], ["access", "Location & access"], ["participation", "Participation"], ["metrics", "Period metrics"]] as const).map(([id, label]) => <button type="button" role="tab" aria-selected={section === id} className={section === id ? "active" : ""} onClick={() => setSection(id)} key={id}>{label}</button>)}</div>
    {section === "identity" && <div className="form-grid modal-section-grid"><Select label="Provider type" value={form.type} onChange={changeType}><option>Individual</option><option>Facility</option></Select><TextInput label={form.type === "Individual" ? "Provider name" : "Facility name"} value={form.name} onChange={(v) => update("name", v)} required />
      <TextInput label="Provider ID" value={form.id} onChange={(v) => update("id", v)} required /><Select label={form.type === "Individual" ? "Specialty" : "Facility type"} value={form.specialty} onChange={(v) => update("specialty", v)}>{(form.type === "Individual" ? specialties : ["Hospital", "Ambulatory Surgery", "Behavioral Health", "Medical Group", "Skilled Nursing"]).map((s) => <option key={s}>{s}</option>)}</Select>
      <TextInput label="National Provider Identifier (NPI)" value={form.details.npi} onChange={(v) => updateDetail("npi", v)} /><TextInput label="Taxonomy code" value={String(form.details.taxonomyCode)} onChange={(v) => updateDetail("taxonomyCode", v)} /></div>}
    {section === "access" && <div className="form-grid modal-section-grid"><Select label="Primary county" value={form.county} onChange={(v) => update("county", v)}>{counties.map((c) => <option key={c}>{c}</option>)}</Select><TextInput label="Primary practice location" value={form.location} onChange={(v) => update("location", v)} required />
      <TextInput label="City" value={String(form.details.city)} onChange={(v) => updateDetail("city", v)} /><TextInput label="ZIP code" value={String(form.details.zip)} onChange={(v) => updateDetail("zip", v)} />
      <TextInput label="Phone" value={form.details.phone} onChange={(v) => updateDetail("phone", v)} /><TextInput label="Email" value={form.details.email} onChange={(v) => updateDetail("email", v)} />
      <Select label="Accepting new patients" value={form.details.acceptingNewPatients ? "Yes" : "No"} onChange={(v) => updateDetail("acceptingNewPatients", v === "Yes")}><option>Yes</option><option>No</option></Select><Select label="Telehealth available" value={form.details.telehealth ? "Yes" : "No"} onChange={(v) => updateDetail("telehealth", v === "Yes")}><option>Yes</option><option>No</option></Select></div>}
    {section === "participation" && <div className="form-grid modal-section-grid"><Select label="Network status" value={form.network} onChange={(v) => update("network", v)}><option>In Network</option><option>Out of Network</option></Select><Select label="Participation status" value={form.status} onChange={(v) => update("status", v)}><option>Active</option><option>Pending</option><option>Inactive</option><option>Terminated</option></Select>
      <TextInput label="License number" value={String(form.details.licenseNumber)} onChange={(v) => updateDetail("licenseNumber", v)} /><TextInput label="Recredentialing due" value={String(form.details.recredentialingDue)} onChange={(v) => updateDetail("recredentialingDue", v)} /></div>}
    {section === "metrics" && <div className="form-grid modal-section-grid metrics-form-grid"><Select label="Metrics reporting period" value={metricPeriod} onChange={setMetricPeriod}>{reportingPeriods.map((item) => <option value={item.id} key={item.id}>{item.short} · {item.label}</option>)}</Select>
      <div className="period-config-note"><b>Editing {getPeriodLabel(metricPeriod)}</b><span>Switch periods to configure multiple snapshots before saving.</span></div>
      {form.type === "Individual" && <><TextInput label="Attributed members" value={String(metrics.attributedMembers)} onChange={(v) => updateMetric("attributedMembers", v)} /><TextInput label="Current panel size" value={String(metrics.panelSize)} onChange={(v) => updateMetric("panelSize", v)} /><TextInput label="Panel utilization (%)" value={String(metrics.panelUtilization)} onChange={(v) => updateMetric("panelUtilization", v)} /><TextInput label="Preventive compliance (%)" value={String(metrics.preventiveCompliance)} onChange={(v) => updateMetric("preventiveCompliance", v)} /><TextInput label="Care-gap closure (%)" value={String(metrics.careGapClosure)} onChange={(v) => updateMetric("careGapClosure", v)} /></>}
      <TextInput label="Referrals" value={String(metrics.referrals)} onChange={(v) => updateMetric("referrals", v)} /><TextInput label="Claims" value={String(metrics.claims)} onChange={(v) => updateMetric("claims", v)} /><TextInput label="Last claim date" value={metrics.lastClaimDate} onChange={(v) => updateMetric("lastClaimDate", v)} />
      <TextInput label="Paid amount ($)" value={String(metrics.paidAmount)} onChange={(v) => updateMetric("paidAmount", v)} /><TextInput label="PMPM ($)" value={String(metrics.pmpm)} onChange={(v) => updateMetric("pmpm", v)} /><TextInput label="Denial rate (%)" value={String(metrics.denialRate)} onChange={(v) => updateMetric("denialRate", v)} />
      <TextInput label="Quality score (%)" value={String(metrics.qualityScore)} onChange={(v) => updateMetric("qualityScore", v)} /><TextInput label="Patient experience (%)" value={String(metrics.patientExperience)} onChange={(v) => updateMetric("patientExperience", v)} /><TextInput label="Star rating" value={String(metrics.starRating)} onChange={(v) => updateMetric("starRating", v)} /><TextInput label="ER utilization / 1,000" value={String(metrics.erUtilization)} onChange={(v) => updateMetric("erUtilization", v)} />
      {form.type === "Facility" && <><TextInput label="Satisfaction score (%)" value={String(metrics.satisfaction)} onChange={(v) => updateMetric("satisfaction", v)} /><TextInput label="Avoidable hospitalization rate (%)" value={String(metrics.hospitalization)} onChange={(v) => updateMetric("hospitalization", v)} /><TextInput label="Readmission rate (%)" value={String(metrics.readmissionRate)} onChange={(v) => updateMetric("readmissionRate", v)} /><TextInput label="Survey responses" value={String(metrics.responseCount)} onChange={(v) => updateMetric("responseCount", v)} /></>}</div>}
    <div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save provider</Button></div></form></div>;
}

const detailSections: { title: string; description: string; fields: [string, string][] }[] = [
  { title: "Identifiers & demographics", description: "Core identity and enrollment identifiers", fields: [["NPI", "npi"], ["Taxonomy code", "taxonomyCode"], ["Tax ID / TIN", "taxId"], ["Legacy provider ID", "legacyId"], ["CAQH ID", "caqhId"], ["Medicare ID", "medicareId"], ["Medicaid ID", "medicaidId"], ["Legal name", "legalName"], ["Credential", "credential"], ["Gender", "gender"], ["Pronouns", "pronouns"], ["Date of birth", "dateOfBirth"]] },
  { title: "Contact, location & accessibility", description: "Member-facing directory and practice access information", fields: [["Location name", "locationName"], ["Address line 1", "addressLine1"], ["Address line 2", "addressLine2"], ["City", "city"], ["State", "state"], ["ZIP code", "zip"], ["Service area", "serviceArea"], ["Phone", "phone"], ["Fax", "fax"], ["Email", "email"], ["Website", "website"], ["Office hours", "officeHours"], ["After-hours access", "afterHours"], ["ADA accessible", "adaAccessible"], ["Public transit", "publicTransit"], ["Parking", "parking"]] },
  { title: "Patient access & capabilities", description: "Availability, modalities, populations, and language access", fields: [["Accepting new patients", "acceptingNewPatients"], ["Telehealth", "telehealth"], ["Next available appointment", "nextAvailable"], ["Referral required", "referralRequired"], ["Age groups", "ageGroups"], ["Languages", "languages"], ["Cultural competencies", "culturalCompetencies"], ["Panel capacity", "panelCapacity"]] },
  { title: "Practice & affiliations", description: "Group relationships and institutional privileges", fields: [["Medical group", "groupName"], ["Group NPI", "groupNpi"], ["Hospital affiliations", "hospitalAffiliations"], ["Admitting privileges", "admittingPrivileges"], ["PCP designation", "primaryCareDesignation"]] },
  { title: "Licensure, education & credentialing", description: "Primary-source verification and professional qualifications", fields: [["License number", "licenseNumber"], ["License state", "licenseState"], ["License status", "licenseStatus"], ["License expiration", "licenseExpiry"], ["Board certified", "boardCertified"], ["Certifying board", "certifyingBoard"], ["Board expiration", "boardExpiry"], ["Medical school", "medicalSchool"], ["Graduation year", "graduationYear"], ["Residency", "residency"], ["Fellowship", "fellowship"], ["DEA status", "deaStatus"], ["Malpractice carrier", "malpracticeCarrier"], ["Malpractice expiration", "malpracticeExpiry"], ["Sanctions / exclusions", "sanctions"], ["Credentialing status", "credentialingStatus"], ["Initial credentialing", "initialCredentialing"], ["Recredentialing due", "recredentialingDue"], ["Committee decision", "committeeDecision"]] },
  { title: "Contracting & network participation", description: "Agreement, product, payment, and delegation terms", fields: [["Contract ID", "contractId"], ["Contract effective", "contractEffective"], ["Contract term", "contractTerm"], ["Products", "products"], ["Reimbursement model", "reimbursementModel"], ["Risk arrangement", "riskArrangement"], ["Fee schedule", "feeSchedule"], ["Delegated entity", "delegatedEntity"], ["Attribution model", "attributionModel"]] },
  { title: "Directory governance", description: "Provenance, attestation, publication, and audit trail", fields: [["Data source", "dataSource"], ["Last verified", "lastVerified"], ["Verification status", "verificationStatus"], ["Verified by", "verifiedBy"], ["Published in directory", "directoryPublish"], ["Roster source", "rosterSource"], ["Record last updated", "recordUpdated"]] },
];

function formatDetail(value: DetailValue | undefined, key: string) {
  if (value === "" || value === undefined) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (key === "panelUtilization") return `${value}%`;
  return String(value);
}
function DetailPanel({ provider, period, onClose, onEdit }: { provider: Provider; period: string; onClose: () => void; onEdit: () => void }) {
  const metrics = getPeriod(provider, period);
  const periodMetrics: [string, string][] = [
    ["Attributed members", metrics.attributedMembers.toLocaleString()],
    ["Panel size", metrics.panelSize.toLocaleString()],
    ["Panel utilization", `${metrics.panelUtilization}%`],
    ["Preventive compliance", `${metrics.preventiveCompliance}%`],
    ["Referrals", metrics.referrals.toLocaleString()],
    ["Claims", metrics.claims.toLocaleString()],
    ["Last claim date", metrics.lastClaimDate],
    ["Paid amount", `$${metrics.paidAmount.toLocaleString()}`],
    ["PMPM", `$${metrics.pmpm.toFixed(2)}`],
    ["Denial rate", `${metrics.denialRate}%`],
    ["Quality score", `${metrics.qualityScore}%`],
    ["Patient experience", `${metrics.patientExperience}%`],
    ["Star rating", `${metrics.starRating.toFixed(1)} / 5`],
    ["Care-gap closure", `${metrics.careGapClosure}%`],
    ["ER utilization", `${metrics.erUtilization} / 1,000`],
    ...(provider.type === "Facility" ? [["Satisfaction", `${metrics.satisfaction}%`], ["Avoidable hospitalization", `${metrics.hospitalization}%`], ["Readmission rate", `${metrics.readmissionRate}%`], ["Survey responses", metrics.responseCount.toLocaleString()]] as [string, string][] : []),
  ];
  return <div className="panel-backdrop" onClick={onClose}><aside className="detail-panel provider-detail-panel" onClick={(e) => e.stopPropagation()}><div className="modal-head sticky-panel-head"><div><p className="eyebrow">{provider.id} · NPI {provider.details.npi}</p><h2>{provider.name}</h2></div><button className="close" onClick={onClose}>×</button></div><div className="profile-summary"><div className="avatar">{provider.name.split(" ").slice(-2).map((x) => x[0]).join("")}</div><div><h3>{provider.details.credential} · {provider.specialty}</h3><p>{String(provider.details.locationName)} · {provider.location}, {String(provider.details.city)}, CA</p><div className="badge-row"><Badge tone={toneFor(provider.status)}>{provider.status}</Badge><Badge tone={provider.network === "In Network" ? "good" : "neutral"}>{provider.network}</Badge><Badge tone={provider.details.acceptingNewPatients ? "info" : "neutral"}>{provider.details.acceptingNewPatients ? "Accepting patients" : "Panel closed"}</Badge><Badge tone={provider.details.verificationStatus === "Verified" ? "good" : "warn"}>{String(provider.details.verificationStatus)}</Badge></div></div></div>
    <div className="detail-grid profile-kpis"><div><span>Provider type</span><b>{provider.type}</b></div><div><span>Primary county</span><b>{provider.county}</b></div><div><span>{getPeriodLabel(period)} panel / capacity</span><b>{provider.type === "Individual" ? `${metrics.panelSize} / ${provider.details.panelCapacity}` : "Not applicable"}</b></div><div><span>{getPeriodLabel(period)} quality</span><b>{metrics.qualityScore}%</b></div><div><span>Recredentialing</span><b>{String(provider.details.recredentialingDue)}</b></div><div><span>Products</span><b>{(provider.details.products as string[]).length} active</b></div></div>
    {provider.type === "Individual" && <section className="panel-section"><h3>Three-year compliance trend</h3><BarChart suffix="%" data={provider.rates.map((value, i) => ({ label: String(2023 + i), value }))} /></section>}
    <div className="profile-sections"><section className="profile-section period-profile-section"><div className="profile-section-head"><div><h3>Reporting period metrics</h3><p>{getPeriodLabel(period)} utilization, financial, quality, and experience values</p></div><span>{periodMetrics.length} fields</span></div><dl>{periodMetrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>{detailSections.map((section) => <section className="profile-section" key={section.title}><div className="profile-section-head"><div><h3>{section.title}</h3><p>{section.description}</p></div><span>{section.fields.length} fields</span></div><dl>{section.fields.map(([label, key]) => <div key={key}><dt>{label}</dt><dd>{formatDetail(provider.details[key], key)}</dd></div>)}</dl></section>)}</div>
    <div className="panel-footer"><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={onEdit}>Edit record</Button></div></aside></div>;
}

function Compliance({ providers, period, preset, target, setTarget, addAction }: { providers: Provider[]; period: string; preset: ComplianceFilterPreset; target: number; setTarget: (n: number) => void; addAction: (c: string, s: string, r: string, p?: Action["priority"]) => void }) {
  const [county, setCounty] = useState("All");
  const [focus, setFocus] = useState<ComplianceFilterPreset>(preset);
  const pcps = providers.filter((p) => p.type === "Individual" && p.specialty === "Primary Care" && (county === "All" || p.county === county));
  const lowPerformers = pcps.filter((provider) => getPeriod(provider, period).preventiveCompliance < target);
  const rows = focus === "below-target" ? lowPerformers : focus === "improvement-plans" ? lowPerformers.slice(0, 3) : pcps;
  const avg = Math.round(pcps.reduce((sum, provider) => sum + getPeriod(provider, period).preventiveCompliance, 0) / Math.max(pcps.length, 1));
  useEffect(() => { setFocus(preset); setCounty("All"); }, [preset]);
  return <>
    <PageHeader eyebrow="Quality improvement" title="Preventive Care Compliance" description="Identify persistently low-performing PCPs and initiate evidence-based improvement workflows." />
    <section className="settings-strip"><div><b>Performance rule</b><p>Classify PCPs below the selected target for 3 consecutive reporting years.</p></div><label className="range-control"><span>Minimum acceptable rate <b>{target}%</b></span><input type="range" min="60" max="90" value={target} onChange={(e) => setTarget(Number(e.target.value))} /></label></section>
    <div className="toolbar"><Select label="Performance view" value={focus} onChange={(value) => setFocus(value as ComplianceFilterPreset)}><option value="all">All evaluated PCPs</option><option value="below-target">Below period target</option><option value="evaluated">Eligible PCP cohort</option><option value="improvement-plans">Open improvement plans</option></Select><Select label="County" value={county} onChange={setCounty}><option>All</option>{counties.map((c) => <option key={c}>{c}</option>)}</Select><span className="result-count">{rows.length} providers · {getPeriodLabel(period)} IPA rate {avg}%</span></div>
    <section className="table-card"><div className="table-wrap"><table><thead><tr><th>Provider</th><th>County</th><th>2023</th><th>2024</th><th>2025</th><th>{getPeriodLabel(period)}</th><th>Target</th><th>Eligible members</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((provider) => { const metrics = getPeriod(provider, period); const belowTarget = metrics.preventiveCompliance < target; return <tr key={provider.id}><td><b>{provider.name}</b><small>{provider.id}</small></td><td>{provider.county}</td>{provider.rates.map((rate, index) => <td key={index}><span className={rate < target ? "metric-low" : "metric-good"}>{rate}%</span></td>)}<td><span className={belowTarget ? "metric-low" : "metric-good"}>{metrics.preventiveCompliance}%</span></td><td>{target}%</td><td>{metrics.attributedMembers}</td><td><Badge tone={belowTarget ? "bad" : "good"}>{belowTarget ? "Below target" : "Meets standard"}</Badge></td><td><Button variant="secondary" onClick={() => addAction("Provider Education", provider.name, `Below ${target}% in ${getPeriodLabel(period)}`)}>Create plan</Button></td></tr>; })}</tbody></table></div>{!rows.length && <Empty title="No providers match this rule" message="Adjust the threshold or change the performance view." />}</section>
  </>;
}

const memberCounts: Record<string, number> = { Alameda: 4780, "Contra Costa": 3950, Marin: 1840, Napa: 1560, "San Francisco": 3640, "San Mateo": 2650 };
function adequacyRows(providers: Provider[], threshold: number) {
  return counties.flatMap((county) => specialties.slice(0, 6).map((specialty) => {
    const members = Math.round(memberCounts[county] * ({ "Primary Care": 1, Cardiology: .22, Dermatology: .15, Endocrinology: .12, Gastroenterology: .16, Neurology: .1 }[specialty] || .1));
    const count = providers.filter((p) => p.type === "Individual" && p.county === county && p.specialty === specialty && p.status === "Active" && p.network === "In Network").length;
    return { county, specialty, members, count, ratio: count ? Math.round(members / count) : members, gap: Math.max(0, Math.ceil(members / threshold) - count) };
  }));
}
function Adequacy({ providers, preset, threshold, setThreshold, addAction }: { providers: Provider[]; preset: AdequacyFilterPreset; threshold: number; setThreshold: (n: number) => void; addAction: (c: string, s: string, r: string) => void }) {
  const [county, setCounty] = useState("All");
  const [focus, setFocus] = useState<AdequacyFilterPreset>(preset);
  const allRows = adequacyRows(providers, threshold).filter((row) => (county === "All" || row.county === county) && row.gap > 0);
  const rows = [...allRows]
    .sort((a, b) => focus === "member-impact" ? b.members - a.members : b.gap - a.gap)
    .slice(0, focus === "recruitment" ? 6 : undefined);
  useEffect(() => { setFocus(preset); setCounty("All"); }, [preset]);
  return <>
    <PageHeader eyebrow="Network growth" title="Network Adequacy" description="Analyze county and specialty capacity against configurable members-per-provider thresholds." />
    <section className="settings-strip"><div><b>Capacity assumption</b><p>Additional providers = ceiling(member count ÷ threshold) − active providers.</p></div><label className="range-control"><span>Maximum members per provider <b>{threshold}</b></span><input type="range" min="150" max="500" step="25" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /></label></section>
    <div className="toolbar"><Select label="Adequacy view" value={focus} onChange={(value) => setFocus(value as AdequacyFilterPreset)}><option value="gaps">County-specialty gaps</option><option value="providers-needed">Additional providers needed</option><option value="member-impact">Highest member impact</option><option value="recruitment">Top recruitment opportunities</option></Select><Select label="County" value={county} onChange={setCounty}><option>All</option>{counties.map((c) => <option key={c}>{c}</option>)}</Select><span className="result-count">{rows.length} combinations</span></div>
    <section className="table-card"><div className="table-wrap"><table><thead><tr><th>County</th><th>Specialty</th><th>Attributed members</th><th>Active providers</th><th>Members / provider</th><th>Threshold</th><th>Gap</th><th>Recommended addition</th><th>Action</th></tr></thead><tbody>{rows.map((r) => <tr key={`${r.county}-${r.specialty}`}><td><b>{r.county}</b><small>California</small></td><td>{r.specialty}</td><td>{r.members.toLocaleString()}</td><td>{r.count}</td><td><b className={r.ratio > threshold ? "metric-low" : "metric-good"}>{r.ratio.toLocaleString()}</b></td><td>{threshold}</td><td><Badge tone={r.gap ? "bad" : "good"}>{r.gap ? "Below threshold" : "Adequate"}</Badge></td><td><b>{r.gap}</b></td><td><Button variant="secondary" disabled={!r.gap} onClick={() => addAction("Recruitment", `${r.specialty} — ${r.county}`, `${r.ratio} members per provider; recruit ${r.gap}`)}>Recruit</Button></td></tr>)}</tbody></table></div></section>
  </>;
}

const services = [
  { name: "Advanced Diagnostic Imaging", category: "Radiology", utilization: "2,840 services", spend: "$3.8M", variability: "Low", coverage: 78, status: "Potentially manageable", specialty: "Radiology" },
  { name: "Outpatient Cardiac Testing", category: "Cardiology", utilization: "1,420 services", spend: "$2.1M", variability: "Medium", coverage: 64, status: "Under assessment", specialty: "Cardiology" },
  { name: "Infusion Therapy", category: "Oncology", utilization: "680 services", spend: "$4.6M", variability: "High", coverage: 42, status: "Not currently manageable", specialty: "Oncology" },
  { name: "Ambulatory GI Procedures", category: "Gastroenterology", utilization: "1,180 services", spend: "$1.9M", variability: "Low", coverage: 83, status: "Approved for further evaluation", specialty: "Gastroenterology" },
  { name: "Physical Therapy", category: "Rehabilitation", utilization: "4,960 services", spend: "$1.2M", variability: "Low", coverage: 91, status: "Potentially manageable", specialty: "Physical Therapy" },
];
function Dofr({ addAction, go }: { addAction: (c: string, s: string, r: string, p?: Action["priority"]) => void; go: (p: Page) => void }) {
  const [selected, setSelected] = useState(services[0]);
  return <>
    <PageHeader eyebrow="Financial responsibility" title="DOFR Risk Expansion" description="Evaluate services for potential responsibility expansion with traceable clinical and network evidence." />
    <div className="workflow-steps"><b>Service assessment</b><span>→</span><b>Required specialties</b><span>→</span><b>County gap</b><span>→</span><b>Recruitment</b><span>→</span><b>Expansion review</b></div>
    <div className="split-layout"><section className="table-card"><div className="card-head padded"><div><h2>Service assessment catalog</h2><p>{services.length} service categories under review</p></div></div><div className="service-list">{services.map((s) => <button className={selected.name === s.name ? "selected" : ""} onClick={() => setSelected(s)} key={s.name}><div><b>{s.name}</b><small>{s.category}</small></div><Badge tone={toneFor(s.status)}>{s.status}</Badge></button>)}</div></section>
      <section className="detail-card"><div className="card-head"><div><p className="eyebrow">Assessment detail</p><h2>{selected.name}</h2></div><Badge tone={toneFor(selected.status)}>{selected.status}</Badge></div><div className="metric-grid"><div><span>Historical utilization</span><b>{selected.utilization}</b></div><div><span>Historical expenditure</span><b>{selected.spend}</b></div><div><span>Cost variability</span><b>{selected.variability}</b></div><div><span>Existing coverage</span><b>{selected.coverage}%</b></div></div>
        <div className="assessment"><h3>Preliminary manageability rationale</h3><p>Utilization is sufficiently consistent for operational review. Performance data is available, but county-level specialist capacity must be validated before a financial recommendation is made.</p></div>
        <div className="specialty-callout"><span>Required specialty</span><b>{selected.specialty}</b><p>Coverage is adequate in 3 of 6 member counties. Napa and Marin require additional review.</p><div><Button variant="secondary" onClick={() => go("adequacy")}>View network gaps</Button><Button onClick={() => addAction("DOFR Review", selected.name, `${selected.specialty} network validation required`, "Medium")}>Create review action</Button></div></div>
        <p className="disclaimer">Preliminary operational assessment only. This does not represent a profitability or contract recommendation.</p>
      </section>
    </div>
  </>;
}

const referralData = [
  { specialty: "Cardiology", referrals: 286, members: 214, trend: 18, network: 5, county: "Napa", priority: "High" },
  { specialty: "Dermatology", referrals: 242, members: 196, trend: 11, network: 4, county: "Marin", priority: "High" },
  { specialty: "Orthopedics", referrals: 208, members: 178, trend: 6, network: 5, county: "Contra Costa", priority: "High" },
  { specialty: "Neurology", referrals: 174, members: 138, trend: -2, network: 4, county: "San Mateo", priority: "Medium" },
  { specialty: "Behavioral Health", referrals: 152, members: 127, trend: 9, network: 4, county: "Alameda", priority: "Medium" },
  { specialty: "Endocrinology", referrals: 108, members: 93, trend: -7, network: 5, county: "San Francisco", priority: "Low" },
];
function Referrals({ providers, preset, addAction }: { providers: Provider[]; preset: ReferralFilterPreset; addAction: (c: string, s: string, r: string) => void }) {
  const [county, setCounty] = useState("All");
  const [focus, setFocus] = useState<ReferralFilterPreset>(preset);
  const data = referralData
    .filter((row) => county === "All" || row.county === county)
    .filter((row) => focus === "member-impact" ? row.members >= 125 : focus === "rising-share" ? row.trend > 0 : focus === "high-priority" ? row.priority === "High" : true)
    .sort((a, b) => focus === "member-impact" ? b.members - a.members : focus === "rising-share" ? b.trend - a.trend : b.referrals - a.referrals);
  useEffect(() => { setFocus(preset); setCounty("All"); }, [preset]);
  return <>
    <PageHeader eyebrow="Referral management" title="Out-of-Network Referrals" description="Prioritize specialty recruitment using referral volume, member impact, and current network capacity." />
    <div className="toolbar"><Select label="Referral view" value={focus} onChange={(value) => setFocus(value as ReferralFilterPreset)}><option value="volume">All OON referrals</option><option value="member-impact">Highest member impact</option><option value="rising-share">Rising OON share</option><option value="high-priority">High-priority specialties</option></Select><Select label="County" value={county} onChange={setCounty}><option>All</option>{counties.map((c) => <option key={c}>{c}</option>)}</Select><span className="result-count">{data.length} specialties</span></div>
    <section className="table-card"><div className="table-wrap"><table><thead><tr><th>Specialty</th><th>OON referrals</th><th>Affected members</th><th>Quarterly trend</th><th>In-network specialists</th><th>Highest-need county</th><th>Priority</th><th>Action</th></tr></thead><tbody>{data.map((r) => <tr key={r.specialty}><td><b>{r.specialty}</b></td><td><b>{r.referrals}</b></td><td>{r.members}</td><td><span className={r.trend > 0 ? "metric-low" : "metric-good"}>{r.trend > 0 ? "+" : ""}{r.trend}%</span></td><td>{providers.filter((p) => p.specialty === r.specialty && p.status === "Active").length || r.network}</td><td>{r.county}</td><td><Badge tone={toneFor(r.priority)}>{r.priority}</Badge></td><td><Button variant="secondary" onClick={() => addAction("Recruitment", `${r.specialty} — ${r.county}`, `${r.referrals} out-of-network referrals`)}>Create opportunity</Button></td></tr>)}</tbody></table></div></section>
  </>;
}

function Facilities({ providers, period, addAction }: { providers: Provider[]; period: string; addAction: (c: string, s: string, r: string) => void }) {
  const facilities = providers.filter((p) => p.type === "Facility");
  const [quadrant, setQuadrant] = useState("All");
  const classify = (facility: Provider) => { const metrics = getPeriod(facility, period); return metrics.satisfaction >= 80 && metrics.hospitalization <= 7 ? "Retain" : metrics.satisfaction < 80 && metrics.hospitalization > 7 ? "Find Replacement" : "Educate"; };
  const shown = facilities.filter((f) => quadrant === "All" || classify(f) === quadrant);
  const count = (q: string) => facilities.filter((f) => classify(f) === q).length;
  return <>
    <PageHeader eyebrow="Quality oversight" title="Facility Quality" description="Evaluate satisfaction and avoidable hospitalizations with explainable, reviewable recommendations." />
    <div className="threshold-note"><span>{getPeriodLabel(period)} quality thresholds</span><b>Satisfaction ≥ 80%</b><b>Avoidable hospitalizations ≤ 7.0%</b><small>Minimum sample: 30 responses</small></div>
    <div className="facility-layout"><section className="matrix-card"><div className="card-head"><div><h2>Facility decision matrix</h2><p>Select a quadrant to filter the facility list</p></div><Button variant="ghost" onClick={() => setQuadrant("All")}>Clear filter</Button></div><div className="matrix"><div className="axis-y">Satisfaction acceptable</div><button className={quadrant === "Retain" ? "selected retain" : "retain"} onClick={() => setQuadrant("Retain")}><span>{count("Retain")}</span><b>Retain</b><small>Both measures acceptable</small></button><button className={quadrant === "Educate" ? "selected educate" : "educate"} onClick={() => setQuadrant("Educate")}><span>{count("Educate")}</span><b>Educate</b><small>One measure needs attention</small></button><button className={quadrant === "Find Replacement" ? "selected replace" : "replace"} onClick={() => setQuadrant("Find Replacement")}><span>{count("Find Replacement")}</span><b>Find Replacement</b><small>Both measures unacceptable</small></button><div className="axis-x">Avoidable hospitalization performance →</div></div></section>
      <section className="card"><div className="card-head"><div><h2>Classification summary</h2><p>{facilities.length} facilities evaluated</p></div></div><BarChart data={[{ label: "Retain", value: count("Retain") }, { label: "Educate", value: count("Educate") }, { label: "Replace", value: count("Find Replacement") }]} /></section></div>
    <section className="table-card"><div className="card-head padded"><div><h2>{quadrant === "All" ? "All facilities" : `${quadrant} recommendations`}</h2><p>{getPeriodLabel(period)} scores and decision rationale</p></div><Badge tone="info">{shown.length} facilities</Badge></div><div className="table-wrap"><table><thead><tr><th>Facility</th><th>County</th><th>Satisfaction</th><th>Classification</th><th>Avoidable hospitalization</th><th>Classification</th><th>Recommendation</th><th>Action</th></tr></thead><tbody>{shown.map((facility) => { const metrics = getPeriod(facility, period); const classification = classify(facility); return <tr key={facility.id}><td><b>{facility.name}</b><small>{facility.specialty}</small></td><td>{facility.county}</td><td><b>{metrics.satisfaction}%</b><small>n={metrics.responseCount} responses</small></td><td><Badge tone={metrics.satisfaction >= 80 ? "good" : "bad"}>{metrics.satisfaction >= 80 ? "Acceptable" : "Not Acceptable"}</Badge></td><td><b>{metrics.hospitalization}%</b><small>{getPeriodLabel(period)} measurement period</small></td><td><Badge tone={metrics.hospitalization <= 7 ? "good" : "bad"}>{metrics.hospitalization <= 7 ? "Acceptable" : "Not Acceptable"}</Badge></td><td><Badge tone={toneFor(classification)}>{classification}</Badge></td><td><Button variant="secondary" onClick={() => addAction(classification === "Retain" ? "Facility Retention" : classification === "Educate" ? "Facility Improvement" : "Replacement Review", facility.name, `${getPeriodLabel(period)} satisfaction ${metrics.satisfaction}%; hospitalization ${metrics.hospitalization}%`)}>Start review</Button></td></tr>; })}</tbody></table></div></section>
  </>;
}

const planTemplates: Record<string, string[]> = {
  "Increase Specialist Participation": ["Analyze member demand and network capacity", "Identify specialty and geographic gaps", "Prioritize candidate providers", "Validate provider interest", "Conduct outreach and negotiate participation", "Complete contracting and credentialing handoffs", "Update provider directory", "Verify availability and measure change"],
  "Improve Preventive-Care Compliance": ["Review compliance rates and PCP cohort", "Validate data and investigate root causes", "Agree on provider-level actions", "Conduct provider outreach and support", "Remeasure compliance", "Recommend continuation or escalation"],
  "Reduce Out-of-Network Referrals": ["Analyze OON referrals and drivers", "Compare demand with network capacity", "Identify recruitment or routing opportunities", "Coordinate with utilization management", "Implement approved changes", "Compare pre/post referral rates"],
  "Assess Additional DOFR Risk": ["Validate service volume and financial exposure", "Assess clinical and operational risks", "Review network capacity", "Develop decision package", "Obtain executive approvals", "Track approved changes"],
  "Custom Work plan": [],
};

function WorkPlanSetup({ source, onClose, onCreate }: { source: Action | null; onClose: () => void; onCreate: (plan: WorkPlan) => void }) {
  const suggestedTemplate = source?.category === "Recruitment" ? "Increase Specialist Participation" : source?.category === "Provider Education" ? "Improve Preventive-Care Compliance" : source?.category === "DOFR Review" ? "Assess Additional DOFR Risk" : "Custom Work plan";
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(source?.subject || "");
  const [owner, setOwner] = useState(source?.owner || "Unassigned");
  const [department, setDepartment] = useState(source?.department || "Provider Relations");
  const [start, setStart] = useState(source?.start || "2026-04-15");
  const [due, setDue] = useState(source?.due || "2026-07-31");
  const [template, setTemplate] = useState(suggestedTemplate);
  const [success, setSuccess] = useState(source?.expectedResult || "");
  const canContinue = step === 1 || (step === 2 && title && owner !== "Unassigned" && department && start && due && success) || step === 3;
  const create = () => {
    const taskNames = planTemplates[template];
    const id = `WP-${String(Date.now()).slice(-5)}`;
    const tasks: WorkTask[] = taskNames.map((name, index) => ({ id: `${id}-T${index + 1}`, name, owner: index < 2 ? owner : "Unassigned", department: index % 2 ? "Provider Relations" : department, due, status: "Not Started", dependency: index ? `${id}-T${index}` : undefined }));
    onCreate({ id, name: title, actionId: source?.id, objective: source?.reason || title, rationale: source?.evidence || "Directly created work plan", expectedResult: source?.expectedResult || success, successCriteria: success, owner, department, supporting: ["Provider Relations", "Analytics"], sponsor: "Maya Ortiz", priority: source?.priority || "Medium", start, due, status: "Ready to Start", health: "On Track", progress: 0, nextReview: start, template, lastUpdated: new Date().toISOString().slice(0, 10), tasks, milestones: [{ id: `${id}-M1`, name: "Initial plan review completed", owner, due: start, status: "Upcoming" }], kpis: [], risks: [], activity: [{ date: new Date().toISOString().slice(0, 10), text: source ? `Created from ${source.id}` : "Work plan created directly", by: owner }] });
  };
  return <div className="modal-backdrop"><div className="modal work-plan-setup"><div className="modal-head"><div><p className="eyebrow">Guided setup · Step {step} of 4</p><h2>{source ? "Initiate linked work plan" : "Create work plan"}</h2></div><button className="close" onClick={onClose}>×</button></div>
    <div className="setup-steps">{["Source & objective", "Accountability", "Template", "Review"].map((label, index) => <span className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""} key={label}>{index + 1}. {label}</span>)}</div>
    <div className="setup-body">
      {step === 1 && <><div className="source-context"><Badge tone={source?.approval === "Approved" ? "good" : "info"}>{source ? `${source.id} · ${source.approval}` : "Directly created"}</Badge><h3>{source?.subject || "No source action"}</h3><p>{source?.reason || "This plan is being created directly in Provider Relations."}</p></div><div className="detail-grid"><div><span>Source evidence</span><b>{source?.evidence || "To be documented"}</b></div><div><span>Expected result</span><b>{source?.expectedResult || "Define in next step"}</b></div><div><span>Priority</span><b>{source?.priority || "Medium"}</b></div><div><span>Approval</span><b>{source?.approval || "Direct creation"}</b></div></div></>}
      {step === 2 && <div className="form-grid"><TextInput label="Work plan title" value={title} onChange={setTitle} required /><Select label="Initiative owner" value={owner} onChange={setOwner}><option>Unassigned</option><option>Maya Ortiz</option><option>Jordan Lee</option><option>Priya Shah</option><option>Evan Brooks</option></Select><Select label="Owning department" value={department} onChange={setDepartment}>{["Provider Relations", "Network Management", "Quality Improvement", "Credentialing", "Finance", "Clinical Leadership"].map((item) => <option key={item}>{item}</option>)}</Select><TextInput label="Success criteria" value={success} onChange={setSuccess} required /><TextInput label="Start date" value={start} onChange={setStart} /><TextInput label="Target completion" value={due} onChange={setDue} /></div>}
      {step === 3 && <div className="template-grid">{Object.entries(planTemplates).map(([name, tasks]) => <button className={template === name ? "template selected" : "template"} onClick={() => setTemplate(name)} key={name}><b>{name}</b><span>{tasks.length ? `${tasks.length} editable suggested tasks` : "Start without predefined tasks"}</span></button>)}</div>}
      {step === 4 && <><div className="review-grid"><div><span>Plan</span><b>{title}</b></div><div><span>Source</span><b>{source?.id || "Directly created"}</b></div><div><span>Accountable owner</span><b>{owner}</b></div><div><span>Owning department</span><b>{department}</b></div><div><span>Timeline</span><b>{start} → {due}</b></div><div><span>Template</span><b>{template}</b></div></div><section className="review-tasks"><h3>Proposed tasks</h3>{planTemplates[template].map((task) => <span key={task}>{task}</span>)}{!planTemplates[template].length && <p>No predefined tasks. Add tasks after creation.</p>}</section><p className="disclaimer">Suggested tasks do not approve clinical, financial, credentialing, or network decisions. Human review remains required.</p></>}
    </div><div className="modal-actions"><Button variant="secondary" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</Button>{step < 4 ? <Button disabled={!canContinue} onClick={() => setStep(step + 1)}>Continue</Button> : <Button onClick={create}>Create work plan</Button>}</div>
  </div></div>;
}

function ProviderRelations({ view, filter, onOpenRegister, workPlans, setWorkPlans, actions, selectedId, setSelectedId, openSourceAction, onCreate }: { view: "relations" | "workplans"; filter?: string; onOpenRegister: (filter: string) => void; workPlans: WorkPlan[]; setWorkPlans: React.Dispatch<React.SetStateAction<WorkPlan[]>>; actions: Action[]; selectedId: string | null; setSelectedId: (id: string | null) => void; openSourceAction: (id: string) => void; onCreate: () => void }) {
  const [focus, setFocus] = useState(filter || "All");
  useEffect(() => { setFocus(filter || "All"); setSearch(""); }, [filter, view]);
  const [search, setSearch] = useState("");
  const selected = workPlans.find((plan) => plan.id === selectedId);
  const overdueTasks = workPlans.flatMap((plan) => plan.tasks.map((task) => ({ plan, task }))).filter(({ task }) => task.status !== "Completed" && task.due < "2026-04-15");
  const dueMilestones = workPlans.flatMap((plan) => plan.milestones.map((milestone) => ({ plan, milestone }))).filter(({ milestone }) => milestone.status !== "Completed").sort((a, b) => a.milestone.due.localeCompare(b.milestone.due));
  const attention = workPlans.filter((plan) => ["At Risk", "Blocked", "Overdue"].includes(plan.health));
  const shown = workPlans.filter((plan) => `${plan.name} ${plan.owner} ${plan.department} ${plan.id}`.toLowerCase().includes(search.toLowerCase())).filter((plan) => focus === "All" || focus === "Active" ? focus === "All" || !["Completed", "Cancelled"].includes(plan.status) : focus === "Attention" ? ["At Risk", "Blocked", "Overdue"].includes(plan.health) : focus === "Decisions" ? plan.risks.some((risk) => risk.decisionFrom && risk.status !== "Resolved") : focus === "Overdue tasks" ? overdueTasks.some(({ plan: match }) => match.id === plan.id) : focus === "Upcoming milestones" ? dueMilestones.slice(0, 3).some(({ plan: match }) => match.id === plan.id) : focus === "Outcomes below target" ? plan.kpis.some((kpi) => ["At Risk", "Target Missed"].includes(kpi.status)) : plan.health === focus);
  const updatePlan = (updated: WorkPlan) => setWorkPlans((current) => current.map((plan) => plan.id === updated.id ? updated : plan));
  if (view === "workplans" && selected) return <WorkPlanDetail plan={selected} source={actions.find((action) => action.id === selected.actionId)} onBack={() => setSelectedId(null)} onUpdate={updatePlan} openSourceAction={openSourceAction} />;
  return <>
    <PageHeader eyebrow="Provider relations" title={view === "relations" ? "Relations workflow" : "Work plan"} description="Turn approved opportunities into accountable cross-functional execution and measurable follow-up." action={<Button onClick={onCreate}>Create work plan</Button>} />
    {view === "relations" ? <>
    <div className="stat-grid provider-relations-kpis"><Stat label="Active work plans" value={workPlans.filter((plan) => !["Completed", "Cancelled"].includes(plan.status)).length} note="Execution portfolio" onClick={() => onOpenRegister("Active")} /><Stat label="At risk / blocked" value={attention.length} note="Needs intervention" tone="red" onClick={() => onOpenRegister("Attention")} /><Stat label="Overdue tasks" value={overdueTasks.length} note="Past due and incomplete" tone="amber" onClick={() => onOpenRegister("Overdue tasks")} /><Stat label="Milestones due soon" value={dueMilestones.slice(0, 3).length} note="Next checkpoints" tone="blue" onClick={() => onOpenRegister("Upcoming milestones")} /><Stat label="Outcomes below target" value={workPlans.flatMap((plan) => plan.kpis).filter((kpi) => ["At Risk", "Target Missed"].includes(kpi.status)).length} note="Measurement review needed" tone="amber" onClick={() => onOpenRegister("Outcomes below target")} /><Stat label="Decisions required" value={workPlans.flatMap((plan) => plan.risks).filter((risk) => risk.decisionFrom && risk.status !== "Resolved").length} note="Executive or department decision" tone="red" onClick={() => onOpenRegister("Decisions")} /></div>
    <div className="relations-layout"><section className="card"><div className="card-head"><div><h2>Upcoming milestones</h2><p>Next checkpoints across active plans</p></div></div><div className="milestone-list">{dueMilestones.slice(0, 5).map(({ plan, milestone }) => <button onClick={() => setSelectedId(plan.id)} key={milestone.id}><span><b>{milestone.name}</b><small>{plan.name} · {milestone.owner}</small></span><time>{milestone.due}</time></button>)}</div></section><section className="card"><div className="card-head"><div><h2>Needs attention</h2><p>Blockers, missed dates, and decisions</p></div></div><div className="attention-list">{attention.map((plan) => <button onClick={() => setSelectedId(plan.id)} key={plan.id}><Badge tone={toneFor(plan.health)}>{plan.health}</Badge><span><b>{plan.name}</b><small>{plan.risks.find((risk) => risk.status !== "Resolved")?.issue || "Schedule or KPI risk"}</small></span></button>)}</div></section></div>
    </> : <>
    <div className="section-heading"><div><h2>Work plan register</h2><p>Execution status and health are tracked separately.</p></div><Badge tone="info">Illustrative demo data</Badge></div>
    <div className="toolbar"><TextInput value={search} onChange={setSearch} placeholder="Search plan, owner, department…" /><Select label="Portfolio view" value={focus} onChange={setFocus}><option>All</option><option>Active</option><option>Attention</option><option>Decisions</option><option>Overdue tasks</option><option>Upcoming milestones</option><option>Outcomes below target</option><option>On Track</option><option>At Risk</option><option>Blocked</option></Select><Button variant="ghost" onClick={() => { setFocus("All"); setSearch(""); }}>Clear filters</Button><span className="result-count">{shown.length} work plans</span></div>
    <section className="table-card"><div className="table-wrap"><table><thead><tr><th>Work plan</th><th>Source action</th><th>Owner / department</th><th>Priority</th><th>Target date</th><th>Execution</th><th>Health</th><th>Progress</th><th>Next milestone</th><th>Updated</th></tr></thead><tbody>{shown.map((plan) => <tr className="clickable-row" onClick={() => setSelectedId(plan.id)} key={plan.id}><td><b>{plan.name}</b><small>{plan.id}</small></td><td>{plan.actionId || "Directly created"}</td><td><b>{plan.owner}</b><small>{plan.department}</small></td><td><Badge tone={toneFor(plan.priority)}>{plan.priority}</Badge></td><td>{plan.due}</td><td><Badge tone={toneFor(plan.status)}>{plan.status}</Badge></td><td><Badge tone={toneFor(plan.health)}>{plan.health}</Badge></td><td><b>{plan.progress}%</b><small>{plan.tasks.filter((task) => task.status === "Completed").length}/{plan.tasks.length} tasks</small></td><td>{plan.milestones.find((milestone) => milestone.status !== "Completed")?.name || "No upcoming milestone"}</td><td>{plan.lastUpdated}</td></tr>)}</tbody></table></div>{!shown.length && <Empty title="No work plans found" message="Clear filters or create a new work plan." />}</section>
    </>}
  </>;
}

function WorkPlanDetail({ plan, source, onBack, onUpdate, openSourceAction }: { plan: WorkPlan; source?: Action; onBack: () => void; onUpdate: (plan: WorkPlan) => void; openSourceAction: (id: string) => void }) {
  const [tab, setTab] = useState("Overview");
  const save = (changes: Partial<WorkPlan>, activity?: string) => onUpdate({ ...plan, ...changes, lastUpdated: new Date().toISOString().slice(0, 10), activity: activity ? [{ date: new Date().toISOString().slice(0, 10), text: activity, by: "Maya Ortiz" }, ...plan.activity] : plan.activity });
  const updateTask = (id: string, changes: Partial<WorkTask>) => { const tasks = plan.tasks.map((task) => task.id === id ? { ...task, ...changes } : task); const progress = tasks.length ? Math.round(tasks.filter((task) => task.status === "Completed").length / tasks.length * 100) : 0; save({ tasks, progress }, `Task updated: ${tasks.find((task) => task.id === id)?.name}`); };
  const addTask = () => { const name = window.prompt("Task name"); if (!name) return; save({ tasks: [...plan.tasks, { id: `${plan.id}-T${plan.tasks.length + 1}`, name, owner: "Unassigned", department: "Provider Relations", due: plan.due, status: "Not Started" }] }, `Task added: ${name}`); };
  const addMilestone = () => { const name = window.prompt("Milestone name"); if (!name) return; save({ milestones: [...plan.milestones, { id: `${plan.id}-M${plan.milestones.length + 1}`, name, owner: plan.owner, due: plan.due, status: "Upcoming" }] }, `Milestone added: ${name}`); };
  const requestDecision = () => save({ health: "At Risk", risks: [...plan.risks, { id: `${plan.id}-R${plan.risks.length + 1}`, issue: "Executive decision requested", impact: "Execution may be delayed", severity: "High", owner: plan.owner, due: plan.nextReview, decisionFrom: plan.sponsor, status: "Open" }] }, "Executive decision requested");
  const close = () => { if (plan.tasks.some((task) => !["Completed", "Cancelled"].includes(task.status))) return window.alert("Complete or cancel all tasks before closure."); if (!window.confirm("Confirm deliverables, milestones, outcomes, risks, and reviewer approval are documented?")) return; save({ status: plan.kpis.some((kpi) => kpi.status === "Not Yet Measured") ? "Work Complete — Outcome Follow-up Pending" : "Completed", health: "On Track", progress: 100 }, "Closure review completed"); };
  return <>
    <button className="back-link" onClick={onBack}>← Back to work plans</button>
    <div className="work-plan-header"><div><p className="eyebrow">{plan.id} · {plan.template}</p><h1>{plan.name}</h1><div className="badge-row"><Badge tone={toneFor(plan.status)}>{plan.status}</Badge><Badge tone={toneFor(plan.health)}>{plan.health}</Badge><Badge tone={toneFor(plan.priority)}>{plan.priority} priority</Badge></div></div><div className="work-plan-actions">{source && <Button variant="secondary" onClick={() => openSourceAction(source.id)}>Open source action</Button>}<Button variant="secondary" onClick={addTask}>Add task</Button><Button variant="secondary" onClick={addMilestone}>Add milestone</Button><Button variant="secondary" onClick={requestDecision}>Request decision</Button><Button onClick={close}>Close plan</Button></div></div>
    <div className="progress-strip"><div><span>Progress</span><b>{plan.progress}%</b><i><em style={{ width: `${plan.progress}%` }} /></i></div><div><span>Initiative owner</span><b>{plan.owner}</b></div><div><span>Owning department</span><b>{plan.department}</b></div><div><span>Target completion</span><b>{plan.due}</b></div><div><span>Next review</span><b>{plan.nextReview}</b></div></div>
    <div className="action-tabs work-plan-tabs">{["Overview", "Tasks & Milestones", "Outcomes & KPIs", "Risks & Decisions", "Activity"].map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
    {tab === "Overview" && <div className="dashboard-grid"><section className="card"><h2>Objective and rationale</h2><p>{plan.objective}</p><h3>Rationale</h3><p>{plan.rationale}</p><h3>Expected result</h3><p>{plan.expectedResult}</p><h3>Success criteria</h3><p>{plan.successCriteria}</p></section><section className="card"><h2>Accountability and timeline</h2><div className="detail-grid compact-details"><div><span>Executive sponsor</span><b>{plan.sponsor}</b></div><div><span>Supporting teams</span><b>{plan.supporting.join(", ")}</b></div><div><span>Start date</span><b>{plan.start}</b></div><div><span>Next milestone</span><b>{plan.milestones.find((milestone) => milestone.status !== "Completed")?.name || "None"}</b></div></div><h3>Current blockers</h3>{plan.risks.filter((risk) => risk.status !== "Resolved").map((risk) => <p key={risk.id}><b>{risk.issue}:</b> {risk.impact}</p>)}</section></div>}
    {tab === "Tasks & Milestones" && <><section className="table-card"><div className="card-head padded"><div><h2>Tasks</h2><p>Dependencies remain visible until prerequisites are complete.</p></div><Button onClick={addTask}>Add task</Button></div><div className="table-wrap"><table><thead><tr><th>Task</th><th>Owner</th><th>Department</th><th>Due</th><th>Dependency</th><th>Status</th></tr></thead><tbody>{plan.tasks.map((task) => <tr key={task.id}><td><b>{task.name}</b><small>{task.note || task.id}</small></td><td><Select value={task.owner} onChange={(owner) => updateTask(task.id, { owner })}><option>Unassigned</option><option>Maya Ortiz</option><option>Jordan Lee</option><option>Priya Shah</option><option>Evan Brooks</option></Select></td><td>{task.department}</td><td>{task.due}</td><td>{task.dependency || "None"}</td><td><Select value={task.status} onChange={(status) => updateTask(task.id, { status: status as WorkTask["status"] })}>{["Not Started", "In Progress", "Blocked", "Awaiting Review", "Completed", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</Select></td></tr>)}</tbody></table></div></section><section className="card milestone-card"><div className="card-head"><div><h2>Milestones</h2><p>Meaningful execution checkpoints</p></div><Button variant="secondary" onClick={addMilestone}>Add milestone</Button></div><div className="milestone-list">{plan.milestones.map((milestone) => <div className="milestone-row" key={milestone.id}><span><b>{milestone.name}</b><small>{milestone.owner}</small></span><time>{milestone.due}</time><Badge tone={toneFor(milestone.status)}>{milestone.status}</Badge></div>)}</div></section></>}
    {tab === "Outcomes & KPIs" && <section className="table-card"><div className="card-head padded"><div><h2>Outcome measurements</h2><p>Execution progress does not imply outcome attainment.</p></div><Badge tone="info">Illustrative demo data</Badge></div><div className="table-wrap"><table><thead><tr><th>KPI</th><th>Baseline</th><th>Target</th><th>Latest actual</th><th>Period</th><th>Owner</th><th>Status</th><th>Update</th></tr></thead><tbody>{plan.kpis.map((kpi) => <tr key={kpi.id}><td><b>{kpi.name}</b><small>Observed result; attribution not established</small></td><td>{kpi.baseline}{kpi.unit}</td><td>{kpi.target}{kpi.unit}</td><td><b>{kpi.actual}{kpi.unit}</b></td><td>{kpi.period}</td><td>{kpi.owner}</td><td><Badge tone={toneFor(kpi.status)}>{kpi.status}</Badge></td><td><Button variant="secondary" onClick={() => { const value = window.prompt("Latest actual value", String(kpi.actual)); if (!value) return; save({ kpis: plan.kpis.map((item) => item.id === kpi.id ? { ...item, actual: Number(value), status: Number(value) >= item.target ? "Target Met" : "On Track" } : item) }, `KPI updated: ${kpi.name}`); }}>Record result</Button></td></tr>)}</tbody></table></div>{!plan.kpis.length && <Empty title="No KPIs configured" message="Add outcome measures during the next review." />}</section>}
    {tab === "Risks & Decisions" && <section className="table-card"><div className="card-head padded"><div><h2>Risks, blockers, and decisions</h2><p>Open issues surface on the Provider Relations overview.</p></div><Button onClick={requestDecision}>Request decision</Button></div><div className="table-wrap"><table><thead><tr><th>Issue</th><th>Impact</th><th>Severity</th><th>Owner</th><th>Due</th><th>Decision from</th><th>Status</th><th>Action</th></tr></thead><tbody>{plan.risks.map((risk) => <tr key={risk.id}><td><b>{risk.issue}</b></td><td>{risk.impact}</td><td><Badge tone={toneFor(risk.severity)}>{risk.severity}</Badge></td><td>{risk.owner}</td><td>{risk.due}</td><td>{risk.decisionFrom || "Not required"}</td><td><Badge tone={toneFor(risk.status)}>{risk.status}</Badge></td><td><Button variant="secondary" disabled={risk.status === "Resolved"} onClick={() => save({ risks: plan.risks.map((item) => item.id === risk.id ? { ...item, status: "Resolved" } : item), health: "On Track" }, `Risk resolved: ${risk.issue}`)}>Resolve</Button></td></tr>)}</tbody></table></div></section>}
    {tab === "Activity" && <section className="card activity-card"><div className="card-head"><div><h2>Activity and history</h2><p>Simulated prototype history</p></div></div><div className="activity-feed">{plan.activity.map((item, index) => <div key={`${item.date}-${index}`}><i /><span><b>{item.text}</b><small>{item.date} · {item.by}</small></span></div>)}</div></section>}
  </>;
}

function Actions({ actions, setActions, workPlans, focusId, clearFocus, onInitiate, onOpenPlan }: { actions: Action[]; setActions: React.Dispatch<React.SetStateAction<Action[]>>; workPlans: WorkPlan[]; focusId: string | null; clearFocus: () => void; onInitiate: (action: Action) => void; onOpenPlan: (id: string) => void }) {
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<Action | null>(null);
  useEffect(() => { if (!focusId) return; const action = actions.find((item) => item.id === focusId); if (action) setSelected(action); clearFocus(); }, [focusId, actions, clearFocus]);
  const shown = actions.filter((action) => status === "All" || action.status === status);
  const update = (action: Action) => { setActions((current) => current.map((item) => item.id === action.id ? action : item)); setSelected(action); };
  const linked = selected ? workPlans.find((plan) => plan.id === selected.workPlanId || plan.actionId === selected.id) : undefined;
  return <>
    <PageHeader eyebrow="Coordinated workflow" title="Action Tracker" description="Approve strategic actions, assign accountability, and initiate linked Provider Relations execution." />
    <div className="action-tabs">{["All", "New", "Under Review", "Approved", "In Execution", "On Hold", "Completed"].map((item) => <button className={status === item ? "active" : ""} onClick={() => setStatus(item)} key={item}>{item}<span>{item === "All" ? actions.length : actions.filter((action) => action.status === item).length}</span></button>)}</div>
    <section className="table-card"><div className="table-wrap"><table><thead><tr><th>Action</th><th>Opportunity / evidence</th><th>Owner / department</th><th>Priority</th><th>Approval</th><th>Target date</th><th>Status</th><th>Work plan</th></tr></thead><tbody>{shown.map((action) => { const plan = workPlans.find((item) => item.id === action.workPlanId || item.actionId === action.id); return <tr key={action.id} onClick={() => setSelected(action)} className="clickable-row"><td><b>{action.subject}</b><small>{action.id} · {action.category}</small></td><td className="reason-cell">{action.reason}<small>{action.evidence}</small></td><td><b>{action.owner}</b><small>{action.department || "Unassigned"}</small></td><td><Badge tone={toneFor(action.priority)}>{action.priority}</Badge></td><td><Badge tone={toneFor(action.approval || "Pending")}>{action.approval || "Pending"}</Badge></td><td>{action.due}</td><td><Badge tone={toneFor(action.status)}>{action.status}</Badge></td><td>{plan ? <><b>{plan.status}</b><small>{plan.milestones.find((milestone) => milestone.status !== "Completed")?.name}</small></> : "Not started"}</td></tr>; })}</tbody></table></div>{!shown.length && <Empty title="No actions in this status" message="Choose another lifecycle stage." />}</section>
    {selected && <div className="panel-backdrop" onClick={() => setSelected(null)}><aside className="detail-panel action-detail-panel" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">{selected.id} · {selected.category}</p><h2>{selected.subject}</h2></div><button className="close" onClick={() => setSelected(null)}>×</button></div><div className="action-summary"><Badge tone={toneFor(selected.priority)}>{selected.priority} priority</Badge><Badge tone={toneFor(selected.status)}>{selected.status}</Badge><Badge tone={toneFor(selected.approval || "Pending")}>{selected.approval || "Pending"} approval</Badge></div>
      <section className="panel-section"><h3>Problem or opportunity</h3><p>{selected.reason}</p><h3>Source insight / evidence</h3><p>{selected.evidence || "No evidence note recorded."}</p><h3>Expected result</h3><p>{selected.expectedResult || "Not yet defined."}</p></section>
      <div className="detail-grid"><div><span>Accountable owner</span><b>{selected.owner}</b></div><div><span>Owning department</span><b>{selected.department || "Unassigned"}</b></div><div><span>Target start</span><b>{selected.start || "Not set"}</b></div><div><span>Target completion</span><b>{selected.due}</b></div><div><span>Last update</span><b>{linked?.lastUpdated || "No execution update"}</b></div><div><span>Next review</span><b>{selected.nextReview || "Not set"}</b></div></div>
      {linked && <section className="panel-section linked-plan-card"><div><span>Linked work plan</span><b>{linked.name}</b><small>{linked.status} · {linked.health} · {linked.progress}% complete</small><small>Next: {linked.milestones.find((milestone) => milestone.status !== "Completed")?.name || "No milestone"}</small></div><Button onClick={() => onOpenPlan(linked.id)}>Open Work plan</Button></section>}
      <div className="form-stack"><Select label="Action lifecycle" value={selected.status} onChange={(value) => update({ ...selected, status: value as Action["status"] })}>{["New", "Under Review", "Approved", "In Execution", "On Hold", "Completed", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</Select><Select label="Executive approval" value={selected.approval || "Pending"} onChange={(value) => update({ ...selected, approval: value as Action["approval"], status: value === "Approved" && selected.status === "Under Review" ? "Approved" : selected.status })}><option>Pending</option><option>Approved</option><option>Declined</option></Select><Select label="Assigned owner" value={selected.owner} onChange={(value) => update({ ...selected, owner: value })}><option>Unassigned</option><option>Maya Ortiz</option><option>Jordan Lee</option><option>Priya Shah</option><option>Evan Brooks</option></Select><TextInput label="Due date" value={selected.due} onChange={(value) => update({ ...selected, due: value })} /></div>
      <div className="panel-footer"><Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>{linked ? <Button onClick={() => onOpenPlan(linked.id)}>Open Work plan</Button> : <Button disabled={selected.approval !== "Approved"} onClick={() => onInitiate(selected)}>{selected.approval === "Approved" ? "Initiate Work plan" : "Approval required"}</Button>}</div>
    </aside></div>}
  </>;
}
