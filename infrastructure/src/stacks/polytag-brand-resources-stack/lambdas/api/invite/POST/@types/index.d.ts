import { Polytag } from '__@types/polytag';

export interface User {
  email: string;
  roles: Polytag.Role[];
}

export interface Body {
  users: User[];
}
