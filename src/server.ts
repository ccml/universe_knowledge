import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/** Fichiers produits par le build avec une empreinte dans leur nom (main-D7WA7OIS.js…). */
const fichierEmpreinte = /-[A-Za-z0-9_-]{8}\.(js|css)$/;

/** Fichiers statiques : cache long pour les fichiers à empreinte, revalidation pour le reste. */
app.use(
  express.static(browserDistFolder, {
    index: false,
    redirect: false,
    setHeaders: (res, chemin) => {
      res.setHeader(
        'Cache-Control',
        fichierEmpreinte.test(chemin)
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=0, must-revalidate',
      );
    },
  }),
);

/** Le reste (adresses inconnues → 404) est rendu à la demande par Angular. */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/** Démarre le serveur sur le port PORT (4000 par défaut). */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/** Utilisé par la CLI Angular (ng serve et prérendu). */
export const reqHandler = createNodeRequestHandler(app);
