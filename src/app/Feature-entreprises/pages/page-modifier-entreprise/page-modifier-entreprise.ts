// signal : une valeur réactive ; quand elle change, le template se met à jour tout seul.
import { Component, inject, signal } from '@angular/core';
// ActivatedRoute : la route active, pour lire l'id dans l'URL (/entreprises/3/modifier).
// Router : pour naviguer depuis le code ; RouterLink : pour les liens du template.
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// Le service qui parle à l'API : sert ici à charger UNE entreprise (trouver).
import { EntreprisesService } from '../../data-access/entreprises-service';
// Le store NgRx des entreprises : il modifie l'entreprise sur l'API puis relit la liste.
import { EntreprisesStore } from '../../data-access/entreprises-store';
// Les types : l'entreprise reçue de l'API, et les données saisies dans le formulaire.
import { Entreprise } from '../../models/entreprise';
import { EntrepriseInput } from '../../models/entreprise-input';
// Le formulaire partagé avec la page d'ajout.
import { FormEntreprise } from '../../ui/form-entreprise/form-entreprise';

// Page vers laquelle on revient après la modification.
const PAGE_LISTE = '/entreprises';

// Composant « smart » : il charge l'entreprise, la passe au formulaire, puis enregistre.
@Component({
  // RouterLink pour le lien « Retour », FormEntreprise pour le formulaire.
  imports: [RouterLink, FormEntreprise],
  selector: 'app-page-modifier-entreprise',
  styleUrl: './page-modifier-entreprise.css',
  templateUrl: './page-modifier-entreprise.html',
})
export default class PageModifierEntreprise {
  // Le service, pour lire l'entreprise à modifier : le store ne garde que la liste.
  private readonly entreprisesService = inject(EntreprisesService);
  // Le store, pour enregistrer la modification (et relire la liste ensuite).
  private readonly store = inject(EntreprisesStore);
  // Le routeur, pour revenir à la liste après l'enregistrement.
  private readonly router = inject(Router);

  // L'id de l'entreprise, lu une fois dans l'URL. snapshot = l'état de la route à l'arrivée ;
  // paramMap.get('id') renvoie une chaîne, Number() la convertit en nombre.
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  // L'entreprise telle que l'API l'a renvoyée (undefined tant qu'elle n'est pas chargée).
  // Ce n'est pas une copie locale qu'on modifie : seule une réponse de l'API y est rangée.
  protected readonly entreprise = signal<Entreprise | undefined>(undefined);
  // Vrai si le chargement a échoué (entreprise introuvable, erreur serveur…).
  protected readonly hasErrorChargement = signal(false);
  // Vrai si l'enregistrement a échoué.
  protected readonly hasErrorEnregistrement = signal(false);

  // Le constructeur s'exécute à la création de la page : on lance le chargement.
  constructor() {
    this.charger();
  }

  // Lit l'entreprise sur l'API et la range dans le signal.
  private async charger(): Promise<void> {
    // try / catch : si la requête échoue, on passe dans le catch.
    try {
      // On attend la réponse de GET /entreprises/{id}, puis on la range dans le signal.
      // Le formulaire, qui reçoit ce signal en input, se préremplit tout seul.
      this.entreprise.set(await this.entreprisesService.trouver(this.id));
    } catch {
      // Entreprise introuvable ou API indisponible : le template affiche un message.
      this.hasErrorChargement.set(true);
    }
  }

  // Appelée quand le formulaire émet « valider » (formulaire valide).
  protected async enregistrer(modifications: EntrepriseInput): Promise<void> {
    // On efface une éventuelle erreur précédente.
    this.hasErrorEnregistrement.set(false);
    try {
      // Version précédente : await this.entreprisesService.modifier(this.id, modifications);
      // Le store modifie l'entreprise sur l'API (PUT) puis relit la liste (GET).
      await this.store.modifier(this.id, modifications);
      // Puis on revient à la liste, qui relira l'API à son arrivée.
      await this.router.navigateByUrl(PAGE_LISTE);
    } catch {
      // L'enregistrement a échoué : on reste sur la page et on affiche un message.
      this.hasErrorEnregistrement.set(true);
    }
  }
}
