import { Injectable } from '@angular/core';
import { articles, chargeurs, domaines, glossaire } from '../../generated/contenu';
import { ArticleCorps, ArticleResume, Domaine, Glossaire } from './modeles';

/** Accès au contenu généré à partir de contenu/ (voir scripts/contenu.mjs). */
@Injectable({ providedIn: 'root' })
export class ContenuService {
  readonly domaines: readonly Domaine[] = domaines;
  readonly glossaire: Glossaire = glossaire;

  domaine(slug: string): Domaine | undefined {
    return domaines.find((d) => d.slug === slug);
  }

  articlesDe(domaine: string): readonly ArticleResume[] {
    return articles.filter((a) => a.domaine === domaine);
  }

  article(domaine: string, slug: string): ArticleResume | undefined {
    return articles.find((a) => a.domaine === domaine && a.slug === slug);
  }

  /** Articles précédent et suivant dans le même domaine. */
  voisins(domaine: string, slug: string): { precedent?: ArticleResume; suivant?: ArticleResume } {
    const liste = this.articlesDe(domaine);
    const i = liste.findIndex((a) => a.slug === slug);
    if (i < 0) return {};
    return { precedent: liste[i - 1], suivant: liste[i + 1] };
  }

  /** Charge le HTML d'un article (un chunk JavaScript par article). */
  corps(domaine: string, slug: string): Promise<ArticleCorps> {
    const chargeur = chargeurs[`${domaine}/${slug}`];
    return chargeur
      ? chargeur()
      : Promise.reject(new Error(`Article inconnu : ${domaine}/${slug}`));
  }
}
