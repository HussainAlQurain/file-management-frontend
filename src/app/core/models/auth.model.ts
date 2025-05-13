export interface Auth {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SYS_ADMIN = 'SYS_ADMIN'
}
