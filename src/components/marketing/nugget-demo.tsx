import { NuggetBadge, NuggetGlyph } from "@/components/ui/badge";

export function NuggetDemo() {
  return (
    <div className="rounded-[8px] border border-border bg-surface p-6 shadow-[0_40px_90px_-45px_oklch(0.2_0.02_262/0.35)] md:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-muted">AQ-1035 · Endocrine · Physiology</span>
        <NuggetBadge className="ml-auto" />
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-text">
        PTH is inappropriately normal, so the hypercalcemia is PTH-dependent. The deciding clue is the kidney:{" "}
        <strong>urinary calcium is low</strong> with a calcium/creatinine clearance ratio of 0.006.
      </p>
      <div className="mt-5 rounded-[10px] bg-gold-soft p-4">
        <div className="flex items-center gap-2">
          <NuggetGlyph className="size-3.5" />
          <span className="eyebrow text-gold-ink">Nugget</span>
        </div>
        <p className="mt-2 text-[15px] font-semibold leading-snug text-text">Hypercalcemia + low urine calcium = FHH, not an adenoma</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          Desensitized calcium-sensing receptors reset the set point: PTH stays normal and urine calcium is low. It is benign;
          do not send the patient for parathyroidectomy.
        </p>
      </div>
    </div>
  );
}
