import { Component, computed, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Login } from '../../models/login';
import { Register } from '../../models/register';

const LONGUEUR_MIN_MOT_DE_PASSE = 6;

type ModeFormulaire = 'connexion' | 'inscription';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-form-auth',
  styleUrl: './form-auth.css',
  templateUrl: './form-auth.html',
})
export class FormAuth {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly erreur = input<string | null>(null);
  readonly isEnvoiEnCours = input(false);

  readonly connexion = output<Login>();
  readonly inscription = output<Register>();

  protected readonly longueurMinMotDePasse = LONGUEUR_MIN_MOT_DE_PASSE;

  // État d'affichage du formulaire (pas des données) : des signals suffisent.
  protected readonly mode = signal<ModeFormulaire>('connexion');
  protected readonly isConnexion = computed(() => this.mode() === 'connexion');
  protected readonly isMotDePasseVisible = signal(false);

  // Prénom et nom ne servent qu'à l'inscription : désactivés, ils sont ignorés par la validation.
  protected readonly formulaire = this.formBuilder.group({
    prenom: [{ value: '', disabled: true }, Validators.required],
    nom: [{ value: '', disabled: true }, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(LONGUEUR_MIN_MOT_DE_PASSE)]],
  });

  protected choisirMode(mode: ModeFormulaire): void {
    this.mode.set(mode);
    const { prenom, nom } = this.formulaire.controls;
    if (mode === 'connexion') {
      prenom.disable();
      nom.disable();
      return;
    }
    prenom.enable();
    nom.enable();
  }

  protected basculerMotDePasse(): void {
    this.isMotDePasseVisible.update((isVisible) => !isVisible);
  }

  protected valider(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const { prenom, nom, email, password } = this.formulaire.getRawValue();
    if (this.isConnexion()) {
      this.connexion.emit({ email, password });
      return;
    }
    this.inscription.emit({ email, password, nom, prenom });
  }
}
