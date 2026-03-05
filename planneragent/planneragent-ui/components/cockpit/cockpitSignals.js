function tab(label, value, isActive){
  return `<button class="tab ${isActive ? "active" : ""}" data-value="${value}">${label}</button>`;
}

function signal(label, value, isActive){
  return `<div class="signal ${isActive ? "active" : ""}" data-value="${value}"><span class="dot"></span>${label}</div>`;
}

function level(label, value, isActive){
  return `<div class="level ${isActive ? "active" : ""}" data-value="${value}">${label}</div>`;
}

export function renderSignals(root, state){
  const dataTabs = root.querySelector("#dataTabs");
  const planSignals = root.querySelector("#planSignals");
  const realitySignals = root.querySelector("#realitySignals");
  const pressureSignals = root.querySelector("#pressureSignals");

  const data = state.signals.dataAwareness;
  const plan = state.signals.planCoherence;
  const reality = state.signals.realityAlignment;
  const pressure = state.signals.decisionPressure;

  dataTabs.innerHTML = [
    tab("SNAPSHOT", "snapshot", data === "snapshot"),
    tab("BEHAVIORAL", "behavioral", data === "behavioral"),
    tab("STRUCTURAL", "structural", data === "structural"),
  ].join("");

  planSignals.innerHTML = [
    signal("COHERENT", "coherent", plan === "coherent"),
    signal("SOME GAPS", "some_gaps", plan === "some_gaps"),
    signal("INCOHERENT", "incoherent", plan === "incoherent"),
  ].join("");

  realitySignals.innerHTML = [
    signal("ALIGNED", "aligned", reality === "aligned"),
    signal("DRIFTING", "drifting", reality === "drifting"),
    signal("MISALIGNED", "misaligned", reality === "misaligned"),
  ].join("");

  pressureSignals.innerHTML = [
    level("HIGH", "high", pressure === "high"),
    level("MEDIUM", "medium", pressure === "medium"),
    level("LOW", "low", pressure === "low"),
  ].join("");

  // click-to-toggle (graphic demo only). Keeps one-ON rule.
  dataTabs.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      state.dataActive = true;
      state.signals.dataAwareness = btn.dataset.value;
      renderSignals(root, state);
    });
  });

  planSignals.querySelectorAll(".signal").forEach(el => {
    el.addEventListener("click", () => {
      state.dataActive = true;
      state.signals.planCoherence = el.dataset.value;
      renderSignals(root, state);
    });
  });

  realitySignals.querySelectorAll(".signal").forEach(el => {
    el.addEventListener("click", () => {
      state.dataActive = true;
      state.signals.realityAlignment = el.dataset.value;
      renderSignals(root, state);
    });
  });

  pressureSignals.querySelectorAll(".level").forEach(el => {
    el.addEventListener("click", () => {
      state.dataActive = true;
      state.signals.decisionPressure = el.dataset.value;
      renderSignals(root, state);
    });
  });
}
