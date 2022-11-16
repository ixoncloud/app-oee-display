import { DateTime } from "luxon";
import { ScheduleDayNames, ScheduleDayNumbers } from "./global";

export function getAvailability(scheduled: number, real: number): number {
  const availability = ((100 / scheduled) * real) / 100;
  return availability;
}

export function getScheduledSecondsOfAvailability(
  scheduledHoursPerDay: ScheduleDayNames,
  batchStartTimeStampMilliSeconds: number,
  batchEndTimeStampMilliSeconds: number
): number {
  const schedule = _mapScheduleToDayNumbers(scheduledHoursPerDay);
  const startTime = DateTime.fromMillis(batchStartTimeStampMilliSeconds);
  const endTime = DateTime.fromMillis(batchEndTimeStampMilliSeconds);
  const scheduledProductionHours = _determineScheduledProductionMilliseconds(
    schedule,
    startTime,
    endTime
  );
  return _milliSecondsToSeconds(scheduledProductionHours);
}

function _mapScheduleToDayNumbers(
  schedule: ScheduleDayNames
): ScheduleDayNumbers {
  return {
    1: schedule.monday,
    2: schedule.tuesday,
    3: schedule.wednesday,
    4: schedule.thursday,
    5: schedule.friday,
    6: schedule.saturday,
    7: schedule.sunday,
  };
}

function _determineScheduledProductionMilliseconds(
  schedule: ScheduleDayNumbers,
  startTime: DateTime,
  endTime: DateTime
): number {
  const processedStart = DateTime.fromObject({
    year: startTime.year,
    month: startTime.month,
    day: startTime.day,
    hour: 0,
    minute: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const processedEnd = DateTime.fromObject({
    year: endTime.year,
    month: endTime.month,
    day: endTime.day,
    hour: 23,
    minute: 59,
    seconds: 59,
    milliseconds: 0,
  });
  const diffDays = Math.floor(processedEnd.diff(processedStart, ["days"]).days);
  if (diffDays === 0) {
    return _getMilliSecondsPerDay(startTime, endTime, schedule);
  }
  return _getMilliSecondsPerDayMultiple(startTime, endTime, schedule, diffDays);
}

function _getMilliSecondsPerDay(startTime, endTime, schedule) {
  const currentWeekDayNumber = startTime.plus({ days: 0 }).weekday;
  const scheduledStartHour = schedule[currentWeekDayNumber][0];
  const scheduledEndHour = schedule[currentWeekDayNumber][1];
  const scheduledStartDateTime = DateTime.fromObject({
    year: startTime.year,
    month: startTime.month,
    day: startTime.day,
    hour: scheduledStartHour,
    minute: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const scheduledEndDateTime = DateTime.fromObject({
    year: endTime.year,
    month: endTime.month,
    day: endTime.day,
    hour: scheduledEndHour,
    minute: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const scheduleDiff = scheduledEndDateTime.diff(scheduledStartDateTime, [
    "milliseconds",
  ]).milliseconds;
  const startDiff = startTime.diff(scheduledStartDateTime, [
    "milliseconds",
  ]).milliseconds;
  const startDiffIgnoreOutsideOfSchedule = startDiff > 0 ? startDiff : 0;

  const endDiff = scheduledEndDateTime.diff(endTime, [
    "milliseconds",
  ]).milliseconds;
  const endDiffIgnoreOutsideOfSchedule = endDiff > 0 ? endDiff : 0;

  return (
    scheduleDiff -
    startDiffIgnoreOutsideOfSchedule -
    endDiffIgnoreOutsideOfSchedule
  );
}

function _milliSecondsToSeconds(milliseconds): number {
  return milliseconds / 1000;
}

function _getMilliSecondsPerDayMultiple(
  startTime,
  endTime,
  schedule,
  diffDays
) {
  let scheduledProductionMilliseconds = 0;
  for (let i = 0; i < diffDays + 1; i++) {
    const firstDay = i === 0;
    const lastDay = i === diffDays;

    if (firstDay) {
      scheduledProductionMilliseconds =
        scheduledProductionMilliseconds +
        _getMilliSecondsForFirstDay(startTime, schedule);
    } else if (lastDay) {
      scheduledProductionMilliseconds =
        scheduledProductionMilliseconds +
        _getMilliSecondsForLastDay(startTime, endTime, schedule, i);
    } else {
      scheduledProductionMilliseconds =
        scheduledProductionMilliseconds +
        _getMilliSecondsForFullDay(startTime, schedule, i);
    }
  }
  return scheduledProductionMilliseconds;
}

function _getMilliSecondsForFirstDay(startTime, schedule) {
  const currentWeekDayNumber = startTime.plus({ days: 0 }).weekday;
  const scheduledStartHour = schedule[currentWeekDayNumber][0];
  const scheduledEndHour = schedule[currentWeekDayNumber][1];
  const scheduledStartDateTime = DateTime.fromObject({
    year: startTime.year,
    month: startTime.month,
    day: startTime.day,
    hour: scheduledStartHour,
    minute: 0,
    seconds: 0,
    milliseconds: 0,
  });

  const scheduledEndDateTime = DateTime.fromObject({
    year: startTime.year,
    month: startTime.month,
    day: startTime.day,
    hour: scheduledEndHour,
    minute: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const scheduleDiff = scheduledEndDateTime.diff(scheduledStartDateTime, [
    "milliseconds",
  ]).milliseconds;
  const startDiff = startTime.diff(scheduledStartDateTime, [
    "milliseconds",
  ]).milliseconds;
  const startDiffIgnoreOutsideOfSchedule = startDiff > 0 ? startDiff : 0;
  const scheduledMilliSeconds = scheduleDiff - startDiffIgnoreOutsideOfSchedule;
  return scheduledMilliSeconds > 0 ? scheduledMilliSeconds : 0;
}

function _getMilliSecondsForLastDay(
  startTime,
  endTime,
  schedule,
  lastDayIndex
) {
  const currentWeekDayNumber = startTime.plus({ days: lastDayIndex }).weekday;

  const scheduledStartHour = schedule[currentWeekDayNumber][0];
  const scheduledEndHour = schedule[currentWeekDayNumber][1];
  const scheduledStartDateTime = DateTime.fromObject({
    year: endTime.year,
    month: endTime.month,
    day: endTime.day,
    hour: scheduledStartHour,
    minute: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const scheduledEndDateTime = DateTime.fromObject({
    year: endTime.year,
    month: endTime.month,
    day: endTime.day,
    hour: scheduledEndHour,
    minute: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const scheduleDiff = scheduledEndDateTime.diff(scheduledStartDateTime, [
    "milliseconds",
  ]).milliseconds;

  const endDiff = scheduledEndDateTime.diff(endTime, [
    "milliseconds",
  ]).milliseconds;
  const endDiffIgnoreOutsideOfSchedule = endDiff > 0 ? endDiff : 0;
  return scheduleDiff - endDiffIgnoreOutsideOfSchedule;
}

function _getMilliSecondsForFullDay(startTime, schedule, currentDayIndex) {
  const currentWeekDayNumber = startTime.plus({
    days: currentDayIndex,
  }).weekday;
  if (schedule[currentWeekDayNumber].length === 0) {
    return 0;
  }
  const scheduledStartHour = schedule[currentWeekDayNumber][0];
  const scheduledEndHour = schedule[currentWeekDayNumber][1];
  const scheduleDiff = scheduledEndHour - scheduledStartHour;
  return _hoursToMilliseconds(scheduleDiff);
}

function _hoursToMilliseconds(hours) {
  return hours * 3600000;
}
