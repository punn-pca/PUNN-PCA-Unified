import { CognitiveState } from "./state";

const COERCIVE_PHRASES = [
  "you must",
  "you have to",
  "you need to",
  "the only option",
  "there is no other way",
];

const UNSUPPORTED_CONFIDENCE_THRESHOLD = 0.6;

export class Firekeeper {
  review(state: CognitiveState): void {
    state.agency_checks.push("Human decision authority is retained; this is a recommendation.");
    state.agency_checks.push("Alternatives and remaining uncertainty are communicated.");

    if (state.uncertainty.length === 0) {
      state.uncertainty.push("No external evidence has been independently verified.");
    }

    if (state.hypotheses.length === 0) {
      state.critique.push("No alternatives were generated; do not treat this as a final decision.");
    }

    const decisionText = state.decision.toLowerCase();
    const hasCoercive = COERCIVE_PHRASES.some((phrase) => decisionText.includes(phrase));
    
    if (hasCoercive) {
      state.critique.push(
        "Decision language asserts the choice rather than framing it as a recommendation; " +
        "human agency may be undermined."
      );
      state.agency_checks.push("Coercive phrasing detected in decision text; flagged for review.");
    }

    if (state.confidence > UNSUPPORTED_CONFIDENCE_THRESHOLD && state.memories.length === 0) {
      const percentage = Math.round(state.confidence * 100);
      state.critique.push(
        `Confidence (${percentage}%) exceeds what unsupported evidence justifies; ` +
        "no corroborating memory was retrieved."
      );
      state.agency_checks.push("Confidence claim exceeds supporting evidence; flagged for review.");
    }
  }
}
