# Spectral release and public HTTPS diagnostics — 2026-09-12

The approved UI is merged into main through PR #10 at `0b4c4cb1b19d67ed917d478c9af982671dea1e60`. The production coordinator successfully activated this exact revision. The application and Nginx are active, certificate validation succeeds, and the API returns 62 questions and 27 term packages. The content hash is unchanged from the previous release:

`a3d8347bf37d3ee0199dc205347589ad5d9a67a2ebc770e1dc3334a0cca54757`

The rollback branch is `rollback/pre-spectral-20260912` at `77c69bc`. Local `D:/Desktop/CeptLens` now uses main. The earlier UI branches remain available.

## Workflow results

- Original Check failure: shared Lab manifest ordering differed between Windows and Linux. Deterministic sorting fixed it; subsequent full checks passed.
- Deprecated Node 20 action runtime: Check and Deploy now use `actions/checkout@v7.0.1` and `actions/setup-node@v7.0.0`, both using Node 24. Project builds still use the declared Node 22.18.0.
- Main Check: https://github.com/EchenQ928/ceptlens/actions/runs/34683295175 — success.
- Deploy: https://github.com/EchenQ928/ceptlens/actions/runs/34683295178 — activation succeeded; the final public HTTPS check failed with curl exit 35 (connection reset).
- Read-only server inspection: https://github.com/EchenQ928/ceptlens/actions/runs/34683587646 — success.

## Public access finding

Nginx configuration validates. HTTPS via both loopback and the public domain from the server returns 200 with normal certificate verification. The Let's Encrypt certificate covers ceptlens.com and www.ceptlens.com and expires on 2026-12-08.

The desktop and GitHub runner encounter a reset during the public TLS handshake. An external HTTP request to `http://ceptlens.com/` returns `403 Forbidden`, server `Beaver`, title `Non-compliance ICP Filing`, and an Alibaba Cloud filing-block page. This is evidence of a provider filing/access restriction on the tested routes, not an application or certificate failure. The owner reports that their own browser can still open the website; accessibility varies by route or request, so universal availability has not been established.

Check the domain's ICP filing and Alibaba Cloud access status in the owner's account. If already completed, supply these diagnostic results to Alibaba Cloud support. Do not suppress the public check or disable TLS verification to report a successful public rollout. The approved application release can remain active while the external restriction is resolved.

The diagnostic script only reads service status, selected Nginx routing directives, public certificate metadata and public API responses. It does not change firewall rules, certificates, account records or teaching content.
