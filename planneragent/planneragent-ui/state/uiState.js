export function getInitialUiState(){
  return {
    dataActive: true, // demo default
    signals: {
      dataAwareness: "behavioral",   // snapshot | behavioral | structural | null
      planCoherence: "coherent",     // coherent | some_gaps | incoherent | null
      realityAlignment: "aligned",   // aligned | drifting | misaligned | null
      decisionPressure: "medium",    // low | medium | high | null
    },
    chat: {
      messages: [
        "State your role and show me the plan",
        "Sure. As Vision, observing without intervention. Here is the most recent plan:",
        "• Launch product beta: May 1.<br/>• Train client teams: Ongoing.<br/>• Automate daily reports: June 15."
      ]
    }
  };
}

export function setModeNoData(state){
  state.dataActive = false;
  state.signals.dataAwareness = null;
  state.signals.planCoherence = null;
  state.signals.realityAlignment = null;
  state.signals.decisionPressure = null;
}

export function setModeDemo(state){
  state.dataActive = true;
  state.signals.dataAwareness = "behavioral";
  state.signals.planCoherence = "coherent";
  state.signals.realityAlignment = "aligned";
  state.signals.decisionPressure = "medium";
}
