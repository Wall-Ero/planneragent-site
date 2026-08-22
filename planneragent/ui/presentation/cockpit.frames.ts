type FrameMaterial = "industrial";

function frame(
  name: string,
  viewBox: string,
  surface: string,
  geometry: string,
  material: FrameMaterial = "industrial",
): string {
  const gradientId = `cockpit-${name}-edge`;
  return `<svg viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true" class="hud-frame hud-frame-${material} frame-${name}" style="--frame-edge-paint:url(#${gradientId})">
    <defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--gold-hi)"/><stop offset="38%" stop-color="var(--gold)"/><stop offset="78%" stop-color="var(--gold)"/><stop offset="100%" stop-color="var(--gold-deep)"/></linearGradient></defs>
    <g class="hud-surface">${surface}</g><g class="hud-body">${geometry}</g><g class="hud-edge">${geometry}</g>
  </svg>`;
}

const stroke = `fill="none" stroke="currentColor" stroke-miterlimit="10" vector-effect="non-scaling-stroke"`;
const surface = `fill="currentColor" stroke="none"`;

export function renderActivityBarFrame(): string {
  const geometry = `<polyline ${stroke} points="49.462,12.2 41.796,4.534 15.775,4.534 0.707,19.601 16.374,35.268 248.374,35.268"/><polyline ${stroke} points="753.167,8.167 760.834,0.5 786.855,0.5 801.923,15.568 786.256,31.234 554.255,31.234"/>`;
  return frame("activity", "0 0 802.63 35.768", "", geometry);
}

export function renderDataAwarenessFrame(): string {
  const mainFrame = "M1280.24,40.079H12.5c-6.6,0-12,5.4-12,12v26c0,6.6,5.4,12,12,12h1267.74c6.6,0,12-5.4,12-12v-26C1292.24,45.479,1286.84,40.079,1280.24,40.079z";
  return frame(
    "data-awareness",
    "0 0 1292.74 90.579",
    `<path ${surface} d="${mainFrame}"/>`,
    `<path ${stroke} d="${mainFrame}"/><line ${stroke} x1="262.932" y1="0.354" x2="223.394" y2="39.892"/><line ${stroke} x1="1031.864" y1="0.354" x2="1072.476" y2="40.966"/>`,
  );
}

export function renderPlanFrame(): string {
  return frame(
    "plan",
    "0 0 525.13 236.57",
    `<polygon ${surface} points="500.137,49.856 522.769,1.504 26.97,2.408 1.5,27.878 1.5,49.856"/><polygon ${surface} points="1.5,196.01 118.374,235.57 323.868,235.57 346.945,208.098 426.066,208.098 500.137,49.856 1.5,49.856"/>`,
    `<polygon ${stroke} points="500.137,49.856 522.769,1.504 26.97,2.408 1.5,27.878 1.5,49.856"/><polygon ${stroke} points="1.5,196.01 118.374,235.57 323.868,235.57 346.945,208.098 426.066,208.098 500.137,49.856 1.5,49.856"/>`,
  );
}

export function renderRealityFrame(): string {
  return frame(
    "reality",
    "0 0 525.13 236.57",
    `<polygon ${surface} points="498.16,2.408 2.36,1.504 24.993,49.856 523.63,49.856 523.63,27.878"/><polygon ${surface} points="24.993,49.856 99.064,208.098 178.185,208.098 201.261,235.57 406.756,235.57 523.63,196.01 523.63,49.856"/>`,
    `<polygon ${stroke} points="498.16,2.408 2.36,1.504 24.993,49.856 523.63,49.856 523.63,27.878"/><polygon ${stroke} points="24.993,49.856 99.064,208.098 178.185,208.098 201.261,235.57 406.756,235.57 523.63,196.01 523.63,49.856"/>`,
  );
}

export function renderDecisionPressureFrame(): string {
  const span = "14.804,199.756 447.679,199.756 461.241,219.756 447.679,239.756 14.804,239.756 1.241,219.756";
  return frame(
    "decision-pressure",
    "0 0 462.483 241.256",
    `<polygon ${surface} points="31.241,200.239 126.634,1 335.849,1 431.241,200.239"/><polygon ${surface} class="decision-pressure-mobile-span" points="${span}"/>`,
    `<polygon ${stroke} class="decision-pressure-outline" points="31.241,200.239 126.634,1 335.849,1 431.241,200.239"/><line ${stroke} class="decision-pressure-mobile-lower-edge" x1="31.241" y1="200.239" x2="431.241" y2="200.239"/><line ${stroke} class="decision-pressure-mobile-upper-bridge" x1="-2.2592" y1="1.5349" x2="464.7412" y2="1.5349"/><line ${stroke} x1="95.5" y1="66" x2="366.9" y2="66" opacity=".7"/><line ${stroke} x1="63.5" y1="133" x2="398.9" y2="133" opacity=".7"/><polyline ${stroke} class="decision-pressure-mobile-span" points="231.932,199.756 14.804,199.756 1.241,219.756"/><polyline ${stroke} class="decision-pressure-mobile-span" points="231.932,239.756 14.804,239.756 1.241,219.756"/><polyline ${stroke} class="decision-pressure-mobile-span" points="230.551,199.756 447.679,199.756 461.241,219.756"/><polyline ${stroke} class="decision-pressure-mobile-span" points="230.551,239.756 447.679,239.756 461.241,219.756"/>`,
  );
}

export function renderChatMessageFrame(): string {
  const path = "M1205.193,169.992H12.5c-6.6,0-12-5.4-12-12V12.5c0-6.6,5.4-12,12-12h1192.693c6.6,0,12,5.4,12,12v145.492C1217.193,164.592,1211.793,169.992,1205.193,169.992z";
  return frame("chat-message", "0 0 1217.693 170.492", `<path ${surface} d="${path}"/>`, `<path ${stroke} d="${path}"/>`);
}

export function renderChatInputFrame(): string {
  const path = "M974.954,58.747H9.25c-4.537,0-8.25-3.712-8.25-8.25V9.25C1,4.712,4.712,1,9.25,1h965.704c4.537,0,8.25,3.712,8.25,8.25v41.248C983.203,55.035,979.491,58.747,974.954,58.747z";
  return frame("chat-input", "0 0 984.203 59.747", `<path ${surface} d="${path}"/>`, `<path ${stroke} d="${path}"/>`);
}

export function renderMicrophone(): string {
  return `<svg viewBox="1053 592 35 51" class="microphone-art" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-miterlimit="10" vector-effect="non-scaling-stroke"><path d="M1085.223,614.816c0,7.938-7.246,14.361-16.2,14.361h3.21c-8.954,0-16.2-6.423-16.2-14.361"/><line x1="1070.628" y1="629.177" x2="1070.628" y2="640.542"/><path d="M1072.797,621.997h-4.339c-3.85,0-7-3.15-7-7V601.71c0-3.85,3.15-7,7-7h4.339c3.85,0,7,3.15,7,7v13.287C1079.797,618.847,1076.647,621.997,1072.797,621.997z"/></g></svg>`;
}
