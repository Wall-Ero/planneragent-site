export function renderCognitionContour(): string {
  return `<svg aria-hidden="true" class="cognition-contour" viewBox="0 0 1000 360" preserveAspectRatio="none">
    <g class="cognition-contour-primary" fill="none" vector-effect="non-scaling-stroke"><path d="M0 92v208l20 18 50 32h260l20 10h80"/><path d="M1000 92v208l-20 18-50 32H670l-20 10h-80"/></g>
    <g class="cognition-contour-secondary" fill="none" vector-effect="non-scaling-stroke"><path d="M5 96v201l20 17 48 31h259l20 10h78"/><path d="M995 96v201l-20 17-48 31H668l-20 10h-78"/></g>
    <g class="cognition-contour-highlight" fill="none" vector-effect="non-scaling-stroke"><path d="M0 112v52"/><path d="M1000 112v52"/><path d="M70 350h96"/><path d="M834 350h96"/><path d="M350 360h48"/><path d="M602 360h48"/></g>
  </svg>`;
}

export function renderLateralChassis(): string {
  const rail = `<g class="lateral-rail-primary" fill="none" vector-effect="non-scaling-stroke"><path d="M12 18 2 33v162M2 228v238M2 500v262M2 796v157l10 25"/></g><g class="lateral-rail-secondary" fill="none" vector-effect="non-scaling-stroke"><path d="M20 28 10 41v146M10 239v219M10 512v240M10 808v137l8 20"/></g><g class="lateral-rail-connectors" fill="none" vector-effect="non-scaling-stroke"><path d="M2 228 12 216h8M2 500l10-12h8M2 796l10-12h8"/></g><g class="lateral-rail-depth" fill="none" vector-effect="non-scaling-stroke"><path d="M28 40 18 51v128M18 251v199M18 524v91M18 770v166"/></g><g class="lateral-rail-detail" fill="none" vector-effect="non-scaling-stroke"><path d="M20 104h8v48M20 286h8v92M20 858h8v48"/><path d="M10 267h10M10 433h10M10 535h10M10 923h10"/></g><g class="lateral-rail-highlight" fill="none" vector-effect="non-scaling-stroke"><path d="M12 18 2 33v56M2 346v54M2 852v101l10 25"/><path d="M2 228 12 216M2 500l10-12"/></g>`;
  return `<div aria-hidden="true" class="lateral-chassis"><svg class="lateral-rail lateral-rail-left" viewBox="0 0 30 1000" preserveAspectRatio="none">${rail}</svg><svg class="lateral-rail lateral-rail-right" viewBox="0 0 30 1000" preserveAspectRatio="none">${rail}</svg></div>`;
}
