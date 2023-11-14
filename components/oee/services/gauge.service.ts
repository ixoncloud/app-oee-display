import * as echarts from "echarts/core";
import { GaugeChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { mapValueToRule } from "../utils/rules";

echarts.use([GaugeChart, CanvasRenderer]);

export class GaugeService {
  private isNarrow = false;
  private isMedium = false;
  private isShallow = false;
  private value = 0;
  private myChart: any;
  private label: string;
  private option;
  private redrawTimeout?: NodeJS.Timeout;
  private rules;
  private color?: string;
  constructor(private chartEl: HTMLDivElement, label: string, rules: any) {
    this.option = {
      textStyle: {
        fontFamily: "Roboto, Helvetica Neue, sans-serif",
      },
    };
    this.myChart = echarts.init(this.chartEl);
    this.myChart.setOption(this.option);
    this.label = label;
    this.rules = rules;
  }
  public setValue(value: number) {
    this.value = value;
    this.color = mapValueToRule(value, this.rules)?.rule?.color;
    this.draw();
  }
  public resize(isNarrow: boolean, isMedium: boolean, isShallow: boolean) {
    this.isNarrow = isNarrow;
    this.isShallow = isShallow;
    this.isMedium = isMedium;

    if (this.myChart) {
      this.myChart.resize();
      if (this.redrawTimeout) {
        clearTimeout(this.redrawTimeout);
      }
      this.redrawTimeout = setTimeout(() => {
        this.draw();
      }, 500);
    }
  }
  public destroy() {
    this.myChart.dispose();
  }
  private draw() {
    this.myChart.setOption({
      series: [
        {
          type: "gauge",
          progress: {
            show: true,
          },
          color: this.color,
          detail: {
            valueAnimation: true,
            formatter: "{value}%",
            fontSize: this.isNarrow ? 10 : 16,
            offsetCenter: ["0%", "40%"],
            color: "inherit",
          },
          data: [
            {
              value: this.value,
              name: this.label,
              title: {
                offsetCenter: ["0%", "90%"],
              },
            },
          ],
          splitLine: {
            show: !this.isNarrow && !this.isShallow,
          },
          axisTick: {
            show: !this.isNarrow && !this.isShallow,
          },
          axisLabel: {
            show: !this.isNarrow && !this.isMedium && !this.isShallow,
            color: "inherit",
          },
          title: {
            fontSize: this.isNarrow ? 12 : 16,
          },
        },
      ],
    });
  }
}
