import * as echarts from "echarts/core";
import { GaugeChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([GaugeChart, CanvasRenderer]);

export class GaugeService {
  private isNarrow = false;
  private isMedium = false;
  private value = 0;
  private myChart: any;
  private label: string;
  private option;
  private redrawTimeout?: number;
  constructor(private chartEl: HTMLDivElement, label: string) {
    this.option = {
      tooltip: {
        formatter: "{b} : {c}%",
        confine: true,
      },
      textStyle: {
        fontFamily: "Roboto, Helvetica Neue, sans-serif",
      },
    };
    this.myChart = echarts.init(this.chartEl);
    this.myChart.setOption(this.option);
    this.label = label;
  }
  public setValue(value: number) {
    this.value = value;
    this.draw();
  }
  public resize(isNarrow: boolean, isMedium: boolean) {
    this.isNarrow = isNarrow;
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
          detail: {
            valueAnimation: true,
            formatter: "{value}%",
            fontSize: this.isNarrow ? 12 : 16,
            offsetCenter: [
              "0%",
              this.isNarrow ? "160%" : this.isMedium ? "130%" : "40%",
            ],
          },
          data: [
            {
              value: this.value,
              name: this.label,
              title: {
                offsetCenter: [
                  "0%",
                  this.isNarrow ? "120%" : this.isMedium ? "100%" : "20%",
                ],
              },
            },
          ],
          splitLine: {
            show: !this.isNarrow,
          },
          axisTick: {
            show: !this.isNarrow,
          },
          axisLabel: {
            show: !this.isNarrow,
          },
          title: {
            fontSize: this.isNarrow ? 12 : 16,
          },
        },
      ],
    });
  }
}
