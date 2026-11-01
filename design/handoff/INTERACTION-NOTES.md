# Interaction handoff

| User action | Frontend behaviour | Integration input |
| --- | --- | --- |
| Select facility | Replace record panel, highlight marker, move camera with safe padding | Facility ID and coordinates |
| Expand evidence row | Reveal summary, status, excerpt and source link | Commitment + source record |
| Open source | Open original HTTPS document in a new tab | URL, page, document and retrieval dates |
| Toggle connections | Hide arcs AND endpoint dots | Existing connection collection |
| Click connection | Show recipient name and explicitly labelled connection kind | HeatConnection ID |
| Open notes | Replace the record panel; do not pile large panels on top of each other | Facility ID and existing note |
| Save note | Show saving state, then confirmed saved/error state | Existing private note persistence |
| Change facility | Resolve unsaved note edits before switching away | Dirty state + chosen action |
| Narrow viewport | Collapse rail, show one bottom sheet, preserve map attribution | Existing viewport/layout system |

## Map selection policy
Show only the selected facility's connections initially. Fade secondary geometry and limit arc clutter. Never use line thickness to imply actual capacity without a real metric and unit. Provide a visible legend and a text route to every connection; colour or map picking alone must not be the only route.

## Panel lifecycle
One primary panel at a time: facility -> source evidence -> field notes. Keep a visible way back to the facility. Dialog mode traps keyboard focus and restores it on close. An ordinary non-modal map card must not trap focus. Use semantic details/summary or a tested accordion component. Add aria-busy to loading content and an accessible status message after save/error.

## Backend boundaries
Avoid API calls inside the visual component. Use a parent adapter to fetch, normalise and validate incoming data. Render backend-derived strings as React text, never raw HTML. Reject unsupported URL schemes. Notes must not be published as verified findings. Unknown values remain null/unknown, not zero or invented examples.
