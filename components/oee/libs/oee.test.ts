import { calculateOee } from "./oee";

test("test oee calculation", () => {
  const testData = [
    [
      {
        time: 1646193369812,
        value: {
          getValue() {
            return 24000;
          },
        },
      },
    ],
    [
      {
        time: 1646193369812,
        value: {
          getValue() {
            return 50;
          },
        },
      },
    ],
    [
      {
        time: 1646193369812,
        value: {
          getValue() {
            return 21600;
          },
        },
      },
    ],
    [
      {
        time: 1646193369812,
        value: {
          getValue() {
            return 1000;
          },
        },
      },
    ],
  ];
  const from = 1646262000000;
  const to = 1646348399000;

  const workSchedule = {
    monday: [8, 17],
    tuesday: [8, 17],
    wednesday: [8, 17],
    thursday: [8, 17],
    friday: [8, 17],
    saturday: [],
    sunday: [],
  };

  const response = calculateOee(testData, from, to, workSchedule);
  expect(response.ok).toEqual(true);
  expect(response.err).toEqual(false);
  const [oee, availability, performance, quality] = response.val;

  expect(availability).toEqual(0.7407407407407408);
  expect(performance).toEqual(0.8);
  expect(quality).toEqual(0.9537037037037037);
  expect(oee).toEqual(0.5651577503429356);
});

test("test empty metrics", () => {
  const testData = [[], [], [], []];
  const from = 1646262000000;
  const to = 1646348399000;

  const workSchedule = {
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0,
  };

  const response = calculateOee(testData, from, to, workSchedule);
  expect(response.ok).toEqual(false);
  expect(response.err).toEqual(true);
  expect(response.val).toEqual("required metric data is not available");
});
