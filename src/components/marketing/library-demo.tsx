import { BookOpen, Play } from "lucide-react";

export function LibraryDemo() {
  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_40px_90px_-45px_oklch(0.2_0.025_215/0.35)]">
      <div className="flex items-center gap-2 border-b border-border px-6 py-3 text-[13px] text-muted">
        <BookOpen className="size-4" /> Library · Cardiovascular · 4 min read
      </div>
      <div className="px-6 py-6 md:px-8">
        <h3 className="text-[26px] font-[750] tracking-[-0.02em]">Hypertrophic cardiomyopathy</h3>
        <p className="mt-3 max-w-[60ch] font-serif text-[17px] leading-[1.7] text-text">
          The most common inherited cardiomyopathy and a leading cause of sudden death in young athletes. The smaller the
          left ventricular cavity, the tighter the outflow obstruction and the louder the murmur.
        </p>
        <table className="mt-5 w-full border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="bg-panel text-muted">
              <th className="px-3 py-2 font-semibold">Maneuver</th>
              <th className="px-3 py-2 font-semibold">LV size</th>
              <th className="px-3 py-2 font-semibold">HCM murmur</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Valsalva, standing", "Smaller", "Louder"],
              ["Squatting, leg raise", "Larger", "Softer"],
              ["Handgrip", "Larger", "Softer"],
            ].map((r) => (
              <tr key={r[0]} className="border-b border-border">
                {r.map((c) => (
                  <td key={c} className="px-3 py-2">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 inline-flex items-center gap-2 rounded-[6px] bg-brand px-3.5 py-2 text-[13px] font-semibold text-on-brand">
          <Play className="size-3.5" /> Drill this topic
        </div>
      </div>
    </div>
  );
}
