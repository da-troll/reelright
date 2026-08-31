import { AdapterRoot } from "../../src/engine/AdapterRoot";
import { nextPlaygroundCatalog } from "./catalog";

export const NextPlaygroundRoot: React.FC = () => (
  <AdapterRoot catalog={nextPlaygroundCatalog} />
);
