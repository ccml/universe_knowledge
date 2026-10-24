import { Type } from '@angular/core';

/**
 * Composants interactifs insérables dans un article avec
 *   ::composant{nom=<nom>}
 * Les noms doivent aussi figurer dans interactifs.json, lu par scripts/contenu.mjs
 * pour valider le contenu (un test vérifie que les deux listes concordent).
 */
export const registreInteractifs: Readonly<Record<string, () => Promise<Type<unknown>>>> = {
  'calendrier-cosmique': () =>
    import('./calendrier-cosmique/calendrier-cosmique').then((m) => m.CalendrierCosmique),
  'echelle-planetes': () =>
    import('./echelle-planetes/echelle-planetes').then((m) => m.EchellePlanetes),
};
