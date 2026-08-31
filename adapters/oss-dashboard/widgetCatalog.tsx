import Widget from "../../input/oss-dashboard/src/components/Widget/Widget";
import type { WidgetCatalog } from "../../src/widgets/catalog";

const DashboardStatusWidget: React.FC = () => (
  <Widget title="External adapter widget">
    <strong>
      Flatlogic dashboard modules are available to this composition.
    </strong>
  </Widget>
);

export const ossDashboardWidgetCatalog = {
  "oss-dashboard-status": DashboardStatusWidget,
} satisfies WidgetCatalog;
