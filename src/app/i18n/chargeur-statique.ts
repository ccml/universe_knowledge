import { Injectable } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import fr from './fr.json';

/**
 * Libellés intégrés au bundle plutôt que chargés en HTTP : ils sont disponibles
 * immédiatement, au prérendu comme dans le navigateur, sans requête supplémentaire.
 */
@Injectable()
export class ChargeurStatique implements TranslateLoader {
  getTranslation(): Observable<TranslationObject> {
    return of(fr);
  }
}
