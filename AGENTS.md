# AGENTS.md

FINDEBT PRO is a Google Apps Script web app. Treat `docs/` as the source of truth. Keep accounting logic in `src/domain`, never in HTML. Never hard-delete financial records, trust client calculations, or commit credentials. Before handoff run `npm run check` and update affected documentation.
