import { InitialesPipe } from './initiales-pipe';

describe('InitialesPipe', () => {
  const pipe = new InitialesPipe();

  it('renvoie la première lettre du prénom et du nom', () => {
    expect(pipe.transform('Chris Martin')).toBe('CM');
  });

  it('met les initiales en majuscules', () => {
    expect(pipe.transform('chris martin')).toBe('CM');
  });

  it('garde au plus deux initiales', () => {
    expect(pipe.transform('Jean Paul Dupont')).toBe('JP');
  });

  it('ignore les espaces en trop', () => {
    expect(pipe.transform('  Chris   Martin ')).toBe('CM');
  });

  it('renvoie une chaîne vide pour un nom vide', () => {
    expect(pipe.transform('')).toBe('');
  });
});
