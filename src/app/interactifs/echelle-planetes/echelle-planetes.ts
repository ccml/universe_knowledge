import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Astre, PLANETES, SOLEIL, disposer } from './disposition';

const LARGEUR = 1000;
const HAUTEUR_DESSIN = 260;
const ESPACE_ETIQUETTE = 70;
const MARGE_ETIQUETTE = 40;
const TERRE = PLANETES.find((p) => p.id === 'terre')!;

/** Compare les tailles des planètes (et du Soleil) à la même échelle. */
@Component({
  selector: 'app-echelle-planetes',
  imports: [DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './echelle-planetes.html',
  styleUrl: './echelle-planetes.scss',
})
export class EchellePlanetes {
  private readonly traduction = inject(TranslateService);

  protected readonly planetes = PLANETES;
  protected readonly soleil = SOLEIL;
  protected readonly largeur = LARGEUR;
  protected readonly hauteur = HAUTEUR_DESSIN + 56;
  protected readonly centreY = HAUTEUR_DESSIN / 2;

  protected readonly choisies = signal<ReadonlySet<string>>(new Set(PLANETES.map((p) => p.id)));
  protected readonly avecSoleil = signal(false);

  protected readonly selection = computed(() => PLANETES.filter((p) => this.choisies().has(p.id)));

  protected readonly disposition = computed(() =>
    disposer(this.selection(), this.avecSoleil(), LARGEUR, HAUTEUR_DESSIN),
  );

  /** Étiquettes sous les cercles, décalées sur deux lignes quand elles se chevauchent. */
  protected readonly etiquettes = computed(() => {
    let precedente = -Infinity;
    let ligne = 0;
    return this.disposition().cercles.map((c) => {
      ligne = c.cx - precedente < ESPACE_ETIQUETTE && ligne === 0 ? 1 : 0;
      precedente = c.cx;
      return {
        id: c.astre.id,
        x: Math.min(Math.max(c.cx, MARGE_ETIQUETTE), LARGEUR - MARGE_ETIQUETTE),
        y: HAUTEUR_DESSIN + 20 + ligne * 22,
      };
    });
  });

  protected readonly description = computed(() => {
    const noms = this.selection()
      .map((p) => this.traduction.instant(`astres.${p.id}`))
      .join(', ');
    if (!noms) return this.traduction.instant('echelle.aucune');
    const cle = this.avecSoleil() ? 'echelle.descriptionSoleil' : 'echelle.description';
    return this.traduction.instant(cle, { noms });
  });

  protected basculer(id: string): void {
    this.choisies.update((ens) => {
      const copie = new Set(ens);
      if (copie.has(id)) copie.delete(id);
      else copie.add(id);
      return copie;
    });
  }

  protected toutes(): void {
    this.choisies.set(new Set(PLANETES.map((p) => p.id)));
  }

  protected rapportTerre(astre: Astre): number {
    return astre.rayonKm / TERRE.rayonKm;
  }
}
