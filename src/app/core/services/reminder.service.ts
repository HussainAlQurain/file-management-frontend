import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ReminderDTO {
  id?: number;
  message: string;
  remindAt: string; // ISO string
  sent?: boolean;
  documentId?: number;
  userId?: number;
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private api = environment.apiBase + '/reminders';

  constructor(private http: HttpClient) {}

  create(reminder: ReminderDTO): Observable<ReminderDTO> {
    return this.http.post<ReminderDTO>(`${this.api}`, reminder);
  }

  getForDocument(documentId: number): Observable<ReminderDTO[]> {
    return this.http.get<ReminderDTO[]>(`${this.api}/document/${documentId}`);
  }

  getForUser(userId: number): Observable<ReminderDTO[]> {
    return this.http.get<ReminderDTO[]>(`${this.api}/user/${userId}`);
  }

  update(id: number, reminder: ReminderDTO): Observable<void> {
    return this.http.put<void>(`${this.api}/${id}`, reminder);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
} 