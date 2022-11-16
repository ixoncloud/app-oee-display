import {
  getAvailability,
  getScheduledSecondsOfAvailability,
} from "./availability";
import { Ok, Err, Result } from "ts-results";

export function calculateOee(
  metrics,
  startTimeStampMilliSeconds,
  endTimeStampMilliSeconds,
  workSchedule
): Result<number[], "required metric data is not available"> {
  try {
    const metricValues = metrics.map((a) => a[0].value.getValue());
    const values = _calculateOee(
      metricValues,
      startTimeStampMilliSeconds,
      endTimeStampMilliSeconds,
      workSchedule
    );
    return new Ok(values);
  } catch (e) {
    return new Err("required metric data is not available");
  }
}

function _calculateOee(
  metricValues,
  startTimeStampMilliSeconds,
  endTimeStampMilliSeconds,
  workSchedule
) {
  const realSecondsAvailable = metricValues[0];
  const avgSetSpeed = metricValues[1];
  const realizedProductionAmount = metricValues[2];
  const rejectedProductionAmount = metricValues[3];

  const scheduledSecondsOfAvailability = getScheduledSecondsOfAvailability(
    workSchedule,
    startTimeStampMilliSeconds,
    endTimeStampMilliSeconds
  );
  const availability = getAvailability(
    scheduledSecondsOfAvailability,
    realSecondsAvailable
  );

  const maxPossibleProductionItems =
    (scheduledSecondsOfAvailability / 60) * avgSetSpeed;

  const performance =
    ((100 / maxPossibleProductionItems) * realizedProductionAmount) / 100;

  const realizedAfterCorrection =
    realizedProductionAmount - rejectedProductionAmount;
  const quality =
    ((100 / realizedProductionAmount) * realizedAfterCorrection) / 100;

  const oee = availability * performance * quality;
  return [oee, availability, performance, quality];
}
