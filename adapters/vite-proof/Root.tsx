import { AdapterRoot } from "../../src/engine/AdapterRoot";
import { viteProofCatalog } from "./catalog";

export const ViteProofRoot: React.FC = () => {
  return <AdapterRoot catalog={viteProofCatalog} />;
};
