/** Âge de l'univers retenu (estimation de la mission Planck, arrondie), en années. */
export const AGE_UNIVERS = 13.8e9;

/** Une année cosmique de 365 jours, en secondes. */
export const ANNEE_COSMIQUE_S = 365 * 86_400;

const JOURS_PAR_MOIS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MINUTE_EN_ANNEES = 1 / (365.25 * 24 * 60);

export type Ere = 'cosmos' | 'vie' | 'humanite';

export interface Evenement {
  /** Clé des libellés dans fr.json (evenements.<id>). */
  readonly id: string;
  readonly ere: Ere;
  /** Ancienneté, en années avant aujourd'hui. */
  readonly anneesAvant: number;
}

export const ERES: readonly Ere[] = ['cosmos', 'vie', 'humanite'];

export const EVENEMENTS: readonly Evenement[] = [
  { id: 'bigBang', ere: 'cosmos', anneesAvant: AGE_UNIVERS },
  { id: 'noyaux', ere: 'cosmos', anneesAvant: AGE_UNIVERS - 3 * MINUTE_EN_ANNEES },
  { id: 'atomes', ere: 'cosmos', anneesAvant: AGE_UNIVERS - 380_000 },
  { id: 'etoiles', ere: 'cosmos', anneesAvant: 13.6e9 },
  { id: 'galaxies', ere: 'cosmos', anneesAvant: 13.4e9 },
  { id: 'soleil', ere: 'cosmos', anneesAvant: 4.6e9 },
  { id: 'lune', ere: 'cosmos', anneesAvant: 4.5e9 },
  { id: 'vie', ere: 'vie', anneesAvant: 3.5e9 },
  { id: 'oxygene', ere: 'vie', anneesAvant: 2.4e9 },
  { id: 'cambrien', ere: 'vie', anneesAvant: 540e6 },
  { id: 'dinosaures', ere: 'vie', anneesAvant: 230e6 },
  { id: 'asteroide', ere: 'vie', anneesAvant: 66e6 },
  { id: 'hominines', ere: 'humanite', anneesAvant: 7e6 },
  { id: 'sapiens', ere: 'humanite', anneesAvant: 300_000 },
  { id: 'agriculture', ere: 'humanite', anneesAvant: 12_000 },
  { id: 'ecriture', ere: 'humanite', anneesAvant: 5_300 },
  { id: 'aujourdhui', ere: 'humanite', anneesAvant: 0 },
];

/** Moment de l'année cosmique écoulé depuis le 1er janvier à 0 h, en secondes. */
export function instantCosmique(anneesAvant: number): number {
  const fraction = Math.min(Math.max(1 - anneesAvant / AGE_UNIVERS, 0), 1);
  return fraction * ANNEE_COSMIQUE_S;
}

export interface DateCosmique {
  /** 0 = janvier. */
  readonly mois: number;
  readonly jour: number;
  readonly heure: number;
  readonly minute: number;
  readonly seconde: number;
}

/** Date du calendrier cosmique : l'histoire de l'univers ramenée à une année. */
export function dateCosmique(anneesAvant: number): DateCosmique {
  const instant = instantCosmique(anneesAvant);
  if (instant >= ANNEE_COSMIQUE_S) {
    return { mois: 11, jour: 31, heure: 24, minute: 0, seconde: 0 };
  }
  let reste = Math.floor(instant);
  let jourDeLAnnee = Math.floor(reste / 86_400);
  reste -= jourDeLAnnee * 86_400;
  let mois = 0;
  while (jourDeLAnnee >= JOURS_PAR_MOIS[mois]) {
    jourDeLAnnee -= JOURS_PAR_MOIS[mois];
    mois++;
  }
  return {
    mois,
    jour: jourDeLAnnee + 1,
    heure: Math.floor(reste / 3600),
    minute: Math.floor((reste % 3600) / 60),
    seconde: reste % 60,
  };
}

export interface Bande {
  readonly id: 'annee' | 'jour' | 'minute';
  /** Début et durée de la bande, en secondes de l'année cosmique. */
  readonly debut: number;
  readonly duree: number;
  /** Graduations : position (0 à 1) et libellé. */
  readonly graduations: readonly { readonly position: number; readonly libelle: string }[];
}

const INITIALES_MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/** Trois zooms successifs : l'année, le 31 décembre, la dernière minute. */
export const BANDES: readonly Bande[] = [
  {
    id: 'annee',
    debut: 0,
    duree: ANNEE_COSMIQUE_S,
    graduations: INITIALES_MOIS.map((libelle, i) => ({
      position: (JOURS_PAR_MOIS.slice(0, i).reduce((a, b) => a + b, 0) + 15) / 365,
      libelle,
    })),
  },
  {
    id: 'jour',
    debut: ANNEE_COSMIQUE_S - 86_400,
    duree: 86_400,
    graduations: [0, 6, 12, 18, 24].map((h) => ({ position: h / 24, libelle: `${h} h` })),
  },
  {
    id: 'minute',
    debut: ANNEE_COSMIQUE_S - 60,
    duree: 60,
    graduations: [0, 15, 30, 45, 60].map((s) => ({ position: s / 60, libelle: `${s} s` })),
  },
];

/** Position (0 à 1) d'un événement dans une bande, ou null s'il en sort. */
export function positionDans(bande: Bande, anneesAvant: number): number | null {
  const position = (instantCosmique(anneesAvant) - bande.debut) / bande.duree;
  return position >= 0 && position <= 1 ? position : null;
}
