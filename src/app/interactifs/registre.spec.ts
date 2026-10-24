import { registreInteractifs } from './registre';
import noms from './interactifs.json';

describe('registreInteractifs', () => {
  it('déclare exactement les composants listés dans interactifs.json', () => {
    expect(Object.keys(registreInteractifs).sort()).toEqual([...noms].sort());
  });

  it('charge chaque composant', async () => {
    for (const charger of Object.values(registreInteractifs)) {
      expect(await charger()).toBeTypeOf('function');
    }
  });
});
