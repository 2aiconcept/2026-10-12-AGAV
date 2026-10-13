export interface User {
  token: string;
  user: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: string;
  };
}
