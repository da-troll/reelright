import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

/**
 * DOM-anchored overlay geometry.
 *
 * Demo overlays (highlight rings, cursors, callouts) must never use hand-
 * estimated page coordinates: any change to fixtures, CSS, or the native app
 * silently invalidates them. An anchor names a rendered element; its rectangle
 * is measured from the live layout in design-space units, and a missing anchor
 * cancels the render instead of drawing in the wrong place.
 */

export type AnchorSpec = {
  /** Case-insensitive text the element must contain (deepest match wins). */
  text?: string;
  /** Require the element's trimmed text to equal `text` exactly. */
  exact?: boolean;
  /** CSS selector for candidate elements (combined with `text` if both set). */
  selector?: string;
  /** Expand the matched element to its `closest()` ancestor. */
  closest?: string;
  /** Pick among multiple matches in document order. */
  index?: number;
};

export type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
};

type AnchorContextValue = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  designWidth: number;
  /** Bumped when fonts settle so consumers re-measure the final layout. */
  measureEpoch: number;
};

const AnchorContext = createContext<AnchorContextValue | null>(null);

const describeSpec = (spec: AnchorSpec): string => JSON.stringify(spec);

const normalize = (value: string | null): string =>
  (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

const resolveAnchorElement = (
  container: HTMLElement,
  spec: AnchorSpec,
): Element | null => {
  const candidates = [
    ...container.querySelectorAll(spec.selector ?? "*"),
  ].filter((element) => {
    if (spec.text === undefined) {
      return true;
    }

    const needle = normalize(spec.text);
    const own = normalize(element.textContent);

    if (spec.exact ? own !== needle : !own.includes(needle)) {
      return false;
    }

    // Deepest match: reject elements whose children already match, so a text
    // anchor lands on the tight element rather than every ancestor.
    return ![...element.children].some((child) => {
      const childText = normalize(child.textContent);
      return spec.exact ? childText === needle : childText.includes(needle);
    });
  });

  const picked = candidates[spec.index ?? 0] ?? null;

  if (!picked) {
    return null;
  }

  return spec.closest ? picked.closest(spec.closest) : picked;
};

export const AnchorSurface: React.FC<
  PropsWithChildren<{ designWidth: number }>
> = ({ children, designWidth }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measureEpoch, setMeasureEpoch] = useState(0);
  const [fontHandle] = useState(() =>
    delayRender("Waiting for fonts before measuring overlay anchors"),
  );

  useLayoutEffect(() => {
    let active = true;

    document.fonts.ready
      .then(() => {
        if (active) {
          setMeasureEpoch((epoch) => epoch + 1);
          continueRender(fontHandle);
        }
      })
      .catch((error: unknown) => cancelRender(error));

    return () => {
      active = false;
    };
  }, [fontHandle]);

  return (
    <AnchorContext.Provider value={{ containerRef, designWidth, measureEpoch }}>
      <div ref={containerRef} style={{ height: "100%", position: "relative" }}>
        {children}
      </div>
    </AnchorContext.Provider>
  );
};

/**
 * Measure an anchored element's rectangle in design-space units. Returns null
 * until the post-font measurement completes; cancels the render if the anchor
 * cannot be found, so a stale anchor fails verification instead of silently
 * highlighting the wrong element.
 */
const measureRect = ({
  container,
  designWidth,
  spec,
}: {
  container: HTMLElement;
  designWidth: number;
  spec: AnchorSpec;
}): AnchorRect => {
  const element = resolveAnchorElement(container, spec);

  if (!element) {
    throw new Error(
      `Overlay anchor not found in the rendered page: ${describeSpec(spec)}. ` +
        "Update the anchor spec; overlays never fall back to guessed geometry.",
    );
  }

  const containerBox = container.getBoundingClientRect();
  const elementBox = element.getBoundingClientRect();
  const scale = containerBox.width / designWidth;
  const x = (elementBox.left - containerBox.left) / scale;
  const y = (elementBox.top - containerBox.top) / scale;
  const width = elementBox.width / scale;
  const height = elementBox.height / scale;

  return { x, y, width, height, cx: x + width / 2, cy: y + height / 2 };
};

/**
 * Measure a single anchored element's rectangle in design-space units.
 * Returns null until the post-font measurement completes; cancels the render
 * if the anchor cannot be found, so a stale anchor fails verification instead
 * of silently highlighting the wrong element.
 */
export const useAnchorRect = (
  spec: AnchorSpec,
  enabled = true,
): AnchorRect | null => {
  return useAnchorRects([spec], enabled)[0] ?? null;
};

/**
 * Measure several anchors in one hook. Prefer this over calling
 * `useAnchorRect` from inside a loop or `.map()` — hooks cannot be called a
 * variable number of times per render, so an overlay with N waypoints (a
 * cursor path, for example) must resolve all N anchors through a single call.
 */
export const useAnchorRects = (
  specs: readonly AnchorSpec[],
  enabled = true,
): (AnchorRect | null)[] => {
  const context = useContext(AnchorContext);
  const [rects, setRects] = useState<(AnchorRect | null)[]>(() =>
    specs.map(() => null),
  );
  const specsKey = specs.map(describeSpec).join("|");
  const specsRef = useRef(specs);
  specsRef.current = specs;

  if (!context) {
    throw new Error("useAnchorRect must be used inside <AnchorSurface>");
  }

  const { containerRef, designWidth, measureEpoch } = context;

  useLayoutEffect(() => {
    // An anchor may target UI that only exists while its overlay is active
    // (for example a data-driven cell); skip resolution outside that window.
    if (measureEpoch === 0 || !enabled) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      cancelRender(new Error("AnchorSurface container is not mounted"));
      return;
    }

    try {
      setRects(
        specsRef.current.map((spec) => measureRect({ container, designWidth, spec })),
      );
    } catch (error) {
      cancelRender(error);
    }
  }, [containerRef, designWidth, enabled, measureEpoch, specsKey]);

  return rects;
};
