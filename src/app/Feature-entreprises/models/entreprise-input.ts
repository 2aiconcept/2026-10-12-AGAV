// On importe l'interface Entreprise pour construire un nouveau type à partir d'elle.
import { Entreprise } from './entreprise';

// Ce qu'on ENVOIE à l'API pour créer ou modifier une entreprise.
// Omit<Type, 'cle'> reprend tous les champs de Type, sauf ceux listés : ici, tout sauf l'id,
// puisque c'est l'API qui le génère. Avantage : si on ajoute un champ à Entreprise,
// EntrepriseInput le reçoit automatiquement (une seule définition des champs).
// Omit produit un « type » (et non une « interface »), d'où le mot-clé « type ».
export type EntrepriseInput = Omit<Entreprise, 'id'>;
