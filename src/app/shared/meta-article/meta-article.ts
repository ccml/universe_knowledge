import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ArticleResume } from '../../contenu/modeles';

/** « Niveau découverte, 5 min de lecture. Mis à jour le 24 octobre 2026. » */
@Component({
  selector: 'app-meta-article',
  imports: [DatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ 'article.niveau.' + article().niveau | translate }},
    {{ 'article.lecture' | translate: { minutes: article().minutesLecture } }}.
    <time [attr.datetime]="article().miseAJour">{{
      'article.miseAJour' | translate: { date: (article().miseAJour | date: 'longDate') }
    }}</time
    >.
  `,
  styles: `
    :host {
      display: block;
      color: var(--brume);
      font-size: 0.92rem;
    }
  `,
})
export class MetaArticle {
  readonly article = input.required<ArticleResume>();
}
