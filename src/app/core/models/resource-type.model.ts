export interface ResourceType {
  id: number;
  name: string;
  description?: string;
  fields: ResourceTypeField[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceTypeField {
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
