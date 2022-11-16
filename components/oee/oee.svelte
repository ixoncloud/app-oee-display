<script lang="ts">
  import { onMount, tick } from "svelte";
  import { round } from "lodash-es";

  import { calculateOee } from "./libs/oee";
  import { getWorkSchedule } from "./libs/workSchedule";
  import { GaugeService } from "./libs/gauge.service";

  import { isNumber } from "lodash";

  export let context = undefined;

  let header;
  let workSchedule;
  let availability;
  let performance;
  let quality;
  let oee;
  let error;

  let contentWidth = 0;
  let contentHeight = 0;

  let rootEl: HTMLDivElement;
  let chartEl: HTMLDivElement;

  let gaugeService: GaugeService;

  $: isNarrow = contentWidth < 400;
  $: isShallow = contentHeight < 300;

  $: onContext(context);

  function mapMetricInputToQuery(metric) {
    return {
      selector: metric.selector,
      ...(metric.aggregator ? { postAggr: metric.aggregator } : {}),
      ...(metric.transform ? { postTransform: metric.transform } : {}),
      ...(metric.unit ? { unit: metric.unit } : {}),
      ...(isNumber(metric.decimals)
        ? { decimals: Number(metric.decimals) }
        : {}),
      ...(isNumber(metric.factor) ? { factor: Number(metric.factor) } : {}),
    };
  }

  function onContext(context) {
    if (!context) return;

    gaugeService = new GaugeService(chartEl);
  }

  function runResizeObserver(el, callback) {
    const rect = el.getBoundingClientRect();
    callback(rect);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        callback(entry.contentRect);
        contentHeight = entry.contentRect.height;
      }
    });
    observer.observe(el);
    return observer;
  }

  onMount(() => {
    const resourceDataClient = context.createResourceDataClient();
    const loggingDataClient = context.createLoggingDataClient();

    const resizeObserver = runResizeObserver(rootEl, () => {
      tick().then(() => {
        gaugeService.resize();
      });
    });
    const cancelQuery = resourceDataClient.query(
      [
        { selector: "Agent", fields: ["custom"] },
        {
          selector: "CustomPropertyList",
          fields: ["name", "scopeType", "slug"],
        },
      ],
      (resourceDataClientResponse) => {
        const result = getWorkSchedule(resourceDataClientResponse);
        if (result.ok) {
          workSchedule = result.val;
        } else {
          error = result.val;
          return;
        }

        cancelQuery();

        if (
          !context.inputs.realizedProductionTimeSeconds ||
          !context.inputs.setSpeed ||
          !context.inputs.realizedProductionAmount ||
          !context.inputs.rejectedProductionAmount
        ) {
          error = "not all inputs are configured";
          return;
        }

        loggingDataClient.query(
          [
            context.inputs.realizedProductionTimeSeconds.metric,
            context.inputs.setSpeed.metric,
            context.inputs.realizedProductionAmount.metric,
            context.inputs.rejectedProductionAmount.metric,
          ].map((x) => {
            return { ...mapMetricInputToQuery(x), limit: 1 };
          }),
          (metrics) => {
            error = undefined;
            const result = calculateOee(
              metrics,
              context.timeRange.from,
              context.timeRange.to,
              workSchedule
            );
            if (result.ok) {
              [oee, availability, performance, quality] = result.val;
              gaugeService.setValue(formatPercentage(oee));
            } else {
              error = result.val;
            }
          }
        );
      }
    );
    header = context ? context.inputs.header || context.inputs : undefined;

    return () => {
      resizeObserver?.disconnect();
      gaugeService?.destroy();
    };
  });

  function formatPercentage(percentage) {
    return round(percentage * 100, 0);
  }
</script>

<div class="card">
  {#if header && (header.title || header.subtitle)}
    <div class="card-header">
      {#if header.title}
        <h3 class="card-title">{header.title}</h3>
      {/if}
      {#if header.subtitle}
        <h4 class="card-subtitle">{header.subtitle}</h4>
      {/if}
    </div>
  {/if}
  <div class="card-content" bind:this={rootEl} bind:clientWidth={contentWidth}>
    <div class="chart" bind:this={chartEl} />
    <div class={isNarrow || isShallow ? "apq" : "apq larger"}>
      {#if error}
        <span class="a">{error}</span>
      {:else if !oee}
        <span class="a">loading..</span>
      {:else}
        <span class="a"
          >Availability:<br />{formatPercentage(availability)}%</span
        >
        <span class="a">Performance:<br />{formatPercentage(performance)}%</span
        >
        <span class="a">Quality:<br />{formatPercentage(quality)}%</span>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @import "./shared/styles/card";

  .card-content {
    position: relative;
    overflow: hidden;
    height: 100%;
    width: 100%;
  }

  .chart {
    position: absolute;
    margin-left: -8px;
    margin-top: -8px;
    height: 100%;
    width: 100%;
    -webkit-touch-callout: none;
    user-select: none;
  }

  .apq {
    font-family: var(--font-family);
    font-weight: 750;
    font-size: small;
    z-index: 9;
    position: relative;
    top: 100% - 18;
    padding: 8px;
    display: flex;
    justify-content: center;
    &.larger {
      font-size: medium;
    }
  }

  .a {
    padding-top: 4px;
    padding-bottom: 4px;
    padding-left: 8px;
    padding-right: 8px;
  }
</style>
