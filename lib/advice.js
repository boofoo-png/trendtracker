import { FIT_ENABLED } from "./features";

export const ADVICE = {
  ACT_NOW: "Act now",
  USE_WITH_CARE: "Use with care",
  WATCH: "Watch",
  SKIP: "Skip",
};

export const ADVICE_RANK = [ADVICE.ACT_NOW, ADVICE.USE_WITH_CARE, ADVICE.WATCH, ADVICE.SKIP];

export function getAdvice(momentum, fit) {
  if (!FIT_ENABLED) {
    if (momentum >= 75) return ADVICE.ACT_NOW;
    if (momentum >= 60) return ADVICE.USE_WITH_CARE;
    if (momentum >= 40) return ADVICE.WATCH;
    return ADVICE.SKIP;
  }
  if (fit < 40) return ADVICE.SKIP;
  if (momentum >= 75 && fit >= 70) return ADVICE.ACT_NOW;
  if (momentum >= 60 && fit >= 60) return ADVICE.USE_WITH_CARE;
  return ADVICE.WATCH;
}
