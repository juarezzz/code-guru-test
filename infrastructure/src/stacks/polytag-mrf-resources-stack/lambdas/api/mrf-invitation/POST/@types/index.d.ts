interface User {
  id: number;
  email: string;
  role: string;
}

export interface Body {
  users: User[];
}
