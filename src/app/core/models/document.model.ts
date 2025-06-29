export interface Document {
  id: number;
  title: string;
  description?: string;
  resourceTypeId: number;
  resourceTypeName?: string;
  resourceCode: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  version: number;
  primaryFile?: Attachment;
  attachments: Attachment[];
  fieldValues: Record<string, any>;
  storageKey?: string;
  mimeType?: string;
  status?: string;
  owner?: {
    id: number;
    username: string;
    email: string;
    roles: string[];
  };
  resourceType?: {
    id: number;
    code: string;
    name: string;
    fields?: any;
  };
  company?: {
    id: number;
    name: string;
  };
  parent?: ParentDocument;
  children?: ChildDocument[];
}

export interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  storageKey: string;
  createdAt: string;
}

export interface DocQuery {
  page?: number;
  size?: number;
  sort?: string;
  search?: string; // General search term, can be used by backend if it supports a global search
  titleContains?: string; // Specific to title
  resourceCodeEquals?: string;
  resourceTypeIdEquals?: number; // Renamed from resourceTypeId for clarity with backend
  companyIdEquals?: number; // Added for company-based filtering
  createdByIdEquals?: number; // Add this to match backend
  ownerIdEquals?: number; // Added from backend DTO
  parentIdEquals?: number; // For filtering by parent document ID (0 or null means no parent)
  tags?: string[];
  fromDate?: string;
  toDate?: string;
  perm?: string; // Add permission filter (VIEW, EDIT, etc.)
  statusEquals?: string; // Add status filter
  createdAfter?: string; // Add date range filters
  createdBefore?: string;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

export interface DocumentVersionInfo {
  id: number; // This likely refers to the main document ID, or a specific version record ID if backend provides it
  version: number;
  createdAt: string;
  createdById: number;
  createdByName?: string; // Optional, if backend provides it directly
  // Add any other relevant fields that GET /documents/{id}/versions might return, e.g., a brief comment or change summary
}

export interface CreateDocumentDto {
  title: string;
  resourceTypeId: number;
  resourceCode: string;
  mimeType?: string;
  parentId?: number;
  fieldValues: Record<string, string>;
  tagNames?: string[];
}

export interface UpdateDocumentDto {
  title?: string;
  parentId?: number | null;
  fieldValues?: Record<string, any>;
}

export interface ParentDocument {
  id: number;
  title: string;
  resourceCode?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  resourceTypeName?: string;
}

export interface ChildDocument {
  id: number;
  title: string;
  resourceCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resourceTypeName: string;
}

export interface RelatedDocuments {
  parent: ParentDocument | null;
  children: ChildDocument[];
}

export interface DocumentVersion {
  versionNo: number;
  version: number; // Alias for versionNo to maintain compatibility
  storageKey: string;
  sizeBytes: number;
  checksumSha256: string;
  createdAt: string;
  createdById?: number;
  createdByName?: string;
  id?: number; // This may refer to a specific version record ID
  attachments: {
    id: number;
    fileName: string;
    mimeType: string;
    storageKey: string;
    sizeBytes: number;
    checksumSha256: string;
  }[];
}
