export type Page = "overview" | "queue" | "detail" | "exceptions" | "calendar" | "editor" | "reports";
export type Item = {
  id: string; title: string; category: string; payer: string; period: string; due: string; owner: string;
  execution: string; deadline: string; verification: string; risk: string; next: string; impact?: string;
};

