import { isNumber } from "lodash-es";

import {
  getOptimalInterval,
  getOptimalQueryTimerange,
  getIntervalStep,
} from "./timerange";
import type { LoggingDataQuery, LoggingDataTimeRange } from "@ixon-cdk/types";
import type { StaticInterval, MetricInput } from "../types";

export function mapChartInputToQuery(
  metric: MetricInput,
  timeRange: LoggingDataTimeRange,
  interval: StaticInterval
): LoggingDataQuery {
  return {
    ...mapMetricInputToQuery(metric),
    step:
      getIntervalStep(
        getOptimalInterval(interval, {
          from: timeRange.from,
          to: timeRange.to,
        })
      ) / 1000,
    from: new Date(timeRange.from).toISOString(),
    to: new Date(timeRange.to).toISOString(),
  };
}

export function mapMetricInputToQuery(metric: MetricInput): LoggingDataQuery {
  return {
    selector: metric.selector,
    ...(metric.aggregator ? { postAggr: metric.aggregator as any } : {}),
    ...(metric.transform ? { postTransform: metric.transform as any } : {}),
    ...(metric.unit ? { unit: metric.unit } : {}),
    ...(isNumber(metric.decimals) ? { decimals: Number(metric.decimals) } : {}),
    ...(isNumber(metric.factor) ? { factor: Number(metric.factor) } : {}),
  };
}
