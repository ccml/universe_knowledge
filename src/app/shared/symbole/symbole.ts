import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Symbole } from '../../contenu/modeles';

/** Pictogramme d'un domaine, tracé au trait comme sur une carte du ciel. */
@Component({
  selector: 'app-symbole',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'symbole', 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    >
      @switch (nom()) {
        @case ('soleil') {
          <circle cx="24" cy="24" r="9" />
          <circle cx="24" cy="24" r="1.6" fill="currentColor" stroke="none" />
          @for (a of rayons; track a) {
            <line x1="24" y1="7" x2="24" y2="11" [attr.transform]="'rotate(' + a + ' 24 24)'" />
          }
        }
        @case ('etoile') {
          <path
            d="M24 5 L27.2 20.8 L43 24 L27.2 27.2 L24 43 L20.8 27.2 L5 24 L20.8 20.8 Z"
            stroke-linejoin="round"
          />
          <circle cx="38" cy="10" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="10" cy="38" r="1" fill="currentColor" stroke="none" />
        }
        @case ('spirale') {
          <path
            d="M24 24 c0-2 3-2.5 4-.5 c1.6 3-1.8 6.6-5.5 5.6 c-5-1.4-5.6-8.4-1.6-11.6 c5.4-4.4 13.6-1 15 5.6 c1.8 8.6-6.4 15.6-14.8 13.6 C10.4 34.4 6.6 24 11 16"
          />
          <circle cx="36" cy="38" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="40" cy="12" r="1" fill="currentColor" stroke="none" />
        }
        @case ('sablier') {
          <line x1="13" y1="6" x2="35" y2="6" />
          <line x1="13" y1="42" x2="35" y2="42" />
          <path
            d="M16 6 C16 16 22 19 24 24 C26 19 32 16 32 6 M16 42 C16 32 22 29 24 24 C26 29 32 32 32 42"
            stroke-linejoin="round"
          />
          <circle cx="24" cy="31" r="1" fill="currentColor" stroke="none" />
          <circle cx="24" cy="36" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="40" cy="14" r="1.2" fill="currentColor" stroke="none" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 1em;
      height: 1em;
      color: var(--or);
      flex: none;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class SymboleDomaine {
  readonly nom = input.required<Symbole>();
  protected readonly rayons = [0, 45, 90, 135, 180, 225, 270, 315];
}
