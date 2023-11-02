import { round } from "lodash-es";
import { DateTime, type DateTimeUnit } from "luxon";

import type { ComponentContext } from "@ixon-cdk/types";
import type { StaticInterval } from "../types";

export function formatPercentage(percentage: number, decimals = 0) {
  return round(percentage * 100, decimals);
}

export function formatTimestamp(
  timestamp: number,
  context: ComponentContext,
  interval: StaticInterval | null = null
) {
  const _dateTime = DateTime.fromMillis(timestamp, {
    locale: context.appData.locale,
    zone: context.appData.timeZone,
  });
  if (interval === null) {
    return _dateTime.toLocaleString({
      ...DateTime.DATETIME_SHORT_WITH_SECONDS,
    });
  }
  const weekLabel = context.translate("__TIME__.WEEK");
  switch (interval) {
    case "weeks": {
      const dateTime = _dateTime.startOf(interval as DateTimeUnit);
      return `${weekLabel} ${dateTime.toFormat("W")}`;
    }
    case "hours": {
      const dateTime = _dateTime.startOf(interval as DateTimeUnit);
      return `${dateTime.toLocaleString(DateTime.TIME_SIMPLE)} — ${dateTime
        .plus({ hours: 1 })
        .toLocaleString(DateTime.TIME_SIMPLE)}`;
    }
    default:
      return _dateTime.startOf(interval as DateTimeUnit).toFormat("ccc d");
  }
}
