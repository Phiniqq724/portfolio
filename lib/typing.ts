/*
  Typing timing of the hero headline. The Experience year swap uses the
  same moves at about twice this pace (see Experience.tsx). Typing
  libraries default to roughly 50 to 100ms per character and human typing
  sits near 100ms, so letters appear at 85ms. A word is never erased letter
  by letter: it is selected, like a quick mouse drag (a lime bar sweeps
  across it in 420ms and rests 160ms so it registers), and the new word
  types over the selection after a short gap.
*/
export const TYPE_MS = 85;
export const SELECT_MS = 420;
export const SELECTED_MS = 160;
export const GAP_MS = 150;
/** The selection sweep's curve, the site's expo out. */
export const SELECT_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
