export enum PrincipalType {
  USER = 'USER',
  GROUP = 'GROUP' // Assuming GROUP might be a future extension or already supported
}

export enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE' // MANAGE could imply all permissions or specific admin rights over the document ACL itself
}

export interface AclRecordDto {
  id?: number; // Optional: if the backend assigns and returns an ID for each ACL entry
  principalType: PrincipalType;
  principalId: number;
  principalName?: string; // For display. If not sent by backend, might need separate fetch or join.
  permission: Permission | string; // Using enum for known permissions, string for flexibility
}
