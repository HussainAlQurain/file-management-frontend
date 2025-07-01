import { Document } from './document.model';

export interface BulkImportRequestDto {
  resourceTypeId: number;
  companyId?: number;
  ownerUserId?: number; // For admin to specify owner, null means current user
  skipInvalidRows?: boolean; // Whether to skip invalid rows or fail entire import
  generateResourceCodes?: boolean; // Whether to auto-generate resource codes if empty
}

export interface BulkImportResultDto {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: BulkImportErrorDto[];
  createdDocuments: Document[];
  summary: string;
}

export interface BulkImportErrorDto {
  rowNumber: number;
  field: string;
  value: string;
  errorMessage: string;
  severity: 'ERROR' | 'WARNING'; // ERROR, WARNING
} 