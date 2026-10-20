export type Page = "overview" | "queue" | "detail" | "exceptions" | "calendar" | "editor" | "reports";
export type Item = {
  id: string; title: string; category: string; payer: string; period: string; due: string; owner: string;
  execution: string; deadline: string; verification: string; risk: string; next: string; impact?: string;
  workflow?: {
    stage: "Preparation" | "Review" | "Completed" | "Rejected";
    evidence: Record<string, { reference: string; passed: boolean }>;
    history: { at: string; text: string }[];
  };
  credentialing?: {
    stage: "Verification" | "Committee review" | "Approved" | "Denied";
    checks: Record<string, { result: "Passed" | "Failed"; reference: string; at: string }>;
    history: { at: string; text: string }[];
  };
  eligibility?: {
    stage: "Awaiting file" | "Reconcile" | "Ready to process" | "Processing" | "Rejected" | "Accepted";
    file?: { reference: string; expected: number; actual: number; invalid: number; duplicates: number; schemaPassed: boolean; encrypted: boolean };
    receipt?: string;
    acknowledgment?: string;
    history: { at: string; text: string }[];
  };
  quality?: {
    stage: "Prepare" | "Review" | "Ready to submit" | "Awaiting payer" | "Rejected" | "Accepted";
    measures: { name: string; numerator: number; denominator: number; exclusions: number; missing: number; duplicates: number }[];
    source: string;
    specification: string;
    schemaPassed: boolean;
    reviewer?: string;
    reviewReference?: string;
    receipt?: string;
    acknowledgment?: string;
    history: { at: string; text: string }[];
  };
};

