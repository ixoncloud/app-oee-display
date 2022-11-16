import * as echarts from "echarts/core";
import { GaugeChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([GaugeChart, CanvasRenderer]);

export class GaugeService {
  private myChart: any;
  private option = {
    tooltip: {
      formatter: "{a} <br/>{b} : {c}%",
    },
    series: [
      {
        itemStyle: {
          color: "#1bbbe9",
        },
        name: "Pressure",
        type: "gauge",
        progress: {
          show: true,
        },
        detail: {
          valueAnimation: true,
          formatter: "{value}%",
        },
        data: [
          {
            value: 0,
            name: "OEE",
          },
        ],
      },
    ],
    textStyle: {
      fontFamily: "Roboto, Helvetica Neue, sans-serif",
    },
  };

  constructor(private chartEl: HTMLDivElement) {
    this.myChart = echarts.init(this.chartEl);
    this.myChart.setOption(this.option);
  }

  public setValue(value) {
    this.option && this.myChart.setOption(this.option);

    this.myChart.setOption({
      series: [
        {
          data: [
            {
              value,
              name: "OEE",
            },
          ],
        },
      ],
    });
  }

  public resize() {
    if (this.myChart) {
      this.myChart.resize();
    }
  }

  public destroy() {
    this.myChart.dispose();
  }
}
