# Input applications

Clone or copy one source application into each child directory:

```bash
git clone <repository-url> input/<app-id>
```

User-provided applications below `input/` are ignored by the builder
repository. `input/vite-proof` is the sole tracked exception because it is the
reproducible Phase 1 test fixture. Treat other input applications as source
material: durable Remotion integration code belongs in `adapters/<app-id>/`,
not in the cloned application.

Do not copy secrets or local environment files from an input application into
the builder.
