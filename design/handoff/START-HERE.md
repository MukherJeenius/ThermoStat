# ThermoStat — frontend direction for backend integration

This is a design handoff, not a second website or a finished backend integration.

## Open in this order
1. `Mockup-1.png`: map workspace, floating navigation and facility overlay.
2. `Mockup-2.png`: evidence record and field-notes panel.
3. `01-Visual-Direction.pdf`: both mockups as editable vector artwork.
4. `02-Implementation-Guide.pdf`: visual rules, integration plan and acceptance checklist.
5. `code/`: reusable CSS, React component examples, TypeScript contract and deck.gl layer adapter.

## Direction
Inspired by the supplied Originle screenshots: warm paper surfaces, charcoal type, fine separators, generous padding, large but restrained corners, and occasional italic serif text. Amber signals attention. Avoid neon status badges, decorative metrics, glass gradients, oversized marketing headings and card-within-card layouts.

## Your friend's integration work
- Map existing API objects to `data-contract.ts`; these names do not prescribe backend routes.
- Pass the selected facility into `FacilityPanel`. Wire its two callbacks to existing evidence and notes flows.
- Feed only the selected facility's connections into `makeHeatLayers`.
- Import `tokens.css`, choose available project fonts, and mount panels inside the existing map shell.
- Keep loading/error/empty states and source dates visible; do not invent fallback metrics.
- Validate dependency versions against the existing repo. These examples are not compiled against your friend's codebase.

## Important distinctions
Map locations, routes, dates, excerpts and names in the artwork are illustrative. The city drawing is schematic, not Hamilton GIS data. A scenario is not an operational heat network. Missing evidence is not non-compliance. Notes are personal workflow state, not verified evidence. Backboard integration is the backend owner's responsibility.

## Deliverable status
Mockups and PDFs visually checked. Code is an integration scaffold, not a tested standalone app. Existing website files have not been restyled by this handoff.
