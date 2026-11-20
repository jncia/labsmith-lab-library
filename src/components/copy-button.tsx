"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // No clipboard (permissions or an insecure context): the text is still there to select.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="absolute top-1.5 right-1.5 min-h-7 rounded border border-line bg-card px-2 font-sans text-xs font-semibold text-ink hover:bg-selected"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
