# Content Lab

The current Content Lab is a separate project in [`content-lab/`](../../content-lab/). Start it with:

```bash
cd content-lab
npm ci
npm start
```

Open http://127.0.0.1:8766/. Use the Lab to import or edit local question and term packages, run validation and builds, preview the result, and export a checked package. Upload the exported package through the production Content Manager at `/#/developer`.

The Lab does not publish directly and does not connect to production data. See [`INDEPENDENT_LAB.md`](INDEPENDENT_LAB.md) and [`content-lab/public/docs/LAB_GUIDE.md`](../../content-lab/public/docs/LAB_GUIDE.md).
