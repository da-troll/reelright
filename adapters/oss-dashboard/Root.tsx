import { AdapterRoot } from "../../src/engine/AdapterRoot";
import { ossDashboardCatalog } from "./catalog";

export const OssDashboardRoot: React.FC = () => (
  <AdapterRoot catalog={ossDashboardCatalog} />
);
