# API du mini-CRM : endpoints et données

Source : Swagger de l'API, `https://mini-crm-api-jwt-production.up.railway.app/api-docs/` (« Mini CRM API JWT - Formation Angular Avancée », v2.0.0). Les réponses ont été vérifiées en appelant l'API le 2026-10-13 (lecture seule).

## 1. Généralités

- **URL de base** : `https://mini-crm-api-jwt-production.up.railway.app`. Tous les chemins métier commencent par `/api` : dans le code, on utilise `environment.apiBaseUrl` (`…/api`) et on ajoute la fin du chemin (`/entreprises`…).
- **Format** : JSON, requêtes avec `Content-Type: application/json`.
- **Authentification JWT** : `POST /api/auth/login` (ou `/register`) renvoie un `token`. Toutes les routes marquées 🔒 exigent le header `Authorization: Bearer <token>`.
- **Comptes de démo** : `user@test.com` / `password123` (rôle `user`), `admin@test.com` / `admin123`.
- **Données en mémoire**, sans base de données : réinitialisées automatiquement chaque dimanche à 08h00 (Europe/Paris), ou à la main avec `POST /api/admin/reset-formation`. Les données sont partagées entre tous les stagiaires.
- **Noms des champs en `snake_case`** pour les clés étrangères (`entreprise_id`, `contact_id`) : on les garde tels quels dans les interfaces.
- **Identifiants** : entiers (`number`), générés par l'API.

## 2. Erreurs

Toutes les erreurs renvoient un objet avec au moins `error` (message en français) :

| Code | Quand | Corps reçu (vérifié) |
| ---- | ----- | -------------------- |
| 400 | Champ obligatoire manquant, clé étrangère invalide, e-mail déjà utilisé | `{ "error": "Champs obligatoires manquants", "champs_manquants": ["nom"], "exemple": { "nom": "MonEntreprise" } }` |
| 401 | Token absent ou expiré | `{ "error": "Token manquant", "message": "Vous devez fournir un token JWT dans le header Authorization: Bearer <token>" }` |
| 401 | Mauvais identifiants au login | `{ "error": "Email ou mot de passe incorrect" }` |
| 403 | Token invalide | `{ "error": "Token invalide", "message": "Le token fourni n'est pas valide" }` |
| 404 | Ressource inexistante | `{ "error": "Contact avec l'id 9999 non trouvé" }` |
| 500 | Erreur serveur | `{ "error": "…" }` |

Un 401 ou un 403 sur une route 🔒 signifie qu'il faut se reconnecter (futur interceptor HTTP).

## 3. Endpoints

### 3.1 Authentification

| Méthode | Chemin | 🔒 | Corps envoyé | Réponse OK | Erreurs |
| ------- | ------ | -- | ------------ | ---------- | ------- |
| POST | `/api/auth/register` | — | `RegisterInput` | **201** `AuthResponse` | 400 (champs manquants ou e-mail déjà utilisé) |
| POST | `/api/auth/login` | — | `LoginInput` | **200** `AuthResponse` | 400 (champs manquants), 401 (identifiants incorrects) |
| GET | `/api/auth/profile` | 🔒 | — | **200** `UserProfile` | 401, 403 |

Réponse réelle de `login` : `{ "token": "eyJhbGciOiJI…", "user": { "id": 2, "email": "user@test.com", "nom": "Stagiaire", "prenom": "Angular", "role": "user" } }`.

### 3.2 Entreprises

