import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Message, ChatConversation } from '../types';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = 'http://localhost:8000/api/chat';
  private http = inject(HttpClient);

  getConversations(): Observable<ChatConversation[]> {
    return this.http.get<ChatConversation[]>(`${this.apiUrl}/messages/`);
  }

  getMessages(userId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/users/${userId}/messages/`);
  }
}
