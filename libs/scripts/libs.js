/*
 * Federated runtime entry point — libs.js (aka aem.js in the spec).
 *
 * In the Libs Architecture, a consuming site's scripts.js loads THIS module to
 * get the shared runtime: area/section decoration, block loading, link/button
 * decoration, templates, etc. It is the `/libs/scripts/libs.js` node in the
 * da.live diagram (https://docs.da.live/media/libs-arch.pdf).
 *
 * For this POC the runtime implementation lives in /scripts/ak.js (kept there to
 * avoid churning its ~6 importers); this file is the stable, federated-facing
 * name that consuming sites import. Point a site at a different libs deployment
 * by fetching libs.js from that origin (see resolveLibsBase in libs-config.js).
 */

export * from '../../scripts/ak.js';
export { FEDERATED_BLOCKS, resolveLibsBase } from './libs-config.js';
