/**
 * The identity motif: four crop-mark corners. Wrap any relative-positioned
 * box. Size and stroke follow the parent's color via currentColor.
 *
 * `offset` pushes the marks outside the box by that many pixels. Use it on
 * photos: marks drawn on top of an image disappear whenever the image is
 * close to the mark color, while marks outside sit on the surrounding surface,
 * which is guaranteed to contrast with currentColor. Put Corners on a wrapper
 * that does not clip (no overflow hidden) when using an offset.
 */
export function Corners({
  size = 10,
  offset = 0,
  className = "",
}: {
  size?: number;
  offset?: number;
  className?: string;
}) {
  const s = `${size}px`;
  const base = "pointer-events-none absolute border-current";
  return (
    <span aria-hidden className={`absolute ${className}`} style={{ inset: `${-offset}px` }}>
      <span className={`${base} left-0 top-0 border-l border-t`} style={{ width: s, height: s }} />
      <span className={`${base} right-0 top-0 border-r border-t`} style={{ width: s, height: s }} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} style={{ width: s, height: s }} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} style={{ width: s, height: s }} />
    </span>
  );
}
