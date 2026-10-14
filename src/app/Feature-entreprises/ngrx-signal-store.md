# NgRx Signal Store dans la feature entreprises

Ce guide explique l'installation de NgRx Signal Store, son rôle dans la feature entreprises, et la lecture du store `EntreprisesStore`.

## 1. Pourquoi un store ?

Jusqu'ici, chaque page parlait directement au service :

- la liste créait sa propre ressource HTTP (`httpResource`) ;
- les pages d'ajout et de modification appelaient `creer()` / `modifier()`, puis revenaient à la liste.

Ça marche, mais l'état de la liste (les données, le chargement en cours, l'erreur) est **éparpillé** dans les pages. Un **store** rassemble cet état en un seul endroit :

- **un seul état** pour la feature : `entreprises`, `isLoading`, `erreur` ;
- **des valeurs calculées** à partir de cet état : `nombre` ;
- **des actions** qui le font évoluer : `charger`, `ajouter`, `modifier`, `supprimer`.

Les pages ne font plus que **lire** des signals (`store.entreprises()`) et **appeler** des actions (`store.supprimer(id)`).

**NgRx Signal Store** est la façon moderne d'écrire un store dans Angular. Il est construit sur les **signals** : pas d'actions, de reducers ni d'effects à écrire comme dans le NgRx « classique ». On assemble le store avec quelques fonctions (`withState`, `withComputed`, `withMethods`).

## 2. Installation

```bash
npm install @ngrx/signals
```

- `@ngrx/signals` contient le Signal Store. La version **22** du paquet correspond à **Angular 22** : les versions de NgRx suivent celles d'Angular.
- Le paquet s'ajoute aux `dependencies` de `package.json`, car le code de l'application l'utilise, et pas seulement les tests.
- Aucune configuration n'est nécessaire dans `app.config.ts` : le store est fourni avec `providedIn: 'root'`, comme un service.

## 3. Les fichiers

```
data-access/
  entreprises-service.ts       # parle à l'API (HTTP). INCHANGÉ, et utilisé par le store.
  entreprises-store.ts         # NOUVEAU : le store (état + calculs + actions)
  entreprises-store.spec.ts    # NOUVEAU : ses tests unitaires
```

Le **service n'est pas supprimé**. Les deux ont des rôles différents :

| | Service | Store |
|---|---|---|
| Rôle | parler à l'API | garder l'état de la feature |
| Contient | des requêtes HTTP | des signals (état, valeurs calculées) et des actions |
| Utilisé par | le store, et la page de modification (pour `trouver`) | les pages |

Une seule méthode a été ajoutée au service, `chargerListe()`. Elle renvoie la liste en `Promise`, car le `httpResource` de `lister()` ne peut pas être créé depuis une méthode du store (il lui faut un contexte d'injection).

## 4. Lire le store, couche par couche

```ts
export const EntreprisesStore = signalStore(
  { providedIn: 'root' },     // une seule instance pour toute l'application
  withState(ETAT_INITIAL),    // 1. l'état
  withComputed(...),          // 2. les valeurs calculées
  withMethods(...),           // 3. les actions
);
```

1. **`withState`** déclare l'état. Chaque champ devient un **signal en lecture seule** : `store.entreprises()`, `store.isLoading()`, `store.erreur()`. Une page ne peut pas modifier l'état directement : elle doit passer par une action.
2. **`withComputed`** ajoute des valeurs calculées, recalculées toutes seules quand l'état change : `store.nombre()`.
3. **`withMethods`** ajoute les actions. À l'intérieur, **`patchState(store, { … })`** met à jour une partie de l'état ; les autres champs ne bougent pas. On peut y utiliser `inject()` pour récupérer le service.

Chaque couche peut utiliser ce que les couches précédentes ont déclaré : l'ordre compte.

## 5. La règle du projet : l'API est la seule source de vérité

Le mini-CRM est **multi-utilisateur** : pendant qu'un commercial ajoute une entreprise, un collègue peut en supprimer une autre. Le store ne modifie donc **jamais** la liste « à la main » :

- il n'ajoute pas la nouvelle entreprise dans le tableau ;
- il ne retire pas la ligne supprimée.

Après **chaque** écriture (`ajouter`, `modifier`, `supprimer`), il **relit la liste sur l'API** (`charger()`). L'état du store est toujours la dernière réponse de l'API.

## 6. Utiliser le store dans une page

```ts
export default class PageEntreprises {
  protected readonly store = inject(EntreprisesStore);

  constructor() {
    this.store.charger(); // relire la liste à chaque arrivée sur la page
  }
}
```

```html
@for (entreprise of store.entreprises(); track entreprise.id) { … }
<p>{{ store.nombre() }} entreprise(s) affichée(s)</p>
```

Comme le store est partagé (`providedIn: 'root'`), la liste chargée par une page est visible par les autres pages. On la relit quand même à chaque arrivée sur la liste, pour rester fidèle à l'API.

## 7. Tester le store

`entreprises-store.spec.ts` remplace le service par un **faux** (des fonctions `vi.fn()` qui renvoient des `Promise`), puis vérifie :

- l'état de départ ;
- que `charger()` range la réponse de l'API, gère `isLoading` et l'erreur ;
- que chaque écriture appelle le service **puis** relit la liste ;
- qu'une écriture qui échoue ne relit rien et transmet l'erreur.

Les pages d'ajout et de modification, elles, remplacent le **store** par un faux dans leurs tests.

## 8. Documentation officielle

- [NgRx Signals : vue d'ensemble](https://ngrx.io/guide/signals)
- [Installation](https://ngrx.io/guide/signals/install)
- [SignalStore](https://ngrx.io/guide/signals/signal-store)
- [Signals dans Angular](https://angular.dev/guide/signals)
