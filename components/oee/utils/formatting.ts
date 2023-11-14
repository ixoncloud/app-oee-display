import { round } from "lodash-es";

export function formatPercentage(percentage: number, decimals = 0) {
  return round(percentage * 100, decimals);
}
