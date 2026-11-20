import { useState } from "react";
import type { Results } from "../types";
import Attributes from "./Attributes";
import Headline from "./Headline";
import PageDetail from "./PageDetail";
import Pages from "./Pages";
import Words from "./Words";
import { label, metricFormat, ui } from "./ui";

export const VIEWS = { attributes: "Attributes", pages: "Pages", words: "Words", page: "Page" } as const;
export type View = keyof typeof VIEWS;
const TABS: View[] = ["attributes", "pages", "words"];

/**
 * The whole Landing Page Analyzer screen for one results.json: a one-line summary, the headline
 * numbers, then Attributes / Pages / Words (and one page's detail). Takes the result as props and
 * loads nothing itself, so any app can render it (this repo's dashboard reads results.json; a
 * hosted app can pass the same object from its own API).
 */
export default function LandingPages({
  res,
  initialView = "attributes",
  initialPage = "",
}: {
  res: Results;
  initialView?: View;
  initialPage?: string;
}) {
  const [view, setView] = useState<View>(initialView);
  const [pageId, setPageId] = useState(initialPage);
  const format = metricFormat(res.pages);
  const openPage = (id: string) => {
    setPageId(id);
    setView("page");
  };
  return (
    <div>
      <p className={`text-sm ${ui.muted}`}>
        {res.pages.length} pages, measured on {label(res.metric).toLowerCase()}{res.as_of ? `. Run ${res.as_of}` : ""}.
      </p>
      {res.sample && (
        <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          {res.banner || "Illustrative data."} Example Co is made up, with two effects planted on purpose.
        </p>
      )}
      {res.skipped > 0 && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400">{res.skipped} {res.skipped === 1 ? "page" : "pages"} could not be opened.</p>
      )}
      <Headline res={res} format={format} />
      <nav className="mb-2 mt-4 flex flex-wrap gap-1.5">
        {TABS.map((v) => (
          <button key={v} type="button" className={ui.pill(view === v || (v === "pages" && view === "page"))} onClick={() => setView(v)}>
            {VIEWS[v]}
          </button>
        ))}
      </nav>
      {view === "attributes" && <Attributes res={res} format={format} />}
      {view === "pages" && <Pages res={res} format={format} openPage={openPage} />}
      {view === "words" && <Words res={res} format={format} />}
      {view === "page" && <PageDetail res={res} format={format} id={pageId} back={() => setView("pages")} />}
    </div>
  );
}
