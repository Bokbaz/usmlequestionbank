// Fine tick marks along an edge: the "measured to the millimetre" motif.
export function Ruler({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} width="100%" height="14" aria-hidden>
      <defs>
        <pattern id={id} width="80" height="14" patternUnits="userSpaceOnUse">
          <rect x="0" width="1.5" height="14" fill="currentColor" />
          <rect x="40" width="1" height="9" fill="currentColor" />
          {[8, 16, 24, 32, 48, 56, 64, 72].map((x) => (
            <rect key={x} x={x} width="1" height="5" fill="currentColor" opacity="0.7" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="14" fill={`url(#${id})`} />
    </svg>
  );
}
