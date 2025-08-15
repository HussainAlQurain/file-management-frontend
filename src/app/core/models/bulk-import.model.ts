import { Document } from './document.model';

export interface BulkImportRequestDto {
  resourceTypeId: number;
  companyId?: number;
  ownerUserId?: number; // For admin to specify owner, null means current user
  skipInvalidRows?: boolean; // Whether to skip invalid rows or fail entire import
  generateResourceCodes?: boolean; // Whether to auto-generate resource codes if empty
  
  // Multi-company support
  targetCompanyIds?: number[]; // For multi-company import
  duplicateResourceTypesIfMissing?: boolean; // Auto-create missing resource types
  companyResourceTypeMapping?: { [companyId: number]: string }; // company_id -> resource_type_code mapping
  
  // Attachment support
  hasAttachments?: boolean; // Indicates if attachments are included
  attachmentLinkingStrategy?: 'ROW_PREFIX' | 'RESOURCE_CODE'; // Linking strategy
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

export interface MultiCompanyImportResultDto {
  resultsByCompany: { [companyId: number]: BulkImportResultDto };
  duplicatedResourceTypes: ResourceTypeDuplicationResultDto[];
  overallSummary: string;
  totalSuccessfulRows: number;
  totalFailedRows: number;
  totalProcessedCompanies: number;
  totalAttachmentsProcessed: number;
}

export interface ResourceTypeDuplicationResultDto {
  sourceResourceTypeId: number;
  sourceResourceTypeCode: string;
  sourceResourceTypeName: string;
  sourceCompanyId: number;
  sourceCompanyName: string;
  
  targetResourceTypeId: number;
  targetResourceTypeCode: string;
  targetResourceTypeName: string;
  targetCompanyId: number;
  targetCompanyName: string;
  
  successful: boolean;
  errorMessage?: string;
  duplicatedFieldsCount: number;
  duplicatedOptionsCount: number;
}

export interface ResourceTypeDuplicationRequestDto {
  sourceResourceTypeId: number;
  targetCompanyIds: number[];
  overwriteExisting?: boolean;
  nameSuffix?: string; // Optional suffix for duplicated resource type name
  codeSuffix?: string; // Optional suffix for duplicated resource type code
}

export interface BulkAttachmentDto {
  originalFilename: string;
  linkedRowIdentifier: string; // ROW1, ROW2, or resourceCode
  mimeType: string;
  sizeBytes: number;
  rowNumber?: number; // Excel row number (1-based)
  resourceCode?: string; // If linking by resource code
  processed?: boolean;
  errorMessage?: string;
} 