// Shape of results.json, written by `waf sample` or `waf example` (src/website_attribute_finder/live.py).

export interface ScoreRow {
  attribute: string;
  value: string | null;
  kind: "group" | "number";
  n_with: number | null;
  mean_with: number | null;
  n_rest: number | null;
  mean_rest: number | null;
  lift: number | null;
  lift_pct: number | null;
  correlation: number | null;
  p_adjusted: number | null;
  significant: boolean;
  note?: string;
}

export interface Page {
  id: string;
  url: string;
  opening: string;
  ctas: string[];
  /** Screenshots, as data URLs inside the file or as links. */
  fold_shot: string | null;
  full_shot: string | null;
  render_ok: boolean;
  conversion_rate: number;
  [key: string]: unknown;
}

export interface Attribute {
  name: string;
  title: string | null;
  question: string;
  computed_by: "code" | "label" | "jev" | "vision";
  type: "number" | "choice" | "boolean";
  group: string;
  default: boolean;
  options: Record<string, string>;
}

export interface WordTable {
  tested: number;
  significant: number;
  terms: { term: string; pages: number; rate_with: number; rate_without: number; correlation: number; p_adjusted: number; significant: boolean }[];
}

export interface Results {
  run_id: string;
  client?: string;
  as_of?: string;
  metric: string;
  pages: Page[];
  skipped: number;
  sample?: boolean;
  banner?: string;
  attributes: Attribute[];
  scorecards: Record<string, { rows: number; card: ScoreRow[] }>;
  words: Record<string, WordTable>;
  cost_usd: number;
}
