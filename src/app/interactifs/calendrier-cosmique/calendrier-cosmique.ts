import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BANDES, ERES, EVENEMENTS, Evenement, dateCosmique, positionDans } from './evenements';

/** Ramène l'histoire de l'univers à une seule année, avec deux zooms sur le 31 décembre. */
@Component({
  selector: 'app-calendrier-cosmique',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendrier-cosmique.html',
  styleUrl: './calendrier-cosmique.scss',
})
export class CalendrierCosmique {
  private readonly traduction = inject(TranslateService);

  protected readonly eres = ERES.map((ere) => ({
    ere,
    evenements: EVENEMENTS.filter((e) => e.ere === ere),
  }));
  protected readonly evenements = EVENEMENTS;

  protected readonly choisi = signal<Evenement>(EVENEMENTS.find((e) => e.id === 'sapiens')!);

  protected readonly bandes = computed(() =>
    BANDES.map((bande) => ({
      ...bande,
      reperes: EVENEMENTS.map((e) => ({ id: e.id, position: positionDans(bande, e.anneesAvant) }))
        .filter((r) => r.position !== null)
        .map((r) => ({ id: r.id, gauche: `${(r.position as number) * 100}%` })),
      choisi: positionDans(bande, this.choisi().anneesAvant) !== null,
    })),
  );

  /** « 17 décembre », « 31 décembre, 23 h 48 », « 31 décembre, 23 h 59 min 32 s »… */
  protected date(e: Evenement): string {
    const d = dateCosmique(e.anneesAvant);
    const mois = (this.traduction.instant('calendrier.mois') as string[])[d.mois];
    const jour = d.jour === 1 ? '1er' : String(d.jour);
    const minute = String(d.minute).padStart(2, '0');
    const seconde = String(d.seconde).padStart(2, '0');
    const dernierJour = d.mois === 11 && d.jour === 31;
    const premierJour = d.mois === 0 && d.jour === 1;
    let cle = 'calendrier.date';
    if (d.heure === 24) cle = 'calendrier.dateFin';
    else if (dernierJour && d.heure === 23 && d.minute === 59) cle = 'calendrier.dateSeconde';
    else if (dernierJour || premierJour) cle = 'calendrier.dateHeure';
    return this.traduction.instant(cle, { jour, mois, heure: d.heure, minute, seconde });
  }
}
