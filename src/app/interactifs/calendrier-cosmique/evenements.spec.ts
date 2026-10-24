import { BANDES, EVENEMENTS, dateCosmique, positionDans } from './evenements';

const anneesAvant = (id: string) => EVENEMENTS.find((e) => e.id === id)!.anneesAvant;

describe('dateCosmique', () => {
  it('place le Big Bang le 1er janvier à 0 h', () => {
    expect(dateCosmique(anneesAvant('bigBang'))).toEqual({
      mois: 0,
      jour: 1,
      heure: 0,
      minute: 0,
      seconde: 0,
    });
  });

  it('place le Soleil le 1er septembre', () => {
    expect(dateCosmique(anneesAvant('soleil'))).toMatchObject({ mois: 8, jour: 1 });
  });

  it('place l’explosion cambrienne le 17 décembre et l’astéroïde le 30 décembre', () => {
    expect(dateCosmique(anneesAvant('cambrien'))).toMatchObject({ mois: 11, jour: 17 });
    expect(dateCosmique(anneesAvant('asteroide'))).toMatchObject({ mois: 11, jour: 30 });
  });

  it('fait apparaître Homo sapiens le 31 décembre vers 23 h 48', () => {
    expect(dateCosmique(anneesAvant('sapiens'))).toMatchObject({
      mois: 11,
      jour: 31,
      heure: 23,
      minute: 48,
    });
  });

  it('termine l’année à 24 h le 31 décembre', () => {
    expect(dateCosmique(0)).toEqual({ mois: 11, jour: 31, heure: 24, minute: 0, seconde: 0 });
  });
});

describe('positionDans', () => {
  const [annee, , minute] = BANDES;

  it('situe un événement dans la bande qui le contient', () => {
    expect(positionDans(annee, anneesAvant('bigBang'))).toBe(0);
    expect(positionDans(minute, 0)).toBe(1);
  });

  it('renvoie null pour un événement hors de la bande', () => {
    expect(positionDans(minute, anneesAvant('sapiens'))).toBeNull();
  });
});
