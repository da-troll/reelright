// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- no type declarations resolved for the minified CJS build
import RealChart from "react-apexcharts/dist/react-apexcharts.min.js";

type ApexChartProps = {
  height?: string | number;
  // ApexCharts' own options shape is large; the app passes plain objects
  // through from src/variables/charts.js.
  options: Record<string, unknown>;
  series: unknown[];
  type: string;
  width?: string | number;
};

// Deterministic shim for the native `react-apexcharts` import used by
// components/charts/{Bar,Line,Pie}Chart.jsx. ApexCharts animates its initial
// draw-in (bars sliding up, lines drawing, pie segments sweeping in) over
// real elapsed time; Remotion has no way to know to wait for that animation
// to settle before capturing a frame, so two renders of the same still frame
// taken moments apart can capture the animation at different points and
// produce different pixels for what should be an identical frame -- this is
// exactly what this repo's delayed double-render determinism gate caught.
// This wraps the real component and only disables that one autonomous
// animation; series data, colors, and every other option pass through
// unchanged.
const ApexChart: React.FC<ApexChartProps> = ({ options, ...rest }) => {
  const chartOptions = options?.chart as Record<string, unknown> | undefined;
  const deterministicOptions = {
    ...options,
    chart: {
      ...chartOptions,
      animations: { enabled: false },
    },
  };

  return <RealChart options={deterministicOptions} {...rest} />;
};

export default ApexChart;
