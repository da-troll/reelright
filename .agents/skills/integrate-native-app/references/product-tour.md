# Producing a product tour

A registered native surface (direct-import or capture) is admission, not a
finished demo. When the user wants an actual product video — camera movement,
callouts, a narrated pace — use the `src/engine/tour/` toolkit rather than
hand-rolling positioning and timing per adapter. It exists because every part
of it was built to fix a real, user-visible defect once already; skipping it
reproduces those defects.

## Toolkit

```
src/engine/tour/
├── beat.ts       useBeat, fadeWindow
├── camera.ts     CameraKeyframe, cameraAt, cameraTransform
├── overlays.tsx  TourTheme, HighlightRing, TourCursor, TourCaption
└── cards.tsx     TourCard
```

A full tour composition typically looks like: camera pans over a scaled
native page, anchored highlight rings and cursor clicks, lower-third
captions, a title and end card, and native charts that grow through the
app's own aggregation as synthetic data accumulates. Build yours in
`adapters/<app-id>/demos/`, following this pattern.

## Overlay geometry must be DOM-anchored, never estimated

This is the single non-negotiable rule in this file. A hardcoded rectangle
(`{x: 732, y: 424, width: 648, height: 332}`) looks correct the day it's
written and breaks silently the next time fixtures, CSS, or the upstream app
change size — nothing crashes, nothing fails a gate, the overlay just points
at the wrong thing in the finished video. This happened in this project.

- Wrap the composition's page in `AnchorSurface` from `src/engine/anchors.tsx`
  and pass every `HighlightRing`/`TourCursor` an `AnchorSpec`
  (`{text, selector, closest, exact, index}`), not coordinates.
- A missing anchor cancels the render (`useAnchorRect`'s contract). Never
  catch that and fall back to a guess.
- Anchors that target data-dependent elements (a specific heatmap cell, a
  count that only exists once enough fixture data has accumulated) must pass
  `enabled` (or rely on the component's own `beat >= from && beat <= to`
  gating) so they aren't resolved outside the window where the target exists.
- Put the anchored beats in the adapter's `verification.surfaces[...].frames`
  so `app:verify` actually renders every anchored scene. An anchor that is
  never rendered by the gate can still silently break.

## Author the timeline in beats, render at a higher fps

Camera pans read as smooth judder-free motion only at 60fps or higher; a
pleasant tour timeline is much easier to author at 30fps. `useBeat(beatFps)`
converts the composition's actual `useCurrentFrame()`/`fps` into a fixed
30-unit timeline so every keyframe, caption window, and cursor waypoint is
authored once regardless of the composition's render fps declared in the
catalog.

**Every `spring()` call anywhere in the tour must pass `fps: beatFps`, not the
composition's real fps.** `useVideoConfig().fps` is the wrong value for a
spring driven by a beat number — it desyncs the spring's settling curve from
the timeline it's supposed to animate, producing wrong positions or scales
that are easy to miss in a spot-check and only show up as a pixel diff against
a known-good render. This exact mistake was made once refactoring this
toolkit; every overlay component in `src/engine/tour/` takes an explicit
`beatFps` prop (default `30`) for this reason — pass your adapter's actual
`BEAT_FPS` constant explicitly rather than relying on the default matching by
coincidence.

## Theme has two accent colors, not one

`TourTheme` has `accent` (rings, caption borders) and `accentSecondary`
(eyebrow text, cursor click-pulses) as two independent, required fields. Most
brand systems use two tones for exactly these two roles; collapsing them to
one field during a refactor is a real mistake that was made and caught by a
pixel diff against a known-good frame — the eyebrow and pulse rendered in the
wrong color, silently. Supply both from the app's actual brand values; do not
default `accentSecondary` to `accent`.

## Point the camera at anchors, not hand-picked coordinates

The same rule as highlight rings applies to the camera itself: a keyframe
written as `{frame, cx: 723, cy: 390, z: 1.3}` is exactly as fragile as a
hardcoded highlight rectangle, for the same reason (any layout change
silently reframes it wrong). Camera framing is more forgiving of small error
than a highlight — a slightly loose crop is not as jarring as a highlight on
the wrong element — which is why it's tolerable to ship without this at
first, but it should still be anchored before calling a tour finished.

Use `src/engine/tour/camera-anchors.ts`: `AnchoredCameraKeyframe` targets one
or more `AnchorSpec`s (the same specs used for `HighlightRing`) instead of a
point, and `fitBoundsToCamera` computes `{cx, cy, z}` by fitting the anchor's
measured box into the viewport with padding — the same `fitBounds` technique
mapping/imaging tools (Mapbox, OpenSeadragon) have used for years, and the
same "detect the target, frame its bounds" idea current screen-recording demo
tools (Screen Studio, Arcade, and similar, as of 2026) use for automatic
zoom, rather than a scale number picked by eye. A "fit the whole page"
pull-back is just an anchor on the page's own scope-root element
(`{selector: '[data-native-app="<app-id>"]'}`) with `padding: 0` — no
special case needed.

Render `AnchoredCameraRig` as a child of `AnchorSurface` (it needs anchor
context) and give it a `wrapperRef` pointing at the *ancestor* div the
transform should move — the div `AnchorSurface` itself is nested inside, not
an element inside it. A React child cannot declaratively set an ancestor's
style, so the rig writes the resolved transform into `wrapperRef.current`
imperatively inside a `useLayoutEffect`, before paint, the same
measure-then-position technique positioning libraries (Floating UI, Popper)
use. This is why the wrapper div must not also declare `style.transform` in
JSX — the rig owns that property exclusively.

## Grow native data through the app's own aggregation

For a "live data" scene, do not fake growth by interpolating chart values
directly — feed a growing slice of fixture input through the app's own pure
aggregation/selector function per frame (write a small per-adapter helper, commonly named something like
`chartsUpToDay`, that filters a widening slice of fixture data through the
input app's own aggregation function each frame). The native components then render real, self-consistent
derived data at every frame, including framework-level effects like a
day→week bucket-size switch, instead of an approximation that can visibly
disagree with what the same components compute from real data.

## After any refactor, diff against a known-good render

A tour composition's correctness is not covered by the delayed-determinism or
Webpack/Rspack gates alone — those two renders share the same code, so they
pass even when the code is confidently wrong (see the alpha, fps, and theme
mistakes above; all three passed both gates while looking wrong). Before
trusting a refactor of tour code:

1. Render one frame per active scene from the pre-refactor code and keep the
   PNGs.
2. Render the same frames post-refactor and pixel-diff (`pixelmatch`,
   `threshold: 0`) against the kept baseline.
3. Any non-zero diff is a real behavior change — locate it by sampling the
   differing pixel coordinates' RGB values in both images and reasoning about
   which style rule produces those colors, rather than guessing.

This is a stronger check than the mandatory delayed double-render diff:  it
catches wrong-but-consistent output, which the built-in gate cannot.
