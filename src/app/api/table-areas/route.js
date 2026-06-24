/**
 * Table areas API — lives at /api/table-areas (not /api/tables/areas).
 * Next.js matches /api/tables/areas to /api/tables/[id] with id="areas", causing 404 HTML.
 */
export { GET, POST } from "../tables/areas/route.js";
