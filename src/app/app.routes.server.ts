import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { articles, domaines } from '../generated/contenu';

/**
 * Toutes les pages de contenu sont prérendues au build, à partir de la liste
 * générée par scripts/contenu.mjs. Les adresses inconnues sont rendues à la
 * demande par le serveur, avec un statut 404.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'glossaire', renderMode: RenderMode.Prerender },
  {
    path: ':domaine',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Server,
    getPrerenderParams: async () => domaines.map((d) => ({ domaine: d.slug })),
  },
  {
    path: ':domaine/:article',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Server,
    getPrerenderParams: async () => articles.map((a) => ({ domaine: a.domaine, article: a.slug })),
  },
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
