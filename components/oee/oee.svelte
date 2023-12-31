<script lang="ts">
  import { onMount, tick } from "svelte";

  import { Parser } from "expr-eval";

  import type {
    ComponentContext,
    LoggingDataClient,
    LoggingDataMetric,
    ComponentContextAggregatedMetricInput,
  } from "@ixon-cdk/types";

  import type { Rule } from "./utils/rules";

  type Variable = {
    name: string;
    metric: ComponentContextAggregatedMetricInput;
  };

  import { GaugeService } from "./services/gauge.service";
  import { runResizeObserver } from "./utils/responsiveness";
  import { formatPercentage } from "./utils/formatting";
  import { mapMetricInputToQuery } from "./utils/query";

  export let context: ComponentContext;

  let loggingDataClient: LoggingDataClient;
  let header: { title: string; subtitle: string };
  let error = "";
  let rootEl: HTMLDivElement;
  let cancelQuery: (() => void) | void | undefined;
  let availability: number | undefined;
  let performance: number | undefined;
  let quality: number | undefined;
  let oee: number | undefined;

  let aGaugeChartEl: HTMLDivElement;
  let pGaugeChartEl: HTMLDivElement;
  let qGaugeChartEl: HTMLDivElement;
  let oeeGaugeChartEl: HTMLDivElement;

  let aGaugeService: GaugeService;
  let pGaugeService: GaugeService;
  let qGaugeService: GaugeService;
  let oeeGaugeService: GaugeService;

  let hideAvailability = false;
  let hidePerformance = false;
  let hideQuality = false;
  let hideOee = false;

  let debugMode = false;

  type VariableKeyValues = { [key: string]: number };

  let variableKeyValues: VariableKeyValues = {};

  let contentWidth = 0;
  let contentHeight = 0;

  $: isNarrow = contentWidth < 600;
  $: isMedium = contentWidth < 1200;
  $: isShallow = contentHeight < 400;
  $: onContext(context);

  function onContext(context: ComponentContext) {
    error = "";

    if (!context) return;

    const rules: { rule: Rule }[] = context?.inputs?.rules || [];

    const availabilityRules = rules.filter(
      (x) => x.rule.colorUsage === "availability"
    );
    const performanceRules = rules.filter(
      (x) => x.rule.colorUsage === "performance"
    );
    const qualityRules = rules.filter((x) => x.rule.colorUsage === "quality");
    const oeeRules = rules.filter((x) => x.rule.colorUsage === "oee");

    if (!hideAvailability) {
      aGaugeService = new GaugeService(
        aGaugeChartEl,
        "Availability",
        availabilityRules
      );
    }
    if (!hidePerformance) {
      pGaugeService = new GaugeService(
        pGaugeChartEl,
        "Performance",
        performanceRules
      );
    }
    if (!hideQuality) {
      qGaugeService = new GaugeService(qGaugeChartEl, "Quality", qualityRules);
    }
    if (!hideOee) {
      oeeGaugeService = new GaugeService(oeeGaugeChartEl, "OEE", oeeRules);
    }
  }

  onMount(() => {
    header = context ? context.inputs.header : undefined;
    debugMode = context?.inputs?.debugMode || false;
    hideAvailability =
      context?.inputs?.displayOptions?.hideAvailability || false;
    hidePerformance = context?.inputs?.displayOptions?.hidePerformance || false;
    hideQuality = context?.inputs?.displayOptions?.hideQuality || false;
    hideOee = context?.inputs?.displayOptions?.hideOee || false;

    loggingDataClient = context.createLoggingDataClient();

    context.ontimerangechange = onTimeRangeChanged;

    onTimeRangeChanged();

    if (debugMode) {
      return;
    }

    const resizeObserver = runResizeObserver(rootEl, () => {
      tick().then(() => {
        hideAvailability =
          context?.inputs?.displayOptions?.hideAvailability || false;
        hidePerformance =
          context?.inputs?.displayOptions?.hidePerformance || false;
        hideQuality = context?.inputs?.displayOptions?.hideQuality || false;
        hideOee = context?.inputs?.displayOptions?.hideOee || false;

        aGaugeService?.resize(isNarrow, isMedium, isShallow);
        pGaugeService?.resize(isNarrow, isMedium, isShallow);
        qGaugeService?.resize(isNarrow, isMedium, isShallow);
        oeeGaugeService?.resize(isNarrow, isMedium, isShallow);
      });
    });

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
    const variables = _getVariables();

    const queries = variables.map((x: { variable: Variable }) => {
      return {
        ...mapMetricInputToQuery(x?.variable?.metric),
        limit: 1,
      };
    });

    cancelQuery = loggingDataClient.query(queries, _processResponse);
  }

  function _processResponse(metrics: LoggingDataMetric[][]) {
    const variableValues = metrics.map((x) => {
      const value = x[0]?.value?.getValue();
      return value !== undefined ? Number(value) : "no-data-in-period";
    });

    const noDataInPeriod =
      variableValues.find((x) => x === "no-data-in-period") !== undefined;
    if (noDataInPeriod) {
      error = "No data available in selected time period";
      return;
    }

    const notANumber =
      variableValues.find((x) => Number.isNaN(x)) !== undefined;
    if (notANumber) {
      error = "Only works with number variables";
      return;
    }

    const variableNames = _getVariableNames();

    variableKeyValues = variableNames.reduce(
      (accumulator: any, value: string, index: number) => {
        return { ...accumulator, [value]: variableValues[index] };
      },
      {}
    );

    availability = _doCalculation(
      variableKeyValues,
      context.inputs.calculation?.availability?.formula
    );

    performance = _doCalculation(
      variableKeyValues,
      context.inputs.calculation?.performance?.formula
    );

    quality = _doCalculation(
      variableKeyValues,
      context.inputs.calculation?.quality?.formula
    );

    if (
      availability === undefined ||
      performance === undefined ||
      quality === undefined
    ) {
      return;
    }

    if (availability > 1 || performance > 1 || quality > 1) {
      error = "only works with decimal calculation results where 1 is 100%";
      return;
    }

    if (availability < 0 || performance < 0 || quality < 0) {
      error = "only works with positive calculation results";
      return;
    }

    oee = availability * quality * performance;

    if (!debugMode) {
      aGaugeService.setValue(formatPercentage(availability));
      pGaugeService.setValue(formatPercentage(performance));
      qGaugeService.setValue(formatPercentage(quality));
      oeeGaugeService.setValue(formatPercentage(oee));
    }
  }

  function _getVariables() {
    const variables = context.inputs.variables;

    const variableNames = variables.map(
      (x: { variable: Variable }) => x?.variable?.name
    );
    const hasDuplicates = (variableNames: string[]) =>
      variableNames.length !== new Set(variableNames).size;

    if (hasDuplicates(variableNames)) {
      error = "Please use unique variable names";
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
      error = "Please use unique variable names";
      return;
    }

    return variableNames;
  }

  function _doCalculation(
    variableKeyValues: VariableKeyValues,
    formula?: string
  ) {
    if (!formula) {
      formula = "1";
    }
    try {
      const calculatedValue = Parser.evaluate(formula, variableKeyValues);
      return calculatedValue;
    } catch {
      error =
        "Invalid formula, example: x / y * 100. Make sure all your variables are defined";
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
  <div
    class="card-content"
    bind:clientWidth={contentWidth}
    bind:clientHeight={contentHeight}
  >
    {#if debugMode && variableKeyValues}
      <div>
        <p>
          availability: {context.inputs.calculation?.availability?.formula} = {availability}
        </p>
        <p>
          performance: {context.inputs.calculation?.performance?.formula} = {performance}
        </p>
        <p>
          quality: {context.inputs.calculation?.quality?.formula} = {quality}
        </p>
        <p>
          oee = {oee}
        </p>
        <p>variables:</p>
        {#each Object.entries(variableKeyValues) as [k, v]}
          <p>{k} = {v}</p>
        {/each}
        <p />
      </div>
    {:else if error}
      <div>
        <p>{error}</p>
      </div>
    {:else}
      {#if !hideAvailability}
        <div class="chart-wrapper">
          <div class="chart" bind:this={aGaugeChartEl} />
        </div>
      {/if}
      {#if !hidePerformance}
        <div class="chart-wrapper">
          <div class="chart" bind:this={pGaugeChartEl} />
        </div>
      {/if}
      {#if !hideQuality}
        <div class="chart-wrapper">
          <div class="chart" bind:this={qGaugeChartEl} />
        </div>
      {/if}
      {#if !hideOee}
        <div class="chart-wrapper">
          <div class="chart" bind:this={oeeGaugeChartEl} />
        </div>
      {/if}
    {/if}
  </div>
</div>

<style lang="scss">
  @import "./styles/card";

  .card-content {
    padding: 0px !important;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .chart-wrapper {
    flex: 1;
    -webkit-touch-callout: none;
    user-select: none;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .chart {
    position: absolute;
    height: 100%;
    width: 100%;
    -webkit-touch-callout: none;
    user-select: none;

    top: 0; /* Position at the top of .chart-wrapper */
    left: 0; /* Position at the left of .chart-wrapper */
  }
</style>
