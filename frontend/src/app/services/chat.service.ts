import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Message, ChatConversation } from '../types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  private http = inject(HttpClient);

  getConversations(): Observable<ChatConversation[]> {
    return this.http.get<ChatConversation[]>(`${this.apiUrl}/messages/`);
  }

  getMessages(userId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/users/${userId}/messages/`);
  }

  markConversationAsRead(userId: number): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.apiUrl}/users/${userId}/read/`, {});
  }
}
