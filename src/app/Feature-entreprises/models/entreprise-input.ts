import { Entreprise } from './entreprise';

// Mêmes champs qu'Entreprise, sans l'id : c'est l'API qui le génère à la création.
export type EntrepriseInput = Omit<Entreprise, 'id'>;
