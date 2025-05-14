export interface ResourceType {
  id: number;
  code: string; // Renamed from name
  description?: string;
  fields: FieldDefinitionDto[]; // Changed from ResourceTypeField[]
  createdAt: string;
  updatedAt: string;
}

export interface ResourceTypeField { // This might still be used for UI purposes, or can be removed if FieldDefinitionDto covers all needs
  id: number;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  order: number;
}

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  TEXTAREA = 'TEXTAREA'
}

// New DTOs based on backend
export interface CreateResourceTypeDto {
  code: string;
  description?: string;
}

export interface UpdateResourceTypeDto {
  description?: string;
}

export interface FieldDefinitionDto {
  id: number;
  name: string;
  kind: FieldType; // Assuming FieldKind from backend maps to FieldType
  required: boolean;
  uniqueWithinType: boolean;
  // Add other properties if present in backend's FieldDefinitionDTO, like 'label' or 'options' if needed
}

export interface CreateFieldDto {
  name: string;
  kind: FieldType; // Assuming FieldKind from backend maps to FieldType
  required: boolean;
  uniqueWithinType: boolean;
}

export interface UpdateFieldDto {
  name?: string;
  kind?: FieldType;
  required?: boolean;
  uniqueWithinType?: boolean;
}
