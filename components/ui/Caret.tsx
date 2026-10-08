/**
 * Zero-width typing caret (hero headline, Experience year). It takes no
 * space in the line, so showing or hiding it never shifts a letter; the
 * visible bar hangs just after its position. Starts hidden; the typing code
 * toggles `hidden` and `data-blink`. Scenes that find it by selector use
 * `data-caret`.
 */
export function Caret({ setRef }: { setRef?: (el: HTMLSpanElement | null) => void }) {
  return (
    <span
      ref={setRef}
      hidden
      aria-hidden
      data-caret
      data-blink="false"
      className="type-caret relative inline-block h-[0.7em] w-0 align-baseline"
    >
      <span className="absolute left-[0.04em] top-0 h-full w-[0.07em] bg-current" />
    </span>
  );
}
