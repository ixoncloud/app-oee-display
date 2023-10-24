export function calculateOEE(
  actualProductionTime: number,
  potentialProductionTime: number,
  maxGraderSpeedCph: number,
  actualOutput: number,
  totalAmountOfGoodQualityEggs: number,
  totalAmountOfProcessedEggs: number
) {
  const availability = actualProductionTime / potentialProductionTime;
  const theoreticalOutput = maxGraderSpeedCph * potentialProductionTime;
  const performance = actualOutput / theoreticalOutput;
  const quality =
    totalAmountOfGoodQualityEggs / totalAmountOfProcessedEggs || 1;
  const oee = availability * performance * quality;
  return [availability, performance, quality, oee];
}
