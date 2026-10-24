// Conversion du contenu Markdown (dossier contenu/) en données pour le site Angular.
// Fonctions pures, sans écriture sur disque : testées par contenu.test.mjs.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve, posix, sep } from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { toString as mdastToString } from 'mdast-util-to-string';
import { toString as hastToString } from 'hast-util-to-string';

export const NIVEAUX = ['decouverte', 'intermediaire'];
export const SYMBOLES = ['soleil', 'etoile', 'spirale', 'sablier'];
const MOTS_PAR_MINUTE = 200;

/** « Année-lumière » → « annee-lumiere ». */
export function slugifier(texte) {
  return String(texte)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function dateIso(valeur) {
  if (valeur instanceof Date && !Number.isNaN(valeur.getTime())) {
    return valeur.toISOString().slice(0, 10);
  }
  if (typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
    return valeur;
  }
  return null;
}

function chaineNonVide(valeur) {
  return typeof valeur === 'string' && valeur.trim().length > 0;
}

/** Vérifie le front matter d'un article. Renvoie la liste des problèmes. */
export function validerArticle(fm) {
  const erreurs = [];
  if (!chaineNonVide(fm.titre)) erreurs.push('champ « titre » manquant');
  if (!chaineNonVide(fm.description)) {
    erreurs.push('champ « description » manquant (sert au référencement)');
  } else if (fm.description.length > 200) {
    erreurs.push(`« description » trop longue (${fm.description.length} caractères, 200 au plus)`);
  }
  if (!NIVEAUX.includes(fm.niveau)) {
    erreurs.push(`champ « niveau » attendu parmi : ${NIVEAUX.join(', ')}`);
  }
  if (!dateIso(fm.mise_a_jour)) {
    erreurs.push('champ « mise_a_jour » manquant ou invalide (format AAAA-MM-JJ)');
  }
  if (
    fm.mots_cles !== undefined &&
    !(Array.isArray(fm.mots_cles) && fm.mots_cles.every(chaineNonVide))
  ) {
    erreurs.push('« mots_cles » doit être une liste de textes');
  }
  if (fm.ordre !== undefined && !Number.isFinite(fm.ordre)) {
    erreurs.push('« ordre » doit être un nombre');
  }
  return erreurs;
}

/**
 * Typographie française : apostrophe courbe, espaces insécables avant « ; : ! ? »
 * et à l'intérieur des guillemets, pour éviter qu'un signe se retrouve seul en début de ligne.
 */
export function typographie(texte) {
  if (typeof texte !== 'string') return texte;
  return (
    texte
      .replace(/(\p{L})'/gu, '$1’')
      .replace(/ ([?!;»])/g, '\u202F$1')
      .replace(/« /g, '«\u202F')
      .replace(/ :(?=\s|$)/g, '\u00A0:')
      // Nombres : « 9 460 milliards », « 70 % », « −270 °C », « 30 ua » ne se coupent pas.
      .replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u202F')
      .replace(/(\d) (?=%|°|(?:km|ua|K|ans?)(?![\p{L}]))/gu, '$1\u00A0')
  );
}

/** Applique la typographie française aux textes (pas au code ni aux URL). */
function remarkTypographie() {
  return (tree) => {
    visit(tree, 'text', (node) => {
      node.value = typographie(node.value);
    });
  };
}

/** Vérifie le front matter d'une page de domaine (index.md). */
export function validerDomaine(fm) {
  const erreurs = [];
  if (!chaineNonVide(fm.titre)) erreurs.push('champ « titre » manquant');
  if (!chaineNonVide(fm.description)) erreurs.push('champ « description » manquant');
  if (!SYMBOLES.includes(fm.symbole)) {
    erreurs.push(`champ « symbole » attendu parmi : ${SYMBOLES.join(', ')}`);
  }
  if (!Number.isFinite(fm.ordre)) erreurs.push('champ « ordre » (nombre) manquant');
  return erreurs;
}

/**
 * Plugin remark : directives maison, liens internes et images.
 * Les problèmes sont ajoutés à ctx.erreurs avec le numéro de ligne.
 */
function remarkUnivers(ctx) {
  return (tree) => {
    const signaler = (node, message) =>
      ctx.erreurs.push(`${ctx.fichier}:${node.position?.start.line ?? '?'} — ${message}`);

    visit(tree, (node, index, parent) => {
      switch (node.type) {
        case 'containerDirective':
          return containerDirective(node, signaler);
        case 'leafDirective':
          return leafDirective(node, signaler);
        case 'textDirective':
          return textDirective(node, index, parent, signaler);
        case 'link':
          return lien(node, signaler);
        case 'image':
          return image(node, signaler);
      }
    });

    function containerDirective(node, signaler) {
      const libelle = node.children[0]?.data?.directiveLabel ? node.children.shift() : null;
      const titreParDefaut = { 'a-retenir': 'À retenir', encadre: null, frise: null }[node.name];
      if (!(node.name in { 'a-retenir': 1, encadre: 1, frise: 1 })) {
        signaler(node, `bloc « :::${node.name} » inconnu (connus : a-retenir, encadre, frise)`);
        return;
      }
      const titre = libelle ? mdastToString(libelle) : titreParDefaut;
      if (titre) {
        node.children.unshift({
          type: 'paragraph',
          data: { hProperties: { className: ['bloc-titre'] } },
          children: [{ type: 'text', value: titre }],
        });
      }
      // La frise fait partie du texte, les encadrés sont en marge.
      const balise = node.name === 'frise' ? 'div' : 'aside';
      node.data = { hName: balise, hProperties: { className: [node.name] } };
    }

    function leafDirective(node, signaler) {
      if (node.name !== 'composant') {
        signaler(node, `directive « ::${node.name} » inconnue (connue : composant)`);
        return;
      }
      const nom = node.attributes?.nom;
      if (!ctx.interactifs.has(nom)) {
        signaler(
          node,
          `composant interactif « ${nom ?? ''} » inconnu (connus : ${[...ctx.interactifs].join(', ')})`,
        );
        return;
      }
      node.data = {
        hName: 'div',
        hProperties: { className: ['interactif'], dataInteractif: nom },
      };
      node.children = [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Contenu interactif : activez JavaScript pour l’afficher.' },
          ],
        },
      ];
    }

    function textDirective(node, index, parent, signaler) {
      if (node.name !== 'terme') {
        // Un « :mot » dans le texte n'est probablement pas une directive : on le rend tel quel.
        const nu = node.children.length === 0 && Object.keys(node.attributes ?? {}).length === 0;
        if (nu) {
          parent.children[index] = { type: 'text', value: `:${node.name}` };
          return;
        }
        signaler(node, `directive « :${node.name} » inconnue (connue : terme)`);
        return;
      }
      const libelle = mdastToString(node);
      const id = node.attributes?.id || slugifier(libelle);
      const terme = ctx.termes.get(id);
      if (!terme) {
        signaler(node, `terme « ${id} » absent du glossaire`);
        return;
      }
      node.data = {
        hName: 'a',
        hProperties: { href: `/glossaire#${id}`, className: ['terme'], title: terme.texte },
      };
    }

    function lien(node, signaler) {
      if (/^https?:\/\//.test(node.url)) {
        node.data = { hProperties: { rel: 'noopener', className: ['externe'] } };
        return;
      }
      if (node.url.startsWith('/')) {
        const [chemin, ancre] = node.url.split('#');
        const route = chemin.replace(/\/$/, '') || '/';
        if (!ctx.routes.has(route)) {
          signaler(node, `lien interne vers « ${node.url} » : cette page n'existe pas`);
        } else if (ancre && route === '/glossaire' && !ctx.termes.has(ancre)) {
          signaler(node, `lien vers le terme « ${ancre} » absent du glossaire`);
        }
        return;
      }
      if (node.url.startsWith('#')) return;
      signaler(
        node,
        `lien « ${node.url} » : utiliser un chemin absolu (/domaine/article) ou une URL https://`,
      );
    }

    function image(node, signaler) {
      if (!chaineNonVide(node.alt)) {
        signaler(node, `image « ${node.url} » sans texte alternatif`);
      }
      if (/^https?:\/\//.test(node.url) || node.url.startsWith('/')) return;
      const source = resolve(dirname(ctx.chemin), node.url);
      if (!existsSync(source)) {
        signaler(node, `image « ${node.url} » introuvable`);
        return;
      }
      const relatif = relative(ctx.racine, source).split(sep).join(posix.sep);
      ctx.images.add(relatif);
      node.url = `/contenu-images/${relatif}`;
      node.data = { hProperties: { loading: 'lazy', decoding: 'async' } };
    }
  };
}

/** Plugin rehype : ancres sans accents sur h2/h3, et relevé des h2 pour la table des matières. */
function rehypeSections(ctx) {
  return (tree) => {
    const vus = new Map();
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return;
      const titre = hastToString(node);
      const base = slugifier(titre) || 'section';
      const n = vus.get(base) ?? 0;
      vus.set(base, n + 1);
      const id = n ? `${base}-${n}` : base;
      node.properties = { ...node.properties, id };
      if (node.tagName === 'h2') ctx.sections.push({ id, titre });
    });
  };
}

