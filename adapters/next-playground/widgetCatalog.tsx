import { Boundary } from "#/ui/boundary";
import { ProductCard } from "#/ui/product-card";
import type { WidgetCatalog } from "../../src/widgets/catalog";
import { productFixture } from "./fixtures/navigation";

const NextPlaygroundProductWidget: React.FC = () => (
  <div
    data-native-app="next-playground"
    className="rounded-xl bg-gray-950 p-4 text-gray-100"
  >
    <Boundary
      animateRerendering={false}
      color="blue"
      label="Next.js native widget"
      size="small"
    >
      <div className="mx-auto max-w-52">
        <ProductCard product={productFixture[2]} />
      </div>
    </Boundary>
  </div>
);

export const nextPlaygroundWidgetCatalog = {
  "next-playground-product": NextPlaygroundProductWidget,
} satisfies WidgetCatalog;
