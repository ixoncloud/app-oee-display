import * as global from "./global";
import { getWorkSchedule } from "./workSchedule";

const mockGlobal = global as { DEV_ENV: boolean };

jest.mock("./global", () => ({
  __esModule: true,
  DEV_ENV: null,
}));

describe("dev tests", () => {
  test("work schedule containing every day of the week is valid", () => {
    mockGlobal.DEV_ENV = true;
    const expectedWorkSchedule = {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17],
      saturday: [],
      sunday: [],
    };
    const response = getWorkSchedule(undefined);
    expect(response.ok).toEqual(true);
    expect(response.err).toEqual(false);
    expect(response.val).toStrictEqual(expectedWorkSchedule);
  });
});

describe("prod tests", () => {
  test("work schedule containing every day of the week is valid", () => {
    mockGlobal.DEV_ENV = false;
    const apiResponseMock = [
      {
        data: {
          custom: {
            comWorkSchedule:
              '{"monday": [9,17],"tuesday": [9,17],"wednesday": [9,17],"thursday": [9,17],"friday": [9,17],"saturday": [9,17],"sunday": []}',
          },
        },
      },
      {
        data: [
          {
            name: "Work Schedule",
            scopeType: "com",
            slug: "WorkSchedule",
          },
        ],
      },
    ];
    const expectedWorkSchedule = {
      monday: [9, 17],
      tuesday: [9, 17],
      wednesday: [9, 17],
      thursday: [9, 17],
      friday: [9, 17],
      saturday: [9, 17],
      sunday: [],
    };
    const response = getWorkSchedule(apiResponseMock);
    expect(response.ok).toEqual(true);
    expect(response.err).toEqual(false);
    expect(response.val).toStrictEqual(expectedWorkSchedule);
  });

  test("work schedule containing every day of the week and more keys is invalid", () => {
    mockGlobal.DEV_ENV = false;
    const apiResponseMock = [
      {
        data: {
          custom: {
            comWorkSchedule:
              '{"monday": [9,17],"tuesday": [9,17],"wednesday": [9,17],"thursday": [9,17],"friday": [9,17],"saturday": [9,17],"sunday": [], "x": 0}',
          },
        },
      },
      {
        data: [
          {
            name: "Work Schedule",
            scopeType: "com",
            slug: "WorkSchedule",
          },
        ],
      },
    ];
    const response = getWorkSchedule(apiResponseMock);
    expect(response.ok).toEqual(false);
    expect(response.err).toEqual(true);
    expect(response.val).toEqual(
      'Invalid Work Schedule. Expected Custom Field named Work Schedule with format: {"monday": [h,h], "tuesday": [h,h], "wednesday": [h,h], "thursday": [h,h],"friday": [h,h], "saturday": [h,h], "sunday": [h,h]}'
    );
  });

  test("work schedule containing invalid keys", () => {
    mockGlobal.DEV_ENV = false;
    const apiResponseMock = [
      {
        data: {
          custom: {
            comWorkSchedule: '{"x": 0}',
          },
        },
      },
      {
        data: [
          {
            name: "Work Schedule",
            scopeType: "com",
            slug: "WorkSchedule",
          },
        ],
      },
    ];

    const response = getWorkSchedule(apiResponseMock);
    expect(response.ok).toEqual(false);
    expect(response.err).toEqual(true);
    expect(response.val).toEqual(
      'Invalid Work Schedule. Expected Custom Field named Work Schedule with format: {"monday": [h,h], "tuesday": [h,h], "wednesday": [h,h], "thursday": [h,h],"friday": [h,h], "saturday": [h,h], "sunday": [h,h]}'
    );
  });

  test("work schedule custom field not available", () => {
    mockGlobal.DEV_ENV = false;
    const apiResponseMock = [
      {
        data: {
          custom: {
            comWorkSchedule:
              '{"monday": [9,17],"tuesday": [9,17],"wednesday": [9,17],"thursday": [9,17],"friday": [9,17],"saturday": [9,17],"sunday": []}',
          },
        },
      },
      {
        data: [],
      },
    ];

    const response = getWorkSchedule(apiResponseMock);
    expect(response.ok).toEqual(false);
    expect(response.err).toEqual(true);
    expect(response.val).toEqual(
      'Invalid Work Schedule. Expected Custom Field named Work Schedule with format: {"monday": [h,h], "tuesday": [h,h], "wednesday": [h,h], "thursday": [h,h],"friday": [h,h], "saturday": [h,h], "sunday": [h,h]}'
    );
  });

  test("work schedule invalid", () => {
    mockGlobal.DEV_ENV = false;
    const apiResponseMock = [
      {
        data: {
          custom: {
            comWorkSchedule:
              '{"monday": [9,17],"tuesday": [9,17],"wednesday": [9,17],"thursday": [9,17],"friday": [9,17],"saturday": [9,17,4],"sunday": [1]}',
          },
        },
      },
      {
        data: [
          {
            name: "Work Schedule",
            scopeType: "com",
            slug: "WorkSchedule",
          },
        ],
      },
    ];
    const response = getWorkSchedule(apiResponseMock);
    expect(response.ok).toEqual(false);
    expect(response.err).toEqual(true);
    expect(response.val).toEqual(
      'Invalid Work Schedule. Expected Custom Field named Work Schedule with format: {"monday": [h,h], "tuesday": [h,h], "wednesday": [h,h], "thursday": [h,h],"friday": [h,h], "saturday": [h,h], "sunday": [h,h]}'
    );
  });

  test("work schedule invalid", () => {
    mockGlobal.DEV_ENV = false;
    const apiResponseMock = [
      {
        data: {
          custom: {
            comWorkSchedule:
              '{"monday": 8,"tuesday": 8,"wednesday": 8,"thursday": 8,"friday": 8,"saturday": 8,"sunday": 8}',
          },
        },
      },
      {
        data: [
          {
            name: "Work Schedule",
            scopeType: "com",
            slug: "WorkSchedule",
          },
        ],
      },
    ];
    const response = getWorkSchedule(apiResponseMock);
    expect(response.ok).toEqual(false);
    expect(response.err).toEqual(true);
    expect(response.val).toEqual(
      'Invalid Work Schedule. Expected Custom Field named Work Schedule with format: {"monday": [h,h], "tuesday": [h,h], "wednesday": [h,h], "thursday": [h,h],"friday": [h,h], "saturday": [h,h], "sunday": [h,h]}'
    );
  });
});
