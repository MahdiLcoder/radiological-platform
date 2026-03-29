import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Message {
  id?: number;
  sender_id: number | string;
  receiver_id: number | string;
  content: string;
  created_at: string;
}

export interface Conversation {
  otherUser: User;
  lastMessage?: Message;
}

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-sidebar.html',
  styleUrl: './chat-sidebar.css',
})
export class ChatSidebarComponent {
  conversations = input<Conversation[]>([]);
  selectedConversationId = input<number | null>(null);
  currentUserId = input<number>(0);

  conversationSelected = output<Conversation>();

  selectConversation(conv: Conversation): void {
    this.conversationSelected.emit(conv);
  }

  getUserInitials(user?: User): string {
    if (!user || !user.first_name || !user.last_name) return '';
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  }

  isMine(message?: Message): boolean {
    if (!message) return false;
    return Number(message.sender_id) === Number(this.currentUserId());
  }
}
