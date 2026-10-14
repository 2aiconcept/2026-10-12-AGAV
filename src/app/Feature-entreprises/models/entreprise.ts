// Une interface décrit la forme d'un objet : ici, une entreprise telle que l'API la renvoie.
// Elle n'existe qu'à la compilation (TypeScript) : rien n'est généré dans le JavaScript final.
export interface Entreprise {
  // Identifiant unique, généré par l'API à la création (on ne le choisit jamais nous-mêmes).
  id: number;
  // Nom de l'entreprise : le seul champ obligatoire côté API.
  nom: string;
  // Le « ? » rend le champ facultatif : il peut être absent de la réponse de l'API.
  secteur?: string;
  // Adresse postale, facultative.
  adresse?: string;
  // Téléphone, facultatif (ex. « 01 45 67 89 00 »).
  telephone?: string;
}
