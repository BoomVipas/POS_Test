/** Tiny inline-SVG sparkline — no chart dependency. Stroke uses currentColor
 *  so it inherits the surrounding text color (e.g. white on the indigo hero
 *  card). Decorative; callers provide their own accessible label/context. */
export function Sparkline({
  values,
  className,
  fill,
  strokeWidth = 2,
}: {
  values: number[];
  className?: string;
  /** Optional area fill below the line (e.g. "rgba(255,255,255,0.14)"). */
  fill?: string;
  strokeWidth?: number;
}) {
  if (values.length < 2) return null;
  const w = 100;
  const h = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - strokeWidth) - strokeWidth / 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {fill && (
        <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={fill} />
      )}
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
