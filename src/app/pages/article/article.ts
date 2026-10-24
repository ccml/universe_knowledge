import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ContenuService } from '../../contenu/contenu.service';
import { SeoService } from '../../seo/seo.service';
import { ContenuHtml } from '../../shared/contenu-html/contenu-html';
import { MetaArticle } from '../../shared/meta-article/meta-article';
import { SymboleDomaine } from '../../shared/symbole/symbole';

/** Nombre minimal d'intertitres pour afficher un sommaire. */
const SECTIONS_POUR_SOMMAIRE = 3;

@Component({
  selector: 'app-article',
  imports: [RouterLink, TranslatePipe, ContenuHtml, MetaArticle, SymboleDomaine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './article.html',
  styleUrl: './article.scss',
})
export class ArticlePage {
  /** Paramètres de route (leur existence est vérifiée par la route). */
  readonly domaine = input.required<string>();
  readonly article = input.required<string>();

  private readonly contenu = inject(ContenuService);
  private readonly seo = inject(SeoService);

  protected readonly fiche = computed(() => this.contenu.article(this.domaine(), this.article())!);
  protected readonly domaineFiche = computed(() => this.contenu.domaine(this.domaine())!);
  protected readonly voisins = computed(() => this.contenu.voisins(this.domaine(), this.article()));

  protected readonly corps = resource({
    params: () => ({ domaine: this.domaine(), article: this.article() }),
    loader: ({ params }) => this.contenu.corps(params.domaine, params.article),
  });

  protected readonly sommaire = computed(() => {
    const sections = this.corps.hasValue() ? this.corps.value().sections : [];
    return sections.length >= SECTIONS_POUR_SOMMAIRE ? sections : [];
  });

  constructor() {
    effect(() => {
      const a = this.fiche();
      const chemin = `/${a.domaine}/${a.slug}`;
      this.seo.definir({
        titre: a.titre,
        description: a.description,
        chemin,
        type: 'article',
        donneesStructurees: {
          '@type': 'Article',
          headline: a.titre,
          description: a.description,
          dateModified: a.miseAJour,
          inLanguage: 'fr',
          keywords: a.motsCles.join(', '),
          articleSection: this.domaineFiche().titre,
          mainEntityOfPage: this.seo.url(chemin),
          publisher: { '@type': 'Organization', name: this.seo.nomSite },
        },
      });
    });
  }
}
