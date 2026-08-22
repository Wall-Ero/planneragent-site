export const MINIMUM_COCKPIT_SCALE = 0.68;

export type CockpitFit = Readonly<{
  scale: number;
  fittedHeight: number;
  mode: "fit" | "scroll";
}>;

export function calculateCockpitFit(
  availableWidth: number,
  availableHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  minimumScale = MINIMUM_COCKPIT_SCALE,
): CockpitFit {
  const values = [availableWidth, availableHeight, naturalWidth, naturalHeight, minimumScale];
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    const safeNaturalHeight = Number.isFinite(naturalHeight) && naturalHeight > 0 ? naturalHeight : 0;
    return Object.freeze({ scale: 1, fittedHeight: safeNaturalHeight, mode: "scroll" });
  }

  const widthScale = availableWidth / naturalWidth;
  const heightScale = availableHeight / naturalHeight;
  const idealScale = Math.min(1, widthScale, heightScale);
  const mode = idealScale < minimumScale ? "scroll" : "fit";
  const scale = mode === "scroll" ? Math.min(1, widthScale, minimumScale) : idealScale;

  return Object.freeze({
    scale,
    fittedHeight: naturalHeight * scale,
    mode,
  });
}

function pixels(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function setupCockpitViewport(
  viewport: HTMLElement,
  instrument: HTMLElement,
): () => void {
  let animationFrame = 0;
  let disposed = false;
  let lastSignature = "";

  const measure = () => {
    animationFrame = 0;
    if (disposed) return;

    const visualViewport = window.visualViewport;
    const viewportStyle = getComputedStyle(viewport);
    const horizontalInset = pixels(viewportStyle.paddingLeft) + pixels(viewportStyle.paddingRight);
    const verticalInset = pixels(viewportStyle.paddingTop) + pixels(viewportStyle.paddingBottom);
    const visibleWidth = visualViewport?.width ?? window.innerWidth;
    const visibleHeight = visualViewport?.height ?? window.innerHeight;
    const availableWidth = Math.max(0, visibleWidth - horizontalInset);
    const availableHeight = Math.max(0, visibleHeight - verticalInset);
    const naturalWidth = instrument.scrollWidth;
    const naturalHeight = instrument.scrollHeight;
    const fit = calculateCockpitFit(availableWidth, availableHeight, naturalWidth, naturalHeight);
    const signature = [visibleWidth, visibleHeight, naturalWidth, naturalHeight, fit.scale, fit.mode].join(":");

    if (signature === lastSignature) return;
    lastSignature = signature;
    viewport.style.setProperty("--cockpit-viewport-height", `${visibleHeight}px`);
    viewport.style.setProperty("--cockpit-scale", String(fit.scale));
    viewport.style.setProperty("--cockpit-fitted-height", `${Math.ceil(fit.fittedHeight)}px`);
    viewport.dataset.fitMode = fit.mode;
    viewport.dataset.cockpitScale = fit.scale.toFixed(4);
  };

  const schedule = () => {
    if (disposed || animationFrame) return;
    animationFrame = window.requestAnimationFrame(measure);
  };

  const observer = new ResizeObserver(schedule);
  observer.observe(viewport);
  observer.observe(instrument);
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  window.visualViewport?.addEventListener("resize", schedule, { passive: true });
  schedule();

  return () => {
    disposed = true;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    observer.disconnect();
    window.removeEventListener("resize", schedule);
    window.removeEventListener("orientationchange", schedule);
    window.visualViewport?.removeEventListener("resize", schedule);
  };
}
