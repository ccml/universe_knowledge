#!/usr/bin/env node
// Génère les données du site à partir du dossier contenu/.
//
//   node scripts/contenu.mjs           génère une fois ; échoue (code 1) si le contenu a un problème
//   node scripts/contenu.mjs --watch   régénère à chaque modification de contenu/ (développement)
//
// Sorties (ignorées par git) :
//   src/generated/contenu.ts              index des domaines, articles, glossaire, chargeurs
//   src/generated/articles/<d>/<a>.ts     HTML de chaque article (un chunk chargé à la demande)
//   public/sitemap.xml
//   public/contenu-images/                images référencées par les articles

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  rmSync,
  readdirSync,
  copyFileSync,
  watch,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collecterContenu, construireSitemap } from './contenu/lib.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENU = join(RACINE, 'contenu');
const GENERE = join(RACINE, 'src', 'generated');
const IMAGES = join(RACINE, 'public', 'contenu-images');
const ENTETE =
  '// Fichier généré par scripts/contenu.mjs à partir de contenu/ — ne pas modifier à la main.\n';

const lireJson = (chemin) => JSON.parse(readFileSync(join(RACINE, chemin), 'utf8'));

/** Écrit seulement si le contenu change, pour ne pas relancer inutilement ng serve. */
function ecrire(chemin, texte) {
  if (existsSync(chemin) && readFileSync(chemin, 'utf8') === texte) return false;
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, texte);
  return true;
}

function listerFichiers(dossier) {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name));
}

/** Supprime les fichiers générés qui ne correspondent plus à rien. */
function nettoyer(dossier, attendus) {
  for (const fichier of listerFichiers(dossier)) {
    if (!attendus.has(fichier)) rmSync(fichier);
  }
}

const js = (valeur) => JSON.stringify(valeur, null, 2);

export function generer() {
  const site = lireJson('site.config.json');
  const interactifs = lireJson('src/app/interactifs/interactifs.json');
  const contenu = collecterContenu(CONTENU, { interactifs });
  if (contenu.erreurs.length) return { ok: false, erreurs: contenu.erreurs };

  const attendus = new Set();
  const chargeurs = [];
  for (const a of contenu.articles) {
    const cle = `${a.domaine}/${a.slug}`;
    const chemin = join(GENERE, 'articles', a.domaine, `${a.slug}.ts`);
    attendus.add(chemin);
    ecrire(
      chemin,
      `${ENTETE}import type { ArticleCorps } from '../../../app/contenu/modeles';\n\n` +
        `const corps: ArticleCorps = ${js({ html: a.html, sections: a.sections })};\n\nexport default corps;\n`,
    );
    chargeurs.push(`  '${cle}': () => import('./articles/${cle}').then((m) => m.default),`);
  }
  nettoyer(join(GENERE, 'articles'), attendus);

  const resumes = contenu.articles.map(({ html, sections, ...resume }) => resume);
  ecrire(
    join(GENERE, 'contenu.ts'),
    `${ENTETE}import type { ArticleCorps, ArticleResume, Domaine, Glossaire } from '../app/contenu/modeles';\n\n` +
      `export const domaines: readonly Domaine[] = ${js(contenu.domaines)};\n\n` +
      `export const articles: readonly ArticleResume[] = ${js(resumes)};\n\n` +
      `export const glossaire: Glossaire = ${js(contenu.glossaire)};\n\n` +
      `export const chargeurs: Readonly<Record<string, () => Promise<ArticleCorps>>> = {\n${chargeurs.join('\n')}\n};\n`,
  );

  ecrire(join(RACINE, 'public', 'sitemap.xml'), construireSitemap(site.url, contenu));

  const imagesAttendues = new Set();
  for (const image of contenu.images) {
    const cible = join(IMAGES, image);
    imagesAttendues.add(cible);
    mkdirSync(dirname(cible), { recursive: true });
    copyFileSync(join(CONTENU, image), cible);
  }
  nettoyer(IMAGES, imagesAttendues);

  return { ok: true, domaines: contenu.domaines.length, articles: contenu.articles.length };
}

function executer() {
  const r = generer();
  if (r.ok) {
    console.log(`Contenu généré : ${r.domaines} domaines, ${r.articles} articles.`);
  } else {
    console.error(
      `Le contenu comporte ${r.erreurs.length} problème(s) :\n` +
        r.erreurs.map((e) => `  ✗ ${e}`).join('\n'),
    );
  }
  return r.ok;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ok = executer();
  if (process.argv.includes('--watch')) {
    console.log(`Surveillance de ${relative(process.cwd(), CONTENU) || 'contenu'}/…`);
    let minuteur;
    watch(CONTENU, { recursive: true }, () => {
      clearTimeout(minuteur);
      minuteur = setTimeout(executer, 150);
    });
  } else if (!ok) {
    process.exit(1);
  }
}
