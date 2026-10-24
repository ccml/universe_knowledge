import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Point {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly o: number;
}

/** Générateur pseudo-aléatoire déterministe : le même ciel au prérendu et dans le navigateur. */
function mulberry32(graine: number): () => number {
  return () => {
    graine |= 0;
    graine = (graine + 0x6d2b79f5) | 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LARGEUR = 1200;
const HAUTEUR = 440;

function etoiles(nombre: number, graine: number): Point[] {
  const aleatoire = mulberry32(graine);
  return Array.from({ length: nombre }, () => {
    const eclat = aleatoire() ** 3; // beaucoup d'étoiles faibles, peu de brillantes
    return {
      x: Math.round(aleatoire() * LARGEUR * 10) / 10,
      y: Math.round(aleatoire() * HAUTEUR * 10) / 10,
      r: Math.round((0.5 + eclat * 1.6) * 100) / 100,
      o: Math.round((0.35 + eclat * 0.65) * 100) / 100,
    };
  });
}

/** Une constellation imaginaire, tracée comme sur un atlas céleste. */
const CONSTELLATION: readonly Point[] = [
  { x: 820, y: 96, r: 2.6, o: 1 },
  { x: 902, y: 150, r: 2, o: 0.95 },
  { x: 968, y: 128, r: 2.3, o: 1 },
  { x: 1046, y: 186, r: 1.8, o: 0.9 },
  { x: 940, y: 238, r: 2.8, o: 1 },
  { x: 872, y: 306, r: 2, o: 0.9 },
  { x: 1004, y: 330, r: 1.7, o: 0.85 },
];
const TRAITS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [1, 4],
  [3, 4],
  [4, 5],
  [4, 6],
];

/** Fond étoilé de l'accueil (décoratif). */
@Component({
  selector: 'app-ciel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg [attr.viewBox]="'0 0 ' + largeur + ' ' + hauteur" preserveAspectRatio="xMaxYMid slice">
      <g class="champ">
        @for (e of champ; track $index) {
          <circle [attr.cx]="e.x" [attr.cy]="e.y" [attr.r]="e.r" [attr.opacity]="e.o" />
        }
      </g>
      <g class="traits">
        @for (t of traits; track $index) {
          <line
            [attr.x1]="constellation[t[0]].x"
            [attr.y1]="constellation[t[0]].y"
            [attr.x2]="constellation[t[1]].x"
            [attr.y2]="constellation[t[1]].y"
          />
        }
      </g>
      <g class="brillantes">
        @for (e of constellation; track $index) {
          <circle
            [attr.cx]="e.x"
            [attr.cy]="e.y"
            [attr.r]="e.r"
            [style.animation-delay]="$index * 0.7 + 's'"
          />
        }
      </g>
    </svg>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    /* Sur mobile, le ciel occupe le haut du bandeau et s'efface sous le titre. */
    @media (max-width: 699px) {
      svg {
        height: 62%;
        mask-image: linear-gradient(#000 65%, transparent);
      }
    }
    .champ circle {
      fill: var(--lumiere);
    }
    .traits line {
      stroke: var(--or);
      stroke-width: 1;
      opacity: 0.55;
    }
    .brillantes circle {
      fill: #fff6dc;
      animation: scintille 6s ease-in-out infinite;
    }
    @keyframes scintille {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.55;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .brillantes circle {
        animation: none;
      }
    }
  `,
})
export class Ciel {
  protected readonly largeur = LARGEUR;
  protected readonly hauteur = HAUTEUR;
  protected readonly champ = etoiles(220, 1969);
  protected readonly constellation = CONSTELLATION;
  protected readonly traits = TRAITS;
}
