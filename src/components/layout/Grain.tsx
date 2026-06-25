/**
 * Cinematic overlays: animated film grain + soft vignette.
 * Pure CSS (see globals.css), fixed above content, non-interactive.
 */
export default function Grain() {
  return (
    <>
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />
    </>
  );
}
