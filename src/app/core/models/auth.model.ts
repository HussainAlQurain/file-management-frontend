export interface Auth {
  token: string; // JWT token returned by backend
  // Optionally include other fields if backend provides, e.g., tokenType, expiresIn
  user?: User; // User object if returned by backend
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
