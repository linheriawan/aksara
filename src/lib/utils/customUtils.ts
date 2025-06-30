export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  createdAt: Date | string;
}

export interface Girl {
  id?: number;
  Name?: string;
  description?: string;
}