| Méthode | Chemin | 🔒 | Corps envoyé | Réponse OK | Erreurs |
| ------- | ------ | -- | ------------ | ---------- | ------- |
| GET | `/api/entreprises` | 🔒 | — | **200** `Entreprise[]` | 401 |
| POST | `/api/entreprises` | 🔒 | `EntrepriseInput` | **201** `Entreprise` | 400 (`nom` manquant), 401 |
| GET | `/api/entreprises/{id}` | 🔒 | — | **200** `Entreprise` | 401, 404 |
| PUT | `/api/entreprises/{id}` | 🔒 | `EntrepriseInput` | **200** `Entreprise` | 401, 404 |
| DELETE | `/api/entreprises/{id}` | 🔒 | — | **200** (corps non documenté) | 401, 404 |
| GET | `/api/entreprises/{id}/contacts` | 🔒 | — | **200** `Contact[]` (contacts de l'entreprise) | 401, 404 |

### 3.3 Contacts

| Méthode | Chemin | 🔒 | Corps envoyé | Réponse OK | Erreurs |
| ------- | ------ | -- | ------------ | ---------- | ------- |
| GET | `/api/contacts` | 🔒 | — | **200** `Contact[]` | 401, 500 |
| POST | `/api/contacts` | 🔒 | `ContactInput` | **201** `Contact` | 400 (champs manquants ou `entreprise_id` invalide), 401 |
| GET | `/api/contacts/{id}` | 🔒 | — | **200** `Contact` | 400 (id invalide), 401, 404 |
| PUT | `/api/contacts/{id}` | 🔒 | `ContactInput` (partiel) | **200** `Contact` | 401, 404 |
| DELETE | `/api/contacts/{id}` | 🔒 | — | **200** (corps non documenté) | 401, 404 |
| GET | `/api/contacts/{id}/opportunites` | 🔒 | — | **200** `Opportunite[]` (opportunités du contact) | 401, 404 |

`PUT` est une **mise à jour partielle** : seuls les champs envoyés sont modifiés.

### 3.4 Opportunités

| Méthode | Chemin | 🔒 | Corps envoyé | Réponse OK | Erreurs |
| ------- | ------ | -- | ------------ | ---------- | ------- |
| GET | `/api/opportunites` | 🔒 | — | **200** `Opportunite[]` | 401 |
| POST | `/api/opportunites` | 🔒 | `OpportuniteInput` | **201** `Opportunite` | 400 (`titre` manquant ou clé étrangère invalide), 401 |
| GET | `/api/opportunites/{id}` | 🔒 | — | **200** `Opportunite` | 401, 404 |
| PUT | `/api/opportunites/{id}` | 🔒 | `OpportuniteInput` (partiel) | **200** `Opportunite` | 401, 404 |
| DELETE | `/api/opportunites/{id}` | 🔒 | — | **200** (corps non documenté) | 401, 404 |

`PUT` est une **mise à jour partielle**.

### 3.5 Tableau de bord, santé et administration

| Méthode | Chemin | 🔒 | Réponse OK |
| ------- | ------ | -- | ---------- |
| GET | `/` | — | Informations de l'API et liste des endpoints |
| GET | `/api/health` | — | `{ status: "OK", uptime: "2h 15m 30s", uptime_seconds, started_at, timestamp, donnees: { contacts, entreprises, opportunites }, derniere_activite }` |
| GET | `/api/dashboard/stats` | 🔒 | `{ contacts: 5, entreprises: 4, opportunites: 4, montant_total: 383000 }` (vérifié) |
| GET | `/api/admin/stats` | — | `{ contacts: { total, avec_entreprise, sans_entreprise }, entreprises: { total, par_secteur: { "IT & Cloud": 1, … } }, opportunites: { total, montant_total, montant_moyen, par_statut: { "En cours": 1, … } }, derniere_activite, prochain_reset }` |
| POST | `/api/admin/reset-formation` | — | `{ message: "Donnees de formation reinitialisees avec succes" }`. **Remet toutes les données à zéro pour tout le monde** : réservé au formateur. |

## 4. Modèles de données

Champs obligatoires en **gras**. `?` = facultatif. Les entités renvoyées contiennent toujours leur `id`.

### 4.1 Authentification

| Modèle | Sens | Champs |
| ------ | ---- | ------ |
| `LoginInput` | envoyé | **`email`** (string, e-mail), **`password`** (string) |
| `RegisterInput` | envoyé | **`email`** (string, e-mail), **`password`** (string, 6 caractères minimum), **`nom`** (string), **`prenom`** (string) |
| `AuthResponse` | reçu | `token` (string, JWT), `user` (`UserProfile`) |
| `UserProfile` | reçu | `id` (number), `email` (string), `nom` (string), `prenom` (string), `role` (string : `"user"` ou `"admin"`) |

### 4.2 Entreprise

| Modèle | Sens | Champs |
| ------ | ---- | ------ |
| `Entreprise` | reçu | `id` (number), **`nom`** (string), `secteur?` (string, ex. « IT & Cloud »), `adresse?` (string), `telephone?` (string, ex. « 01 45 67 89 00 ») |
| `EntrepriseInput` | envoyé (POST, PUT) | **`nom`**, `secteur?`, `adresse?`, `telephone?` |

### 4.3 Contact

| Modèle | Sens | Champs |
| ------ | ---- | ------ |
| `Contact` | reçu | `id` (number), **`nom`** (string), **`prenom`** (string), **`email`** (string, e-mail), `telephone?` (string), `entreprise_id` (number ou `null`) |
| `ContactInput` | envoyé (POST, PUT) | **`nom`**, **`prenom`**, **`email`**, `telephone?`, `entreprise_id?` (number ou `null`, doit exister) |

### 4.4 Opportunité

| Modèle | Sens | Champs |
| ------ | ---- | ------ |
| `Opportunite` | reçu | `id` (number), **`titre`** (string), `description?` (string), `montant?` (number, en euros), `statut?` (`StatutOpportunite`), `contact_id` (number ou `null`), `entreprise_id` (number ou `null`) |
| `OpportuniteInput` | envoyé (POST, PUT) | **`titre`**, `description?`, `montant?`, `statut?`, `contact_id?`, `entreprise_id?` (clés étrangères qui doivent exister) |

`StatutOpportunite` : `"Prospect"` | `"En cours"` | `"Gagne"` | `"Perdu"`. Attention : **`"Gagne"` sans accent** dans l'API. On affiche « Gagné » à l'écran, mais on envoie et compare `"Gagne"`.

Couleurs des statuts (voir `CLAUDE.md`) : `Prospect` → `info`, `En cours` → `warning`, `Gagne` → `success`, `Perdu` → `danger`.

### 4.5 Erreur

| Modèle | Champs |
| ------ | ------ |
| `Erreur` | `error` (string). Selon le cas, en plus : `message` (string), `champs_manquants` (string[]), `exemple` (objet) |

## 5. Relations

- Une **entreprise** a plusieurs **contacts** (`Contact.entreprise_id`) : `GET /api/entreprises/{id}/contacts`.
- Un **contact** a plusieurs **opportunités** (`Opportunite.contact_id`) : `GET /api/contacts/{id}/opportunites`.
- Une **opportunité** est liée à un contact et/ou à une entreprise (`contact_id`, `entreprise_id`, tous deux facultatifs).
- Les clés étrangères envoyées doivent exister, sinon 400.