/**
 * Convertit un texte Markdown en HTML.
 * @param {string} markdown
 * @param {{ fichier?: string, chemin?: string, racine?: string, termes?: Map<string, {texte: string}>,
 *           routes?: Set<string>, interactifs?: Set<string> }} options
 */
export function convertirMarkdown(markdown, options = {}) {
  const ctx = {
    fichier: options.fichier ?? '(texte)',
    chemin: options.chemin ?? '.',
    racine: options.racine ?? '.',
    termes: options.termes ?? new Map(),
    routes: options.routes ?? new Set(),
    interactifs: options.interactifs ?? new Set(),
    erreurs: [],
    sections: [],
    images: new Set(),
  };
  const processeur = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkUnivers, ctx)
    .use(remarkTypographie)
    .use(remarkRehype)
    .use(rehypeSections, ctx)
    .use(rehypeStringify);
  const arbre = processeur.parse(markdown);
  const mots = mdastToString(arbre).split(/\s+/).filter(Boolean).length;
  const html = String(processeur.processSync(markdown)).trim();
  return { html, sections: ctx.sections, erreurs: ctx.erreurs, images: ctx.images, mots };
}

/** Texte brut d'un court extrait Markdown (pour l'attribut title des termes). */
export function texteBrut(markdown) {
  return mdastToString(unified().use(remarkParse).parse(markdown)).replace(/\s+/g, ' ').trim();
}

