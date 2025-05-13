export interface Document {
  id: number;
  title: string;
  description?: string;
  resourceTypeId: number;
  resourceTypeName?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  version: number;
  attachments: Attachment[];
  metadata: Record<string, any>;
}

export interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  key: string;
  createdAt: string;
}

export interface DocQuery {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  resourceTypeId?: number;
  tags?: string[];
  fromDate?: string;
  toDate?: string;
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
