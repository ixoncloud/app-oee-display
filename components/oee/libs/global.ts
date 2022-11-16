export const DEV_ENV =
  window.location.hostname === "localhost" && window.location.port === "8000"; // capacitor runs on localhost aswell thats why we need to check the port

export interface ScheduleDayNames {
  monday: number[];
  tuesday: number[];
  wednesday: number[];
  thursday: number[];
  friday: number[];
  saturday: number[];
  sunday: number[];
}

export interface ScheduleDayNumbers {
  1: number[];
  2: number[];
  3: number[];
  4: number[];
  5: number[];
  6: number[];
  7: number[];
}

export interface Agent {
  custom: {
    comWorkSchedule: string;
  };
}
export interface CustomProperty {
  name: string;
  scopeType: string;
  slug: string;
}
