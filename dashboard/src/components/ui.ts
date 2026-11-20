import type { Attribute, Page, Results } from "../types";

// Display helpers and shared Tailwind classes for every view.
export const label = (s: string) =>
  s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()).replace(/\bcta\b/gi, "CTA").replace(/\bui\b/gi, "UI");
export const pageName = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") || url;
export const liftText = (share: number | null) => (share == null ? "n/a" : `${share >= 0 ? "+" : ""}${Math.round(share * 100)}%`);
export const corrText = (r: number | null) => (r == null ? "n/a" : r.toFixed(2));
export const pText = (p: number | null) => (p == null ? "n/a" : p < 0.001 ? "<0.001" : p.toFixed(3));
export const ORIGIN: Record<Attribute["computed_by"], string> = { jev: "tagged by AI", vision: "from the screenshot", code: "counted", label: "counted" };
export const titleOf = (res: Results, name: string) => res.attributes.find((a) => a.name === name)?.title ?? label(name);
export const card = (res: Results) => Object.values(res.scorecards)[0]?.card ?? [];
export const valueOf = (page: Page, a: Attribute) =>
  a.type === "number" ? String(page[a.name] ?? "n/a") : label(String(page[`jev_${a.name}`] ?? "unknown"));

export type Fmt = (n: number) => string;
/** Rates show as percentages. Any other metric shows as its own number. */
export const metricFormat = (pages: Page[]): Fmt => {
  const asRate = pages.every((p) => p.conversion_rate <= 1);
  return (n: number) => (asRate ? `${(n * 100).toFixed(2)}%` : n.toLocaleString(undefined, { maximumFractionDigits: 2 }));
};

export const ui = {
  muted: "text-zinc-500 dark:text-zinc-400",
  help: "my-3 text-sm text-zinc-500 dark:text-zinc-400",
  card: "rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-700",
  table: "mb-4 mt-2 w-full border-collapse text-sm",
  th: "border-b border-zinc-200 px-2 py-2 text-left align-bottom font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
  td: "whitespace-nowrap border-b border-zinc-200 px-2 py-2 dark:border-zinc-700",
  cell: "border-b border-zinc-200 px-2 py-2 dark:border-zinc-700",
  link: "text-brand underline underline-offset-[3px]",
  pill: (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm ${
      on ? "border-brand bg-brand text-white" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    }`,
  tag: "ml-1.5 whitespace-nowrap rounded-full border border-zinc-200 px-1.5 py-px text-xs font-normal text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
};
