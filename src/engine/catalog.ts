import type { ComponentType } from "react";
import type { CalculateMetadataFunction } from "remotion";

export type StillCatalogEntry = {
  component: ComponentType;
  height: number;
  id: string;
  width: number;
};

export type CompositionCatalogEntry = StillCatalogEntry & {
  calculateMetadata?: CalculateMetadataFunction<Record<string, unknown>>;
  durationInFrames: number;
  fps: number;
};

export type AdapterCatalog = {
  compositions?: readonly CompositionCatalogEntry[];
  folderName: string;
  stills: readonly StillCatalogEntry[];
};

export const defineAdapterCatalog = <Catalog extends AdapterCatalog>(
  catalog: Catalog,
) => catalog;
