import { THRESHOLDS } from "../shared/constants";
import type { FilterLevel } from "../shared/types";

export function getThresholds(level: FilterLevel) {
  return THRESHOLDS[level];
}
