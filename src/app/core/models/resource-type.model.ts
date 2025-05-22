export interface ResourceType {
  id: number;
  code: string; // Renamed from name
  name: string; // Add name field
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
  BOOLEAN = 'BOOLEAN',
  TEXTAREA = 'TEXTAREA'
}

// New DTOs based on backend
export interface CreateResourceTypeDto {
  code: string;
  name: string; // Add name field
  description?: string;
}

export interface UpdateResourceTypeDto {
  description?: string;
}

export interface FieldDefinitionDto {
  id: number;
  name: string; // Field's code/identifier
  label?: string; // Display label for the field
  kind: FieldType;
  required: boolean;
  uniqueWithinType: boolean;
  options?: string[]; // Added for SELECT type fields
  // Add other properties if present in backend's FieldDefinitionDTO
}

export interface CreateFieldDto {
  name: string; // Field's code/identifier
  label?: string; // Display label for the field
  kind: FieldType;
  required: boolean;
  uniqueWithinType: boolean;
  options?: string[]; // Added for SELECT type fields
}

export interface UpdateFieldDto {
  name?: string; // Field's code/identifier
  label?: string; // Display label for the field
  kind?: FieldType;
  required?: boolean;
  uniqueWithinType?: boolean;
  options?: string[]; // Added for SELECT type fields
}
