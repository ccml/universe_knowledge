export interface Astre {
  readonly id: string;
  /** Rayon moyen en kilomètres (NASA, fiches planétaires). */
  readonly rayonKm: number;
  readonly couleur: string;
}

export const SOLEIL: Astre = { id: 'soleil', rayonKm: 695_700, couleur: '#f2c45a' };

export const PLANETES: readonly Astre[] = [
  { id: 'mercure', rayonKm: 2_439.7, couleur: '#a39b91' },
  { id: 'venus', rayonKm: 6_051.8, couleur: '#e3c58f' },
  { id: 'terre', rayonKm: 6_371.0, couleur: '#5b8fd1' },
  { id: 'mars', rayonKm: 3_389.5, couleur: '#c8693f' },
  { id: 'jupiter', rayonKm: 69_911, couleur: '#d4a77a' },
  { id: 'saturne', rayonKm: 58_232, couleur: '#e2cc95' },
  { id: 'uranus', rayonKm: 25_362, couleur: '#9fd6dc' },
  { id: 'neptune', rayonKm: 24_622, couleur: '#5d79d8' },
];

export interface Cercle {
  readonly astre: Astre;
  readonly cx: number;
  readonly r: number;
}

export interface Disposition {
  readonly cercles: readonly Cercle[];
  readonly soleil?: Cercle;
  /** Rayon minimum affiché, pour que les plus petits astres restent visibles. */
  readonly agrandis: readonly string[];
}

const ECART = 14;
const BANDE_SOLEIL = 90;
const R_MIN = 4;

/**
 * Place des astres côte à côte, à la même échelle, dans un cadre largeur × hauteur.
 * Avec le Soleil, seul un arc de son disque est visible à gauche.
 */
export function disposer(
  astres: readonly Astre[],
  avecSoleil: boolean,
  largeur: number,
  hauteur: number,
): Disposition {
  const debut = avecSoleil ? BANDE_SOLEIL + ECART * 2 : ECART;
  const place = largeur - debut - ECART * astres.length;
  const sommeDiametres = astres.reduce((s, a) => s + 2 * a.rayonKm, 0);
  const plusGrand = Math.max(0, ...astres.map((a) => a.rayonKm));

  const echelles = [(hauteur - 2 * ECART) / (2 * (plusGrand || 1)), place / (sommeDiametres || 1)];
  const echelle = Math.min(...echelles);

  const agrandis: string[] = [];
  let x = debut;
  const cercles = astres.map((astre) => {
    let r = astre.rayonKm * echelle;
    if (r < R_MIN) {
      agrandis.push(astre.id);
      r = R_MIN;
    }
    const cercle = { astre, cx: x + r, r };
    x += 2 * r + ECART;
    return cercle;
  });

  // Sans le Soleil, la rangée de planètes est centrée dans le cadre.
  const decalage = avecSoleil ? 0 : (largeur - x) / 2;
  const centres = decalage ? cercles.map((c) => ({ ...c, cx: c.cx + decalage })) : cercles;

  const soleil = avecSoleil
    ? { astre: SOLEIL, r: SOLEIL.rayonKm * echelle, cx: BANDE_SOLEIL - SOLEIL.rayonKm * echelle }
    : undefined;

  return { cercles: centres, soleil, agrandis };
}
