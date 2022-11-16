import { has } from "lodash";
import { DEV_ENV, ScheduleDayNames, Agent, CustomProperty } from "./global";
import { Ok, Err, Result } from "ts-results";

export function getWorkSchedule(
  apiResponse
): Result<
  ScheduleDayNames,
  'Invalid Work Schedule. Expected Custom Field named Work Schedule with format: {"monday": [h,h], "tuesday": [h,h], "wednesday": [h,h], "thursday": [h,h],"friday": [h,h], "saturday": [h,h], "sunday": [h,h]}'
> {
  if (DEV_ENV) {
    return new Ok({
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17],
      saturday: [],
      sunday: [],
    });
  } else {
    const agent: Agent = apiResponse[0].data;
    const customProps: CustomProperty[] = apiResponse[1].data;
    const agentCustomProps = customProps.map((prop) => ({
      name: prop.name,
      value: agent.custom[prop.scopeType + prop.slug],
    }));
    const workScheduleString = agentCustomProps.find(
      (x) => x.name === "Work Schedule"
    )?.value;
    try {
      const parsedSchedule = JSON.parse(workScheduleString);
      if (_isValidWorkSchedule(parsedSchedule)) {
        return new Ok(parsedSchedule);
      } else {
        return new Err(
          'Invalid Work Schedule. Expected Custom Field named Work Schedule with format: {"monday": [h,h], "tuesday": [h,h], "wednesday": [h,h], "thursday": [h,h],"friday": [h,h], "saturday": [h,h], "sunday": [h,h]}'
        );
      }
    } catch (e) {
      return new Err(
        'Invalid Work Schedule. Expected Custom Field named Work Schedule with format: {"monday": [h,h], "tuesday": [h,h], "wednesday": [h,h], "thursday": [h,h],"friday": [h,h], "saturday": [h,h], "sunday": [h,h]}'
      );
    }
  }
}

function _isValidWorkSchedule(workSchedule) {
  const keys = Object.keys(workSchedule);
  const validLength = keys.length === 7;
  const hasRequiredProps =
    has(workSchedule, "monday") &&
    has(workSchedule, "tuesday") &&
    has(workSchedule, "wednesday") &&
    has(workSchedule, "thursday") &&
    has(workSchedule, "friday") &&
    has(workSchedule, "saturday") &&
    has(workSchedule, "sunday");
  const hasRequiredVals =
    keys.find((key) => {
      return (
        !Array.isArray(workSchedule[key]) ||
        workSchedule[key].length === 1 ||
        workSchedule[key].length > 2
      );
    }) === undefined;
  return validLength && hasRequiredProps && hasRequiredVals;
}
