import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContenuService } from './contenu/contenu.service';
import { SeoService } from './seo/seo.service';
import { SymboleDomaine } from './shared/symbole/symbole';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgbCollapse, TranslatePipe, SymboleDomaine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly domaines = inject(ContenuService).domaines;
  protected readonly nomSite = inject(SeoService).nomSite;
  protected readonly menuFerme = signal(true);
  protected readonly annee = new Date().getFullYear();

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuFerme.set(true));
  }
}
