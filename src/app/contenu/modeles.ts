// Forme des données produites par scripts/contenu.mjs (src/generated/).

export type Symbole = 'soleil' | 'etoile' | 'spirale' | 'sablier';
export type Niveau = 'decouverte' | 'intermediaire';

export interface Domaine {
  readonly slug: string;
  readonly titre: string;
  readonly description: string;
  readonly symbole: Symbole;
  readonly ordre: number;
  readonly introHtml: string;
}

export interface ArticleResume {
  readonly domaine: string;
  readonly slug: string;
  readonly titre: string;
  readonly description: string;
  readonly niveau: Niveau;
  /** Date ISO AAAA-MM-JJ. */
  readonly miseAJour: string;
  readonly motsCles: readonly string[];
  readonly minutesLecture: number;
}

export interface Section {
  readonly id: string;
  readonly titre: string;
}

export interface ArticleCorps {
  readonly html: string;
  readonly sections: readonly Section[];
}

export interface Terme {
  readonly id: string;
  readonly terme: string;
  readonly definitionHtml: string;
}

export interface Glossaire {
  readonly titre: string;
  readonly description: string;
  readonly introHtml: string;
  readonly termes: readonly Terme[];
}
