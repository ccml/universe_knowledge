import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ContenuService } from '../../contenu/contenu.service';
import { SeoService } from '../../seo/seo.service';
import { ContenuHtml } from '../../shared/contenu-html/contenu-html';
import { MetaArticle } from '../../shared/meta-article/meta-article';
import { SymboleDomaine } from '../../shared/symbole/symbole';

@Component({
  selector: 'app-domaine',
  imports: [RouterLink, TranslatePipe, ContenuHtml, MetaArticle, SymboleDomaine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './domaine.html',
  styleUrl: './domaine.scss',
})
export class DomainePage {
  /** Paramètre de route :domaine (son existence est vérifiée par la route). */
  readonly domaine = input.required<string>();

  private readonly contenu = inject(ContenuService);
  private readonly seo = inject(SeoService);

  protected readonly fiche = computed(() => this.contenu.domaine(this.domaine())!);
  protected readonly articles = computed(() => this.contenu.articlesDe(this.domaine()));

  constructor() {
    effect(() => {
      const d = this.fiche();
      this.seo.definir({
        titre: d.titre,
        description: d.description,
        chemin: `/${d.slug}`,
        donneesStructurees: {
          '@type': 'CollectionPage',
          name: d.titre,
          description: d.description,
          url: this.seo.url(`/${d.slug}`),
          inLanguage: 'fr',
        },
      });
    });
  }
}