function lireMarkdown(chemin) {
  // gray-matter met en cache par contenu : on copie le résultat pour ne rien partager.
  const { data, content } = matter(readFileSync(chemin, 'utf8'));
  return { fm: { ...data }, corps: content };
}

/**
 * Lit tout le dossier contenu/ et produit les données du site.
 * @param {string} racine Dossier contenu/.
 * @param {{ interactifs: string[] }} options
 */
export function collecterContenu(racine, { interactifs = [] } = {}) {
  const erreurs = [];
  const nomFichier = (chemin) => relative(dirname(racine), chemin).split(sep).join(posix.sep);
  const images = new Set();

  // 1er passage : front matter, routes et termes, nécessaires pour valider les liens.
  const domainesBruts = [];
  for (const entree of readdirSync(racine).sort()) {
    const dossier = join(racine, entree);
    if (!statSync(dossier).isDirectory() || entree === 'images') continue;
    const index = join(dossier, 'index.md');
    if (!existsSync(index)) {
      erreurs.push(`${nomFichier(dossier)} — dossier de domaine sans index.md`);
      continue;
    }
    if (slugifier(entree) !== entree) {
      erreurs.push(
        `${nomFichier(dossier)} — nom de dossier à écrire en minuscules, sans accents, avec des tirets`,
      );
    }
    const domaine = { slug: entree, chemin: index, ...lireMarkdown(index), articles: [] };
    for (const p of validerDomaine(domaine.fm)) erreurs.push(`${nomFichier(index)} — ${p}`);
    for (const fichier of readdirSync(dossier).sort()) {
      if (!fichier.endsWith('.md') || fichier === 'index.md') continue;
      const chemin = join(dossier, fichier);
      const slug = fichier.replace(/\.md$/, '');
      if (slugifier(slug) !== slug) {
        erreurs.push(
          `${nomFichier(chemin)} — nom de fichier à écrire en minuscules, sans accents, avec des tirets`,
        );
      }
      const article = { slug, chemin, ...lireMarkdown(chemin) };
      if (article.fm.brouillon === true) continue;
      for (const p of validerArticle(article.fm)) erreurs.push(`${nomFichier(chemin)} — ${p}`);
      domaine.articles.push(article);
    }
    domainesBruts.push(domaine);
  }

  const cheminGlossaire = join(racine, 'glossaire.md');
  const glossaireBrut = existsSync(cheminGlossaire)
    ? lireMarkdown(cheminGlossaire)
    : { fm: { termes: [] }, corps: '' };
  const termes = new Map();
  for (const [i, t] of (glossaireBrut.fm.termes ?? []).entries()) {
    if (!chaineNonVide(t?.terme) || !chaineNonVide(t?.definition)) {
      erreurs.push(
        `contenu/glossaire.md — terme n° ${i + 1} : « terme » et « definition » sont obligatoires`,
      );
      continue;
    }
    const id = t.id ?? slugifier(t.terme);
    if (termes.has(id)) erreurs.push(`contenu/glossaire.md — terme « ${id} » en double`);
    termes.set(id, {
      id,
      terme: t.terme,
      definitionMd: t.definition,
      texte: typographie(texteBrut(t.definition)),
    });
  }

  const routes = new Set(['/', '/glossaire']);
  for (const d of domainesBruts) {
    routes.add(`/${d.slug}`);
    for (const a of d.articles) routes.add(`/${d.slug}/${a.slug}`);
  }

  // 2e passage : conversion en HTML.
  const options = { racine, termes, routes, interactifs: new Set(interactifs) };
  const convertir = (corps, chemin) => {
    const r = convertirMarkdown(corps, { ...options, chemin, fichier: nomFichier(chemin) });
    erreurs.push(...r.erreurs);
    r.images.forEach((img) => images.add(img));
    return r;
  };

  const domaines = [];
  const articles = [];
  for (const d of domainesBruts) {
    domaines.push({
      slug: d.slug,
      titre: typographie(d.fm.titre),
      description: typographie(d.fm.description),
      symbole: d.fm.symbole,
      ordre: d.fm.ordre,
      introHtml: convertir(d.corps, d.chemin).html,
    });
    const tries = [...d.articles].sort(
      (a, b) =>
        (a.fm.ordre ?? Infinity) - (b.fm.ordre ?? Infinity) ||
        String(a.fm.titre).localeCompare(String(b.fm.titre), 'fr'),
    );
    for (const a of tries) {
      const r = convertir(a.corps, a.chemin);
      articles.push({
        domaine: d.slug,
        slug: a.slug,
        titre: typographie(a.fm.titre),
        description: typographie(a.fm.description),
        niveau: a.fm.niveau,
        miseAJour: dateIso(a.fm.mise_a_jour),
        motsCles: a.fm.mots_cles ?? [],
        minutesLecture: Math.max(1, Math.round(r.mots / MOTS_PAR_MINUTE)),
        html: r.html,
        sections: r.sections,
      });
    }
  }
  domaines.sort((a, b) => a.ordre - b.ordre);

  const glossaire = {
    titre: typographie(glossaireBrut.fm.titre ?? 'Glossaire'),
    description: typographie(glossaireBrut.fm.description ?? ''),
    introHtml: convertir(glossaireBrut.corps, cheminGlossaire).html,
    termes: [...termes.values()]
      .map((t) => ({
        id: t.id,
        terme: typographie(t.terme),
        definitionHtml: convertir(t.definitionMd, cheminGlossaire).html,
      }))
      .sort((a, b) => a.terme.localeCompare(b.terme, 'fr')),
  };

  return { domaines, articles, glossaire, images: [...images].sort(), erreurs };
}

function echapperXml(texte) {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Construit le sitemap.xml à partir des données du site. */
export function construireSitemap(urlSite, { domaines, articles }) {
  const base = urlSite.replace(/\/$/, '');
  const plusRecente = (liste) =>
    liste
      .map((a) => a.miseAJour)
      .sort()
      .at(-1);
  const entrees = [
    { chemin: '/', lastmod: plusRecente(articles), priorite: '1.0' },
    ...domaines.map((d) => ({
      chemin: `/${d.slug}`,
      lastmod: plusRecente(articles.filter((a) => a.domaine === d.slug)),
      priorite: '0.8',
    })),
    ...articles.map((a) => ({
      chemin: `/${a.domaine}/${a.slug}`,
      lastmod: a.miseAJour,
      priorite: '0.7',
    })),
    { chemin: '/glossaire', lastmod: plusRecente(articles), priorite: '0.5' },
  ];
  const urls = entrees
    .map(
      (e) =>
        `  <url>\n    <loc>${echapperXml(base + e.chemin)}</loc>\n` +
        (e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : '') +
        `    <priority>${e.priorite}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
