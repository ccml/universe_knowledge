import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  slugifier,
  typographie,
  validerArticle,
  validerDomaine,
  convertirMarkdown,
  collecterContenu,
  construireSitemap,
} from './lib.mjs';

const articleValide = {
  titre: 'Le Soleil',
  description: 'Notre étoile expliquée simplement.',
  niveau: 'decouverte',
  mise_a_jour: '2026-10-24',
};

describe('slugifier', () => {
  it('retire accents, majuscules et ponctuation', () => {
    expect(slugifier('Année-lumière')).toBe('annee-lumiere');
    expect(slugifier("L'œil du cyclone !")).toBe('l-oeil-du-cyclone');
  });
});

describe('typographie', () => {
  it('courbe les apostrophes et insère les espaces insécables', () => {
    expect(typographie("L'univers ? C'est vaste !")).toBe('L’univers\u202F? C’est vaste\u202F!');
    expect(typographie('« Big Bang » : un nom')).toBe('«\u202FBig Bang\u202F»\u00A0: un nom');
  });

  it('empêche la coupure dans les nombres et avant les unités', () => {
    expect(typographie('9 460 milliards')).toBe('9\u202F460 milliards');
    expect(typographie('70 % et 149,6 km')).toBe('70\u00A0% et 149,6\u00A0km');
    expect(typographie('en 2026 les étoiles')).toBe('en 2026 les étoiles');
  });

  it('ne touche pas aux deux-points sans espace', () => {
    expect(typographie('à 10:30')).toBe('à 10:30');
  });
});

describe('validerArticle', () => {
  it('accepte un front matter complet', () => {
    expect(validerArticle(articleValide)).toEqual([]);
    expect(validerArticle({ ...articleValide, mise_a_jour: new Date('2026-10-24') })).toEqual([]);
  });

  it('signale chaque champ obligatoire manquant', () => {
    const erreurs = validerArticle({});
    expect(erreurs.join('\n')).toMatch(/titre/);
    expect(erreurs.join('\n')).toMatch(/description/);
    expect(erreurs.join('\n')).toMatch(/niveau/);
    expect(erreurs.join('\n')).toMatch(/mise_a_jour/);
  });

  it('refuse une description trop longue et un niveau inconnu', () => {
    const erreurs = validerArticle({
      ...articleValide,
      description: 'x'.repeat(201),
      niveau: 'expert',
    });
    expect(erreurs).toHaveLength(2);
  });
});

describe('validerDomaine', () => {
  it('exige titre, description, symbole connu et ordre', () => {
    expect(validerDomaine({ titre: 'A', description: 'B', symbole: 'soleil', ordre: 1 })).toEqual(
      [],
    );
    expect(validerDomaine({ titre: 'A', description: 'B', symbole: 'lune' })).toHaveLength(2);
  });
});

