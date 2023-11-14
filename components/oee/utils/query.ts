import { isNumber } from "lodash-es";

import type {
  LoggingDataQuery,
  ComponentContextAggregatedMetricInput,
} from "@ixon-cdk/types";

export function mapMetricInputToQuery(
  metric: ComponentContextAggregatedMetricInput
): LoggingDataQuery {
  return {
    selector: metric.selector,
    ...(metric.aggregator ? { postAggr: metric.aggregator as any } : {}),
    ...(metric.transform ? { postTransform: metric.transform as any } : {}),
    ...(metric.unit ? { unit: metric.unit } : {}),
    ...(isNumber(metric.decimals) ? { decimals: Number(metric.decimals) } : {}),
    ...(isNumber(metric.factor) ? { factor: Number(metric.factor) } : {}),
  };
}
