import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { ContenuService } from '../../contenu/contenu.service';
import { Terme } from '../../contenu/modeles';
import { SeoService } from '../../seo/seo.service';
import { ContenuHtml } from '../../shared/contenu-html/contenu-html';

interface GroupeLettre {
  readonly lettre: string;
  readonly termes: readonly Terme[];
}

/** « Énergie sombre » est rangée à la lettre E. */
function initiale(terme: string): string {
  return terme.normalize('NFD').charAt(0).toUpperCase();
}

@Component({
  selector: 'app-glossaire',
  imports: [RouterLink, TranslatePipe, ContenuHtml],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './glossaire.html',
  styleUrl: './glossaire.scss',
})
export class GlossairePage {
  protected readonly glossaire = inject(ContenuService).glossaire;
  /** Terme visé par l'ancre (#nebuleuse). `:target` ne suit pas la navigation du routeur. */
  protected readonly cible = toSignal(inject(ActivatedRoute).fragment);

  protected readonly groupes: readonly GroupeLettre[] = this.glossaire.termes.reduce<
    GroupeLettre[]
  >((groupes, terme) => {
    const lettre = initiale(terme.terme);
    const dernier = groupes.at(-1);
    if (dernier?.lettre === lettre) {
      (dernier.termes as Terme[]).push(terme);
    } else {
      groupes.push({ lettre, termes: [terme] });
    }
    return groupes;
  }, []);

  constructor() {
    const seo = inject(SeoService);
    seo.definir({
      titre: this.glossaire.titre,
      description: this.glossaire.description,
      chemin: '/glossaire',
      donneesStructurees: {
        '@type': 'DefinedTermSet',
        name: this.glossaire.titre,
        url: seo.url('/glossaire'),
        inLanguage: 'fr',
        hasDefinedTerm: this.glossaire.termes.map((t) => ({
          '@type': 'DefinedTerm',
          name: t.terme,
          url: seo.url(`/glossaire#${t.id}`),
        })),
      },
    });
  }
}