describe('convertirMarkdown', () => {
  const termes = new Map([
    ['annee-lumiere', { texte: 'Distance parcourue par la lumière en un an.' }],
  ]);
  const routes = new Set(['/', '/glossaire', '/cosmologie/big-bang']);
  const options = { termes, routes, interactifs: new Set(['echelle-planetes']) };

  it('convertit le Markdown et relève les intertitres', () => {
    const r = convertirMarkdown('## Une étoile\n\nDu **texte**.\n\n## Deux', options);
    expect(r.erreurs).toEqual([]);
    expect(r.html).toContain('<h2 id="une-etoile">Une étoile</h2>');
    expect(r.html).toContain('<strong>texte</strong>');
    expect(r.sections).toEqual([
      { id: 'une-etoile', titre: 'Une étoile' },
      { id: 'deux', titre: 'Deux' },
    ]);
  });

  it('transforme :::a-retenir en encadré titré', () => {
    const r = convertirMarkdown(':::a-retenir\n- Point clé\n:::', options);
    expect(r.erreurs).toEqual([]);
    expect(r.html).toMatch(/^<aside class="a-retenir"><p class="bloc-titre">À retenir<\/p>/);
    expect(r.html).toContain('<li>Point clé</li>');
  });

  it('prend le libellé de :::encadre comme titre', () => {
    const r = convertirMarkdown(':::encadre[Le saviez-vous ?]\nTexte.\n:::', options);
    expect(r.html).toContain(
      '<aside class="encadre"><p class="bloc-titre">Le saviez-vous\u202F?</p>',
    );
  });

  it('transforme :::frise en bloc du texte, sans titre', () => {
    const r = convertirMarkdown(':::frise\n- **Il y a 4,6 milliards d’années** Le Soleil\n:::', options);
    expect(r.erreurs).toEqual([]);
    expect(r.html).toMatch(/^<div class="frise"><ul>/);
  });

  it('relie :terme au glossaire, avec la définition en info-bulle', () => {
    const r = convertirMarkdown('À 4 :terme[années-lumière]{#annee-lumiere} de nous.', options);
    expect(r.erreurs).toEqual([]);
    expect(r.html).toContain(
      '<a href="/glossaire#annee-lumiere" class="terme" title="Distance parcourue par la lumière en un an.">années-lumière</a>',
    );
  });

  it('déduit l’identifiant du terme de son libellé', () => {
    const r = convertirMarkdown(':terme[Année-lumière]', options);
    expect(r.erreurs).toEqual([]);
  });

  it('signale un terme absent du glossaire, avec la ligne', () => {
    const r = convertirMarkdown('Ligne 1\n\nUn :terme[quasar].', { ...options, fichier: 'a.md' });
    expect(r.erreurs).toEqual(['a.md:3 — terme « quasar » absent du glossaire']);
  });

  it('insère un emplacement pour un composant interactif connu', () => {
    const r = convertirMarkdown('::composant{nom=echelle-planetes}', options);
    expect(r.erreurs).toEqual([]);
    expect(r.html).toContain('<div class="interactif" data-interactif="echelle-planetes">');
  });

  it('refuse un composant ou une directive inconnus', () => {
    expect(convertirMarkdown('::composant{nom=orrery}', options).erreurs[0]).toMatch(/orrery/);
    expect(convertirMarkdown(':::attention\nx\n:::', options).erreurs[0]).toMatch(/attention/);
  });

  it('laisse intact un deux-points suivi d’un mot', () => {
    const r = convertirMarkdown('Voir le ratio 3:deux.', options);
    expect(r.erreurs).toEqual([]);
    expect(r.html).toBe('<p>Voir le ratio 3:deux.</p>');
  });

  it('vérifie les liens internes', () => {
    expect(convertirMarkdown('[ok](/cosmologie/big-bang)', options).erreurs).toEqual([]);
    expect(convertirMarkdown('[ok](/glossaire#annee-lumiere)', options).erreurs).toEqual([]);
    expect(convertirMarkdown('[ko](/cosmologie/inflation)', options).erreurs[0]).toMatch(
      /n'existe pas/,
    );
    expect(convertirMarkdown('[ko](/glossaire#parsec)', options).erreurs[0]).toMatch(/parsec/);
    expect(convertirMarkdown('[ko](big-bang.md)', options).erreurs[0]).toMatch(/chemin absolu/);
  });

  it('marque les liens externes', () => {
    const r = convertirMarkdown('[NASA](https://science.nasa.gov)', options);
    expect(r.html).toContain(
      '<a href="https://science.nasa.gov" rel="noopener" class="externe">NASA</a>',
    );
  });

  it('exige un texte alternatif pour les images', () => {
    expect(convertirMarkdown('![](https://exemple.org/a.webp)', options).erreurs[0]).toMatch(
      /texte alternatif/,
    );
  });
});

