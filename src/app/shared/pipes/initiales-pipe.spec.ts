/*
 * Ce qu'il faut tester : InitialesPipe
 * ------------------------------------
 * Le pipe transforme un nom complet (« Chris Martin ») en initiales (« CM »).
 * On vérifie ce qu'il RENVOIE pour une entrée donnée, cas par cas :
 * - le cas nominal : première lettre du prénom et du nom ;
 * - la mise en majuscules ;
 * - la limite à deux initiales (prénom composé, nom en plusieurs mots) ;
 * - un seul mot donne une seule initiale ;
 * - les espaces en trop sont ignorés ;
 * - une chaîne vide ne fait pas planter le pipe.
 * On ne teste PAS comment il s'y prend (split, filter, slice…) : on pourrait
 * réécrire l'implémentation sans que ces tests changent.
 *
 * Stratégie : un pipe pur sans dépendance injectée est une simple classe.
 * Pas besoin de TestBed : on l'instancie avec `new` et on appelle transform().
 * C'est le test le plus simple et le plus rapide qui soit.
 */

// La classe à tester : on l'importe directement, sans passer par Angular.
import { InitialesPipe } from './initiales-pipe';

// describe() regroupe les tests d'un même élément sous un titre commun.
describe('InitialesPipe', () => {
  // Le pipe n'a pas d'état interne : une seule instance peut servir à tous les tests.
  const pipe = new InitialesPipe();

  // it() décrit UN comportement ; le nom se lit comme une phrase en français.
  it('renvoie la première lettre du prénom et du nom', () => {
    // Arrange : un nom complet classique.
    const nomComplet = 'Chris Martin';

    // Act : on appelle la méthode transform(), comme le ferait le template.
    const initiales = pipe.transform(nomComplet);

    // Assert : toBe() compare la valeur exacte.
    expect(initiales).toBe('CM');
  });

  it('met les initiales en majuscules', () => {
    // Arrange : un nom saisi tout en minuscules.
    const nomComplet = 'chris martin';

    // Act : transformation.
    const initiales = pipe.transform(nomComplet);

    // Assert : les initiales sont en majuscules malgré la saisie.
    expect(initiales).toBe('CM');
  });

  it('garde au plus deux initiales', () => {
    // Arrange : trois mots (prénom composé).
    const nomComplet = 'Jean Paul Dupont';

    // Act : transformation.
    const initiales = pipe.transform(nomComplet);

    // Assert : seules les deux premières initiales sont gardées.
    expect(initiales).toBe('JP');
  });

  it('renvoie une seule initiale pour un seul mot', () => {
    // Arrange : un nom d'un seul mot.
    const nomComplet = 'Chris';

    // Act : transformation.
    const initiales = pipe.transform(nomComplet);

    // Assert : une seule lettre, sans erreur.
    expect(initiales).toBe('C');
  });

  it('ignore les espaces en trop', () => {
    // Arrange : espaces au début, au milieu et à la fin.
    const nomComplet = '  Chris   Martin ';

    // Act : transformation.
    const initiales = pipe.transform(nomComplet);

    // Assert : les espaces ne produisent pas d'initiale vide.
    expect(initiales).toBe('CM');
  });

  it('renvoie une chaîne vide pour un nom vide', () => {
    // Arrange : cas limite, aucun caractère.
    const nomComplet = '';

    // Act : transformation.
    const initiales = pipe.transform(nomComplet);

    // Assert : pas de plantage, juste une chaîne vide.
    expect(initiales).toBe('');
  });
});
