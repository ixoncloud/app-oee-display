import { DateTime, type DateTimeUnit } from "luxon";

import type { TimeRange, Interval, StaticInterval } from "../types";

export function getOptimalInterval(
  interval: Interval,
  timeRange: TimeRange
): StaticInterval {
  if (interval === "best fit") {
    return _getBestFitInterval(timeRange.from, timeRange.to);
  }

  const rangeLength = timeRange.to - timeRange.from;
  const intervalStep = getIntervalStep(interval);
  const expectedDataPoints = rangeLength / intervalStep;
  if (expectedDataPoints > 5000) {
    switch (interval) {
      case "hours":
        return getOptimalInterval("days", timeRange);
      case "days":
        return getOptimalInterval("weeks", timeRange);
      case "weeks":
      default:
        // this can only occur with time range of > 95 years
        return interval;
    }
  }

  return interval;
}

function _getBestFitInterval(from: number, to: number): StaticInterval {
  if (from != null && to != null) {
    const difference = to - from;

    const hour = 1000 * 60 * 60;
    const day = hour * 24;
    const week = day * 7;
    if (difference >= 0 && difference < 3 * day - 1000) return "hours";
    if (difference >= 3 * day - 1000 && difference < 3 * week - 1000)
      return "days";
    if (difference >= 3 * week - 1000) return "weeks";
  }
  return "days";
}

export function getIntervalStep(interval: Interval): number {
  const secondsInHour = 60 * 60 * 1000;
  switch (interval) {
    case "hours":
      return secondsInHour;
    case "days":
      return 24 * secondsInHour;
    case "weeks":
    default:
      return 7 * 24 * secondsInHour;
  }
}

/**
 * Returns the optimal query-specific time range for the given {@code interval}, {@code timeRange} and {@code timeZone}.
 *
 * @param interval
 * @param timeRange
 * @param timeZone
 */
export function getOptimalQueryTimerange(
  interval: Interval,
  timeRange: TimeRange,
  timeZone?: string
): TimeRange {
  const from = DateTime.fromMillis(timeRange.from).setZone(timeZone);
  const to = DateTime.fromMillis(timeRange.to).setZone(timeZone);
  const result = _getStartEndTimesForInterval(
    from,
    to.plus({ second: 1 }),
    getOptimalInterval(interval, timeRange)
  );
  const start = result.start;
  const end = result.end.minus({ second: 1 });
  return { from: start.valueOf(), to: end.valueOf() };
}

function _getStartEndTimesForInterval(
  from: DateTime,
  to: DateTime,
  interval: StaticInterval
) {
  let start: DateTime;
  let end: DateTime;

  start = from
    .minus({ second: 1 })
    .startOf(interval as DateTimeUnit)
    .plus({ [interval]: 1 });
  end = to.startOf(interval as DateTimeUnit);

  // If it cannot find a full interval within the time range it should look outside the original range.
  const duration = { [interval]: 1 };
  if (start.toMillis() === end.toMillis()) {
    start = start > from ? start.minus(duration) : start;
    end = end < to ? end.plus(duration) : end;
  }

  // Flip
  if (start > end) {
    const [startMillis, endMillis] = [start.toMillis(), end.toMillis()];
    start = DateTime.fromMillis(endMillis);
    end = DateTime.fromMillis(startMillis);
  }

  return { start, end };
}
