// "1 lab", "5 labs", "5 more labs". Safe in client components (no file reads).
export function labCount(n: number, qualifier?: string): string {
  return `${n} ${qualifier ? `${qualifier} ` : ""}${n === 1 ? "lab" : "labs"}`;
}
