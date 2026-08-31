# Next.js App Router proof

This adapter imports unchanged UI from Vercel's Next.js App Router Playground
at commit `cd0363f3aefd4f4b50ee1b7655feefcc04695f4c`.

It exercises app-owned React, App Router client boundaries, conservative
`next/image`, `next/link`, `next/navigation`, and `next/font` shims, Tailwind v4
scoped compilation, a contained portal host, and an adapter-native widget inside
the builder's `ChatSequence`.

The selected UI is admitted at compatibility rung 2. Server-only and async
Server Component files are inventoried by preflight but excluded from the
reachable client graph; the database import used for types is redirected to a
fixture-only adapter shim.

The adapter also proves compatibility rung 3 with two native `/layouts`
captures. `layouts-navigation` emits an eight-frame DPR-2 PNG sequence;
`layouts-video` emits a DPR-2 VP9 recording. Both exercise a persistent client
counter and nested App Router navigation while recording interaction bounds for
Remotion cursor, highlight, and callout overlays.

The generated capture assets are intentionally ignored and must be regenerated
on the machine or CI image that renders them. Exact pixel gates compare outputs
from the same rendering environment; they do not promise cross-OS font or
browser rasterization identity.
