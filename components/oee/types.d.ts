export type TimeRange = { from: number; to: number };

export type Interval = "best fit" | StaticInterval;

export type StaticInterval = "hours" | "days" | "weeks";

export type MetricInput = {
  selector: string;
  aggregator: string;
  transform: string;
  unit: string;
  decimals: number;
  factor: number;
};
