"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CatalogCard = {
  id: string;
  title: string;
  summary: string;
  level: string;
  levelName: string;
  collection: string;
  collectionShort: string;
  topicGroups: string[];
  stages: number;
  minutes: number;
  status: "in-review" | "released";
  searchText: string;
};

type Option = { id: string; name: string; disabled?: boolean; note?: string };

function Chip({
  pressed,
  disabled,
  onClick,
  children,
  title,
}: {
  pressed: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`min-h-9 rounded border px-3 py-1 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
        pressed ? "border-accent bg-accent text-on-accent" : "border-line bg-card text-ink hover:bg-selected"
      }`}
    >
      {children}
    </button>
  );
}

export function StatusPill({ status }: { status: "in-review" | "released" }) {
  return status === "released" ? (
    <span className="inline-block rounded-full border border-met bg-met-soft px-2 py-px text-xs font-semibold text-met">
      Ready to download
    </span>
  ) : (
    <span className="inline-block rounded-full border border-line bg-surface px-2 py-px text-xs font-semibold text-quiet">
      In review
    </span>
  );
}

export function LabCatalog({
  labs,
  levels,
  collections,
  topics,
}: {
  labs: CatalogCard[];
  levels: Option[];
  collections: Option[];
  topics: Option[];
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [collection, setCollection] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return labs.filter(
      (l) =>
        (level === "all" || l.level === level) &&
        (collection === "all" || l.collection === collection) &&
        (topic === "all" || l.topicGroups.includes(topic)) &&
        words.every((w) => l.searchText.includes(w)),
    );
  }, [labs, query, level, collection, topic]);

  const usedTopics = topics.filter((t) => labs.some((l) => l.topicGroups.includes(t.id)));
  const filtered = query || level !== "all" || collection !== "all" || topic !== "all";

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-lg border border-line bg-card p-4 sm:p-5">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Search the labs</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="For example: OSPF, static route, load merge"
            className="min-h-10 w-full rounded border border-line bg-card px-3 text-base text-ink placeholder:text-quiet"
          />
        </label>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-semibold">Level</legend>
          <div className="flex flex-wrap gap-2">
            <Chip pressed={level === "all"} onClick={() => setLevel("all")}>
              All levels
            </Chip>
            {levels.map((l) => (
              <Chip
                key={l.id}
                pressed={level === l.id}
                disabled={l.disabled}
                title={l.note}
                onClick={() => setLevel(l.id)}
              >
                {l.name}
                {l.disabled ? <span className="ml-1.5 font-normal">(coming)</span> : null}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-semibold">Set</legend>
          <div className="flex flex-wrap gap-2">
            <Chip pressed={collection === "all"} onClick={() => setCollection("all")}>
              All
            </Chip>
            {collections.map((c) => (
              <Chip key={c.id} pressed={collection === c.id} onClick={() => setCollection(c.id)} title={c.note}>
                {c.name}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-semibold">Topic</legend>
          <div className="flex flex-wrap gap-2">
            <Chip pressed={topic === "all"} onClick={() => setTopic("all")}>
              All topics
            </Chip>
            {usedTopics.map((t) => (
              <Chip key={t.id} pressed={topic === t.id} onClick={() => setTopic(t.id)}>
                {t.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-quiet" aria-live="polite">
        <span>
          {shown.length === labs.length ? `${labs.length} labs` : `${shown.length} of ${labs.length} labs`}
        </span>
        {filtered ? (
          <button
            type="button"
            className="rounded px-2 py-1 font-semibold text-ink underline-offset-2 hover:underline"
            onClick={() => {
              setQuery("");
              setLevel("all");
              setCollection("all");
              setTopic("all");
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {shown.length ? (
        <ul className="grid list-none gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((l) => (
            <li key={l.id}>
              <Link
                href={`/labs/${l.id}`}
                className="group grid h-full content-start gap-2.5 rounded-lg border border-line bg-card p-4 text-ink no-underline transition-colors hover:border-focus"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={l.status} />
                  <span className="text-xs font-semibold text-quiet">{l.collectionShort}</span>
                </div>
                <h3 className="m-0 text-[1.05rem] font-bold leading-snug group-hover:underline">{l.title}</h3>
                <p className="m-0 line-clamp-3 text-sm text-quiet">{l.summary}</p>
                <p className="m-0 mt-auto pt-1 text-xs text-quiet">
                  {l.levelName} · {l.stages} {l.stages === 1 ? "stage" : "stages"} · about {l.minutes} min
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-line bg-card p-6 text-quiet">
          No lab matches that. Try fewer words, or clear the filters.
        </p>
      )}
    </div>
  );
}
