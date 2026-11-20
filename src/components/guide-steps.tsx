/** The five steps of LabPack's own first-run guide, in its order and words. */
export const GUIDE_STEPS = [
  { name: "Where", text: "Choose This computer." },
  { name: "Lesson", text: "Open the lab's .labpack file. Leave the file as it is; LabPack opens it." },
  { name: "Check", text: "LabPack checks your computer for this lab and says plainly what to change, if anything." },
  {
    name: "Image",
    text: "Get Juniper's free vJunos-router image, about 4 GB. LabPack shows the download page, finds the file in your Downloads and checks it. You do this once.",
  },
  { name: "Start", text: "Choose Start lab." },
];

export function GuideStrip({ current }: { current?: number }) {
  return (
    <ol className="guide-steps" aria-label="LabPack's setup steps">
      {GUIDE_STEPS.map((s, i) => (
        <li key={s.name} aria-current={current === i ? "step" : undefined}>
          <span className={`step-n ${current === i ? "current" : ""}`}>{i + 1}</span>
          {s.name}
        </li>
      ))}
    </ol>
  );
}
