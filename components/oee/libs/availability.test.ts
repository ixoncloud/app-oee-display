import {
  getScheduledSecondsOfAvailability,
  getAvailability,
} from "./availability";

describe("test getAvailability", () => {
  test("availability = 1 if scheduled and real are the same", () => {
    expect(getAvailability(100, 100)).toBe(1);
  });
  test("availability = 2 if scheduled is half of real", () => {
    expect(getAvailability(50, 100)).toBe(2);
  });
  test("availability = 0.5 if scheduled is twice as large as real", () => {
    expect(getAvailability(100, 50)).toBe(0.5);
  });
});

describe("test getScheduledMinutesOfAvailability", () => {
  describe("test scheduled minutes of production is 480 when production is planned for 8 hours on a single day", () => {
    test("batch starts at 9 and ends at 17", () => {
      const productionScheduleMock = {
        monday: [9, 17],
        tuesday: [9, 17],
        wednesday: [9, 17],
        thursday: [9, 17],
        friday: [9, 17],
        saturday: [],
        sunday: [],
      };
      const startTimeStampMilliSeconds = 1645430400000;
      const endTimeStampMilliSeconds = 1645459200000;
      expect(
        getScheduledSecondsOfAvailability(
          productionScheduleMock,
          startTimeStampMilliSeconds,
          endTimeStampMilliSeconds
        )
      ).toBe(28800);
    });
    test(" batch start at 11 and ends at 17", () => {
      const productionScheduleMock = {
        monday: [9, 17],
        tuesday: [9, 17],
        wednesday: [9, 17],
        thursday: [9, 17],
        friday: [9, 17],
        saturday: [],
        sunday: [],
      };
      const startTimeStampMilliSeconds = 1645437600000;
      const endTimeStampMilliSeconds = 1645459200000;
      expect(
        getScheduledSecondsOfAvailability(
          productionScheduleMock,
          startTimeStampMilliSeconds,
          endTimeStampMilliSeconds
        )
      ).toBe(21600);
    });
    test(" batch start at 6 and ends at 12, ignore from 6 - 9 because out of schedule", () => {
      const productionScheduleMock = {
        monday: [9, 17],
        tuesday: [9, 17],
        wednesday: [9, 17],
        thursday: [9, 17],
        friday: [9, 17],
        saturday: [],
        sunday: [],
      };
      const startTimeStampMilliSeconds = 1645419600000;
      const endTimeStampMilliSeconds = 1645441200000;
      expect(
        getScheduledSecondsOfAvailability(
          productionScheduleMock,
          startTimeStampMilliSeconds,
          endTimeStampMilliSeconds
        )
      ).toBe(10800);
    });
    test(" batch start at 12 and ends at 18, ignore from 17 - 18 because out of schedule", () => {
      const productionScheduleMock = {
        monday: [9, 17],
        tuesday: [9, 17],
        wednesday: [9, 17],
        thursday: [9, 17],
        friday: [9, 17],
        saturday: [],
        sunday: [],
      };
      const startTimeStampMilliSeconds = 1645441200000;
      const endTimeStampMilliSeconds = 1645462800000;
      expect(
        getScheduledSecondsOfAvailability(
          productionScheduleMock,
          startTimeStampMilliSeconds,
          endTimeStampMilliSeconds
        )
      ).toBe(18000);
    });
  });
  test(" batch start at 11 and ends at 11 next morning, ignore 9-11 & 11-17", () => {
    const productionScheduleMock = {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17],
      saturday: [],
      sunday: [],
    };
    const startTimeStampMilliSeconds = 1645437600000;
    const endTimeStampMilliSeconds = 1645524000000;
    expect(
      getScheduledSecondsOfAvailability(
        productionScheduleMock,
        startTimeStampMilliSeconds,
        endTimeStampMilliSeconds
      )
    ).toBe(28800);
  });
  test(" batch start at 11 and ends at 11 the morning after tomorrow, ignore 9-11 on first day & 11-17 on morning after tomorrow", () => {
    const productionScheduleMock = {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17],
      saturday: [],
      sunday: [],
    };
    const startTimeStampMilliSeconds = 1645437600000;
    const endTimeStampMilliSeconds = 1645610400000;
    expect(
      getScheduledSecondsOfAvailability(
        productionScheduleMock,
        startTimeStampMilliSeconds,
        endTimeStampMilliSeconds
      )
    ).toBe(57600);
  });

  test("the planned production minutes for all days from the start to the end timestamp, when production is planned on weekdays and saturdays for 8 hours", () => {
    const productionScheduleMock = {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17],
      saturday: [9, 17],
      sunday: [],
    };
    const startTimeStampMilliSeconds = 1644188400000;
    const endTimeStampMilliSeconds = 1645138799000;
    expect(
      getScheduledSecondsOfAvailability(
        productionScheduleMock,
        startTimeStampMilliSeconds,
        endTimeStampMilliSeconds
      )
    ).toBe(288000);
  });

  test("the planned production minutes for all days from the start to the end timestamp, when production is planned on weekdays for 8 hours", () => {
    const productionScheduleMock = {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17],
      saturday: [],
      sunday: [],
    };
    const startTimeStampMilliSeconds = 1644188400000;
    const endTimeStampMilliSeconds = 1645138799000;
    expect(
      getScheduledSecondsOfAvailability(
        productionScheduleMock,
        startTimeStampMilliSeconds,
        endTimeStampMilliSeconds
      )
    ).toBe(259200);
  });

  test("BUG fix: 2 days where start date is outside of schedule and end date is inside schedule ", () => {
    const productionScheduleMock = {
      monday: [7, 17],
      tuesday: [7, 17],
      wednesday: [7, 17],
      thursday: [7, 17],
      friday: [7, 17],
      saturday: [],
      sunday: [],
    };
    const startTimeStampMilliSeconds = 1649778082000;
    const endTimeStampMilliSeconds = 1649826724000;
    expect(
      getScheduledSecondsOfAvailability(
        productionScheduleMock,
        startTimeStampMilliSeconds,
        endTimeStampMilliSeconds
      )
    ).toBe(724);
  });
});
