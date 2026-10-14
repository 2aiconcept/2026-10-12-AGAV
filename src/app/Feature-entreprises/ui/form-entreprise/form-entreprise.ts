import { Component, input, linkedSignal, output } from '@angular/core';
import { form, FormField, maxLength, minLength, pattern, required, submit } from '@angular/forms/signals';
import { EntrepriseInput } from '../../models/entreprise-input';

// Tous les champs en chaîne : un champ de formulaire vide vaut '' (et non undefined).
type ModeleEntreprise = Required<EntrepriseInput>;

const ENTREPRISE_VIDE: ModeleEntreprise = { nom: '', secteur: '', adresse: '', telephone: '' };

const LONGUEUR_MIN_NOM = 2;
const LONGUEUR_MAX_TEXTE = 100;
// Téléphone français : 10 chiffres commençant par 0, espaces facultatifs (ex. 01 45 67 89 00).
const FORMAT_TELEPHONE = /^0\d( ?\d{2}){4}$/;

// Formulaire partagé par les pages « ajouter » et « modifier ».
@Component({
  imports: [FormField],
  selector: 'app-form-entreprise',
  styleUrl: './form-entreprise.css',
  templateUrl: './form-entreprise.html',
})
export class FormEntreprise {
  // Vide pour un ajout, préremplie pour une modification.
  readonly entreprise = input<EntrepriseInput>();
  readonly libelleValider = input('Enregistrer');
  readonly valider = output<EntrepriseInput>();

  // Le modèle repart de l'entreprise reçue à chaque fois qu'elle change (ex. chargée après coup).
  protected readonly modele = linkedSignal<ModeleEntreprise>(() => ({
    ...ENTREPRISE_VIDE,
    ...this.entreprise(),
  }));

  // Le modèle reste la source de vérité ; le schéma (2e argument) déclare les règles de validation.
  protected readonly formulaire = form(this.modele, (schema) => {
    required(schema.nom, { message: 'Le nom est obligatoire.' });
    minLength(schema.nom, LONGUEUR_MIN_NOM, {
      message: `Le nom doit faire au moins ${LONGUEUR_MIN_NOM} caractères.`,
    });
    maxLength(schema.nom, LONGUEUR_MAX_TEXTE, {
      message: `Le nom doit faire au plus ${LONGUEUR_MAX_TEXTE} caractères.`,
    });
    maxLength(schema.secteur, LONGUEUR_MAX_TEXTE, {
      message: `Le secteur doit faire au plus ${LONGUEUR_MAX_TEXTE} caractères.`,
    });
    pattern(schema.telephone, FORMAT_TELEPHONE, {
      message: 'Saisissez un numéro à 10 chiffres, par exemple 01 45 67 89 00.',
    });
  });

  // submit() marque les champs comme touchés (les erreurs s'affichent)
  // et n'exécute l'action que si toutes les règles sont respectées.
  protected soumettre(event: Event): void {
    event.preventDefault();
    submit(this.formulaire, async () => {
      this.valider.emit(this.modele());
    });
  }
}
