import { ChangeDetectionStrategy, Component, RESPONSE_INIT, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ContenuService } from '../../contenu/contenu.service';
import { SeoService } from '../../seo/seo.service';
import { SymboleDomaine } from '../../shared/symbole/symbole';

@Component({
  selector: 'app-introuvable',
  imports: [RouterLink, TranslatePipe, SymboleDomaine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="conteneur page">
      <h1>{{ 'introuvable.titre' | translate }}</h1>
      <p class="texte">{{ 'introuvable.texte' | translate }}</p>
      <ul class="pistes">
        <li>
          <a routerLink="/">{{ 'introuvable.retour' | translate }}</a>
        </li>
        @for (d of domaines; track d.slug) {
          <li>
            <a [routerLink]="['/', d.slug]"><app-symbole [nom]="d.symbole" /> {{ d.titre }}</a>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .texte {
      max-width: var(--mesure);
      font-size: 1.15rem;
    }
    .pistes {
      padding: 0;
      list-style: none;
    }
    .pistes li {
      padding: 0.35rem 0;
    }
    .pistes a {
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;
    }
  `,
})
export class Introuvable {
  protected readonly domaines = inject(ContenuService).domaines;

  constructor() {
    // Rendu côté serveur : renvoyer un vrai 404 aux navigateurs et aux robots.
    const reponse = inject(RESPONSE_INIT, { optional: true });
    if (reponse) reponse.status = 404;

    inject(SeoService).definir({
      titre: inject(TranslateService).instant('introuvable.titre'),
      description: inject(TranslateService).instant('introuvable.texte'),
      chemin: inject(Router).url,
      noindex: true,
    });
  }
}