describe('collecterContenu', () => {
  let racine;
  const ecrire = (chemin, texte) => {
    const complet = join(racine, chemin);
    mkdirSync(join(complet, '..'), { recursive: true });
    writeFileSync(complet, texte);
  };
  const fm = (champs) =>
    `---\n${Object.entries(champs)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')}\n---\n`;

  beforeEach(() => {
    racine = join(mkdtempSync(join(tmpdir(), 'contenu-')), 'contenu');
    ecrire(
      'systeme-solaire/index.md',
      fm({ titre: 'Système solaire', description: 'Chez nous.', symbole: 'soleil', ordre: 1 }) +
        'Intro.',
    );
    ecrire(
      'systeme-solaire/le-soleil.md',
      fm({
        titre: 'Le Soleil',
        description: 'Notre étoile.',
        niveau: 'decouverte',
        mise_a_jour: '2026-10-01',
        ordre: 2,
      }) + '## Une étoile\n\nVoir [Mars](/systeme-solaire/mars) et :terme[ua].',
    );
    ecrire(
      'systeme-solaire/mars.md',
      fm({
        titre: 'Mars',
        description: 'La planète rouge.',
        niveau: 'decouverte',
        mise_a_jour: '2026-10-20',
        ordre: 1,
      }) + 'Texte.',
    );
    ecrire('systeme-solaire/brouillon.md', fm({ titre: 'Pas fini', brouillon: true }) + 'Texte.');
    ecrire(
      'glossaire.md',
      '---\ntitre: Glossaire\ndescription: Les mots.\ntermes:\n  - terme: ua\n    definition: Unité *astronomique*.\n---\n',
    );
  });

  afterEach(() => rmSync(join(racine, '..'), { recursive: true, force: true }));

  it('produit domaines, articles triés et glossaire, sans les brouillons', () => {
    const r = collecterContenu(racine);
    expect(r.erreurs).toEqual([]);
    expect(r.domaines).toHaveLength(1);
    expect(r.domaines[0]).toMatchObject({
      slug: 'systeme-solaire',
      symbole: 'soleil',
      introHtml: '<p>Intro.</p>',
    });
    expect(r.articles.map((a) => a.slug)).toEqual(['mars', 'le-soleil']);
    expect(r.articles[1]).toMatchObject({ miseAJour: '2026-10-01', minutesLecture: 1 });
    expect(r.articles[1].sections).toEqual([{ id: 'une-etoile', titre: 'Une étoile' }]);
    expect(r.glossaire.termes).toEqual([
      { id: 'ua', terme: 'ua', definitionHtml: '<p>Unité <em>astronomique</em>.</p>' },
    ]);
  });

  it('rassemble tous les problèmes avec le nom du fichier', () => {
    ecrire('cosmologie/index.md', fm({ titre: 'Cosmologie' }));
    ecrire('cosmologie/Big Bang.md', fm({ titre: 'Big Bang' }));
    const r = collecterContenu(racine);
    expect(
      r.erreurs.some((e) => e.startsWith('contenu/cosmologie/index.md — champ « description »')),
    ).toBe(true);
    expect(
      r.erreurs.some((e) => e.startsWith('contenu/cosmologie/Big Bang.md — nom de fichier')),
    ).toBe(true);
    expect(
      r.erreurs.some((e) => e.startsWith('contenu/cosmologie/Big Bang.md — champ « niveau »')),
    ).toBe(true);
  });
});

describe('construireSitemap', () => {
  it('liste toutes les pages avec leur date de mise à jour', () => {
    const xml = construireSitemap('https://exemple.org/', {
      domaines: [{ slug: 'cosmologie' }],
      articles: [
        { domaine: 'cosmologie', slug: 'big-bang', miseAJour: '2026-09-01' },
        { domaine: 'cosmologie', slug: 'matiere-noire', miseAJour: '2026-10-01' },
      ],
    });
    expect(xml).toContain('<loc>https://exemple.org/</loc>\n    <lastmod>2026-10-01</lastmod>');
    expect(xml).toContain(
      '<loc>https://exemple.org/cosmologie</loc>\n    <lastmod>2026-10-01</lastmod>',
    );
    expect(xml).toContain(
      '<loc>https://exemple.org/cosmologie/big-bang</loc>\n    <lastmod>2026-09-01</lastmod>',
    );
    expect(xml).toContain('<loc>https://exemple.org/glossaire</loc>');
  });
});
