export type Role = 'OWNER' | 'PARTNER';

export interface User {
  id: string;
  name: string;
  email?: string;
  cedula: string;
  role: Role;
  commissionPct: number;
  canTransfer: boolean;
  active: boolean;
  tenantId: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  isAdmin: boolean;
  tenantId: string;
  canTransfer: boolean;
}
