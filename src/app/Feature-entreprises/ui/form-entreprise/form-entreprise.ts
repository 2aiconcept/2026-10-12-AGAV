// input() / output() : entrées et sorties du composant (signal inputs, Angular 17+).
// linkedSignal : un signal modifiable dont la valeur se recalcule quand une source change.
import { Component, input, linkedSignal, output } from '@angular/core';
// Signal Forms : form() crée le formulaire, FormField relie un <input> à un champ,
// required / minLength / maxLength / pattern sont des règles de validation,
// submit() gère la soumission (affichage des erreurs, envoi seulement si tout est valide).
import {
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
} from '@angular/forms/signals';
// Le type des données saisies (les champs d'une entreprise, sans id).
import { EntrepriseInput } from '../../models/entreprise-input';

// Required<T> rend tous les champs obligatoires : dans un formulaire, un champ vide vaut ''
// (et non undefined). Le modèle du formulaire contient donc toujours 4 chaînes.
type ModeleEntreprise = Required<EntrepriseInput>;

// Valeurs de départ d'un formulaire vide (ajout d'une entreprise).
const ENTREPRISE_VIDE: ModeleEntreprise = { nom: '', secteur: '', adresse: '', telephone: '' };

// Constantes nommées plutôt que des nombres « magiques » dans le code.
const LONGUEUR_MIN_NOM = 2;
const LONGUEUR_MAX_TEXTE = 100;
// Expression régulière d'un téléphone français : « 0 », un chiffre, puis 4 groupes de
// 2 chiffres, chacun précédé ou non d'un espace (ex. 01 45 67 89 00 ou 0145678900).
const FORMAT_TELEPHONE = /^0\d( ?\d{2}){4}$/;

// Composant « dumb » (présentation) : il n'injecte aucun service.
// Il reçoit des données par ses inputs et prévient son parent par son output.
// Il est partagé par les pages « ajouter » et « modifier ».
@Component({
  // FormField doit être importé pour utiliser [formField] dans le template.
  imports: [FormField],
  // Balise HTML du composant : <app-form-entreprise>.
  selector: 'app-form-entreprise',
  // Fichier CSS du composant (vide : on n'utilise que des classes Bootstrap).
  styleUrl: './form-entreprise.css',
  // Fichier HTML du composant.
  templateUrl: './form-entreprise.html',
})
export class FormEntreprise {
  // Entreprise à afficher : absente pour un ajout, préremplie pour une modification.
  readonly entreprise = input<EntrepriseInput>();
  // Texte du bouton : « Enregistrer » par défaut, « Ajouter » pour la page d'ajout.
  readonly libelleValider = input('Enregistrer');
  // Événement émis vers le parent avec les données saisies, quand le formulaire est valide.
  readonly valider = output<EntrepriseInput>();

  // Le modèle du formulaire : un signal qui contient les valeurs saisies.
  // linkedSignal recalcule sa valeur à chaque fois que this.entreprise() change :
  // utile pour la modification, où l'entreprise arrive après le chargement depuis l'API.
  // Entre deux changements, l'utilisateur peut le modifier librement en tapant.
  protected readonly modele = linkedSignal<ModeleEntreprise>(() => ({
    // On part d'un formulaire vide…
    ...ENTREPRISE_VIDE,
    // …puis on écrase avec les champs de l'entreprise reçue (s'il y en a une).
    ...this.entreprise(),
  }));

  // form() crée le formulaire à partir du modèle, qui reste la source de vérité :
  // les champs lisent et écrivent directement dans this.modele.
  // Le 2e argument est le « schéma » : la fonction qui déclare les règles de validation.
  // « schema » donne accès au chemin de chaque champ (schema.nom, schema.telephone…).
  protected readonly formulaire = form(this.modele, (schema) => {
    // Le nom est obligatoire.
    required(schema.nom, { message: 'Le nom est obligatoire.' });
    // Le nom fait au moins 2 caractères.
    minLength(schema.nom, LONGUEUR_MIN_NOM, {
      message: `Le nom doit faire au moins ${LONGUEUR_MIN_NOM} caractères.`,
    });
    // Le nom fait au plus 100 caractères.
    maxLength(schema.nom, LONGUEUR_MAX_TEXTE, {
      message: `Le nom doit faire au plus ${LONGUEUR_MAX_TEXTE} caractères.`,
    });
    // Le secteur fait au plus 100 caractères (il reste facultatif).
    maxLength(schema.secteur, LONGUEUR_MAX_TEXTE, {
      message: `Le secteur doit faire au plus ${LONGUEUR_MAX_TEXTE} caractères.`,
    });
    // S'il est rempli, le téléphone doit respecter le format. Vide, il reste valide
    // (seul required impose une valeur).
    pattern(schema.telephone, FORMAT_TELEPHONE, {
      message: 'Saisissez un numéro à 10 chiffres, par exemple 01 45 67 89 00.',
    });
  });

  // Appelée par (submit) sur le <form>, au clic sur le bouton ou à la touche Entrée.
  protected soumettre(event: Event): void {
    // Empêche le comportement par défaut du navigateur (recharger la page).
    event.preventDefault();
    // submit() marque tous les champs comme « touchés » (les erreurs s'affichent toutes),
    // puis n'exécute la fonction que si toutes les règles sont respectées.
    submit(this.formulaire, async () => {
      // On envoie au parent la valeur actuelle du modèle (les données saisies).
      this.valider.emit(this.modele());
    });
  }
}
