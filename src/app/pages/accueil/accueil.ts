import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ContenuService } from '../../contenu/contenu.service';
import { SeoService } from '../../seo/seo.service';
import { Ciel } from '../../shared/ciel/ciel';
import { SymboleDomaine } from '../../shared/symbole/symbole';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, TranslatePipe, Ciel, SymboleDomaine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss',
})
export class Accueil {
  protected readonly contenu = inject(ContenuService);
  protected readonly seo = inject(SeoService);

  constructor() {
    const description = inject(TranslateService).instant('site.accroche');
    this.seo.definir({
      description,
      chemin: '/',
      donneesStructurees: {
        '@type': 'WebSite',
        name: this.seo.nomSite,
        url: this.seo.url('/'),
        inLanguage: 'fr',
      },
    });
  }
}
