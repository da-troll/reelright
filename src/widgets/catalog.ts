import type { ComponentType } from "react";

export type WidgetLayout = "desktop" | "mobile";
export type WidgetComponent = ComponentType<{ layout: WidgetLayout }>;
export type WidgetCatalog = Readonly<Record<string, WidgetComponent>>;

export const mergeWidgetCatalogs = (
  ...catalogs: readonly WidgetCatalog[]
): WidgetCatalog => Object.assign({}, ...catalogs);
