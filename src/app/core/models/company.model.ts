export interface Company {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name: string;
  description?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  description?: string;
}

export interface CompanyFolderDto {
  id: number;
  name: string;
  description?: string;
  resourceTypes: CompanyResourceTypeDto[];
}

export interface CompanyResourceTypeDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  companyId: number;
}

export interface UserCompanyResourceTypeAccessDto {
  id?: number;
  userId: number;
  userName?: string;
  companyId: number;
  companyName?: string;
  resourceTypeId?: number;
  resourceTypeName?: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export interface CreateUserCompanyResourceTypeAccessDto {
  userId: number;
  companyId: number;
  resourceTypeId?: number;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export interface UpdateUserCompanyResourceTypeAccessDto {
  canRead?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  canManage?: boolean;
}
