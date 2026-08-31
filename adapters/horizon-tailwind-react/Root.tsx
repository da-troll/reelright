import { AdapterRoot } from "../../src/engine/AdapterRoot";
import { horizonTailwindReactCatalog } from "./catalog";

export const HorizonTailwindReactRoot: React.FC = () => (
  <AdapterRoot catalog={horizonTailwindReactCatalog} />
);
