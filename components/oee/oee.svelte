<script lang="ts">
  import { onMount, tick } from "svelte";

  import { Parser } from "expr-eval";

  import type {
    ComponentContext,
    LoggingDataClient,
    LoggingDataTimeRange,
    LoggingDataMetric,
    ComponentContextAggregatedMetricInput,
  } from "@ixon-cdk/types";
  import type { StaticInterval } from "./types";

  type Variable = {
    name: string;
    metric: ComponentContextAggregatedMetricInput;
  };

  import { GaugeService } from "./services/gauge.service";

  import { runResizeObserver } from "./utils/responsiveness";

  import { formatPercentage } from "./utils/formatting";

  import { mapMetricInputToQuery } from "./utils/query";

  import { max, indexOf, meanBy } from "lodash-es";

  import {
    getOptimalInterval,
    getOptimalQueryTimerange,
  } from "./utils/timerange";

  export let context: ComponentContext;
  let loggingDataClient: LoggingDataClient;

  let rootEl: HTMLDivElement;

  let interval: StaticInterval;
  let cancelQuery: (() => void) | undefined;

  let aGaugeChartEl: HTMLDivElement;
  let pGaugeChartEl: HTMLDivElement;
  let qGaugeChartEl: HTMLDivElement;
  let oeeGaugeChartEl: HTMLDivElement;

  let aGaugeService: GaugeService;
  let pGaugeService: GaugeService;
  let qGaugeService: GaugeService;
  let oeeGaugeService: GaugeService;

  let contentWidth = 0;
  $: isNarrow = contentWidth < 600;
  $: isMedium = contentWidth < 1200;
  $: onContext(context);

  $: header = context ? context.inputs.header : undefined;

  function onContext(context: ComponentContext) {
    if (!context) return;

    aGaugeService = new GaugeService(aGaugeChartEl, "Availability");
    pGaugeService = new GaugeService(pGaugeChartEl, "Performance");
    qGaugeService = new GaugeService(qGaugeChartEl, "Quality");
    oeeGaugeService = new GaugeService(oeeGaugeChartEl, "OEE");
  }

  onMount(() => {
    loggingDataClient = context.createLoggingDataClient();

    const resizeObserver = runResizeObserver(rootEl, () => {
      tick().then(() => {
        console.log("resize");
        aGaugeService.resize(isNarrow, isMedium);
        pGaugeService.resize(isNarrow, isMedium);
        qGaugeService.resize(isNarrow, isMedium);
        oeeGaugeService.resize(isNarrow, isMedium);
      });
    });

    context.ontimerangechange = onTimeRangeChanged;

    onTimeRangeChanged();

    header = context ? context.inputs.header || context.inputs : undefined;

    return () => {
      resizeObserver?.disconnect();
      aGaugeService?.destroy();
      pGaugeService?.destroy();
      qGaugeService?.destroy();
      oeeGaugeService?.destroy();
    };
  });

  function onTimeRangeChanged(): void {
    _runChartQuery();
  }

  function _runChartQuery(): void {
    if (cancelQuery) {
      cancelQuery();
      cancelQuery = undefined;
    }
    cancelQuery = _chartQuery();
  }

  function _chartQuery() {
    console.log("query");
    const variables = _getVariables();

    const queries = variables.map((x: { variable: Variable }) => {
      return {
        ...mapMetricInputToQuery(x?.variable?.metric),
        limit: 1,
      };
    });

    cancelQuery = loggingDataClient.query(queries, _processResponse);
  }

  function _getVariables() {
    const variables = context.inputs.variables;

    const variableNames = variables.map(
      (x: { variable: Variable }) => x?.variable?.name
    );
    const hasDuplicates = (variableNames: string[]) =>
      variableNames.length !== new Set(variableNames).size;

    if (hasDuplicates(variableNames)) {
      // error = "Please use unique variable names";
      return;
    }

    return variables;
  }

  function _getVariableNames() {
    const variables = context.inputs.variables;

    const variableNames = variables.map(
      (x: { variable: Variable }) => x?.variable?.name
    );
    const hasDuplicates = (variableNames: string[]) =>
      variableNames.length !== new Set(variableNames).size;

    if (hasDuplicates(variableNames)) {
      // error = "Please use unique variable names";
      return;
    }

    return variableNames;
  }

  function _processResponse(metrics: LoggingDataMetric[][]) {
    const variableValues = metrics.map((x) => {
      const value = x[0]?.value?.getValue();
      return value !== undefined ? Number(value) : "no-data-in-period";
    });

    const noDataInPeriod =
      variableValues.find((x) => x === "no-data-in-period") !== undefined;
    if (noDataInPeriod) {
      // error = 'No data available in selected time period';
      return;
    }

    const notANumber =
      variableValues.find((x) => Number.isNaN(x)) !== undefined;
    if (notANumber) {
      // error = 'Only works with number variables';
      return;
    }

    const variableNames = _getVariableNames();

    const variableKeyValues = variableNames.reduce(
      (accumulator: any, value: string, index: number) => {
        return { ...accumulator, [value]: variableValues[index] };
      },
      {}
    );

    console.log("context", context);

    const available =
      _doCalculation(
        variableKeyValues,
        context.inputs.calculation?.availability?.formula
      ) || 1;

    const performance =
      _doCalculation(
        variableKeyValues,
        context.inputs.calculation?.performance?.formula
      ) || 1;

    const quality =
      _doCalculation(
        variableKeyValues,
        context.inputs.calculation?.quality?.formula
      ) || 1;

    const oee = available * quality * performance;

    console.log("available", available);
    console.log("performance", performance);
    console.log("quality", quality);
    console.log("oee", oee);

    aGaugeService.setValue(formatPercentage(available));
    pGaugeService.setValue(formatPercentage(performance));
    qGaugeService.setValue(formatPercentage(quality));
    oeeGaugeService.setValue(formatPercentage(oee));
  }

  function _doCalculation(variableKeyValues, formula) {
    console.log("formula", formula);
    console.log("variableKeyValues", variableKeyValues);
    try {
      const calculatedValue = Parser.evaluate(formula, variableKeyValues);
      return calculatedValue;
    } catch {
      // error = 'Invalid formula, example: x / y * 100';
    }
  }
</script>

<div class="card" bind:this={rootEl}>
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
  <div class="card-content" bind:clientWidth={contentWidth}>
    <div class="chart" bind:this={aGaugeChartEl} />
    <div class="chart" bind:this={pGaugeChartEl} />
    {#if !context?.inputs?.hideQuality}
      <div class="chart" bind:this={qGaugeChartEl} />
    {/if}
    <div class="chart" bind:this={oeeGaugeChartEl} />
  </div>
</div>

<style lang="scss">
  $heading-color: #000000;
  @import "./styles/card";

  .card-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: stretch;
  }

  .chart {
    flex: 1;
    min-width: 20%;
    height: 100%;
  }
</style>
