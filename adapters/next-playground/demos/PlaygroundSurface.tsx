import { useState } from "react";
import { createPortal } from "react-dom";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Geist, Geist_Mono } from "next/font/google";
import { Boundary } from "#/ui/boundary";
import { GlobalNav } from "#/ui/global-nav";
import { ProductCard, ProductList } from "#/ui/product-card";
import { Tabs } from "#/ui/tabs";
import "../../../.remotion-app/next-playground/app.css";
import { DeterministicAppSurface } from "../../../src/engine/DeterministicAppSurface";
import { navigationFixture, productFixture } from "../fixtures/navigation";
import { NextPlaygroundProviders } from "../providers";

const geistSans = Geist({ variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono" });

const NativePortalExample: React.FC = () => {
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);

  return (
    <Boundary
      animateRerendering={false}
      color="violet"
      label={["Native Tabs", "Scoped portal"]}
    >
      <div
        ref={setPortalTarget}
        data-native-portal="next-playground"
        className="min-h-9"
      />
      {portalTarget
        ? createPortal(
            <Tabs
              basePath="/layouts"
              items={[
                { text: "Overview" },
                { text: "Nested", slug: "nested" },
                { text: "Shared", slug: "shared" },
              ]}
            />,
            portalTarget,
          )
        : null}
    </Boundary>
  );
};

const NativePlayground: React.FC = () => (
  <NextPlaygroundProviders>
    <div
      className={`relative h-full overflow-hidden bg-gray-950 text-gray-100 ${geistSans.variable} ${geistMono.variable}`}
      style={
        {
          ...geistSans.style,
          "--font-geist-mono": geistMono.style.fontFamily,
          "--font-geist-sans": geistSans.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <aside className="absolute inset-y-0 left-0 w-72 border-r border-gray-800 bg-black">
        <GlobalNav items={navigationFixture} />
      </aside>

      <main className="ml-72 grid h-full grid-cols-[1fr_340px] gap-8 overflow-hidden p-10">
        <div>
          <ProductList title="Featured products" count={productFixture.length}>
            {productFixture.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductList>
        </div>

        <div className="space-y-8 pt-2">
          <NativePortalExample />
          <Boundary
            animateRerendering={false}
            color="blue"
            label="Compatibility boundary"
          >
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-mono text-xs text-gray-500 uppercase">
                  Router
                </dt>
                <dd className="mt-1 text-gray-200">/layouts</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-gray-500 uppercase">
                  Runtime
                </dt>
                <dd className="mt-1 text-gray-200">App-owned React 19.2</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-gray-500 uppercase">
                  Motion
                </dt>
                <dd className="mt-1 text-gray-200">Autonomous CSS disabled</dd>
              </div>
            </dl>
          </Boundary>
        </div>
      </main>
    </div>
  </NextPlaygroundProviders>
);

export const NextPlaygroundStill: React.FC = () => (
  <DeterministicAppSurface
    appId="next-playground"
    backgroundColor="#020617"
    designHeight={900}
    designWidth={1440}
  >
    <NativePlayground />
  </DeterministicAppSurface>
);

export const NextPlaygroundDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 2 * fps], [1.02, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ height: "100%", opacity, transform: `scale(${scale})` }}>
      <NextPlaygroundStill />
    </div>
  );
};
