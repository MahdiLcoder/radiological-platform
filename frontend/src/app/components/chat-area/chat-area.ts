import { Component, input, output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingStateComponent } from '../loading-state/loading-state';
import { EmptyStateComponent } from '../empty-state/empty-state';

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
  selector: 'app-chat-area',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent, EmptyStateComponent],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.css',
})
export class ChatAreaComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  currentUserId = input<number>(0);
  receiverId = input<number | null>(null);
  currentConversation = input<Conversation | undefined>(undefined);
  messages = input<Message[]>([]);
  isLoading = input<boolean>(false);

  messageSent = output<string>();
  scrollToBottom = output<void>();

  newMessage = '';

  getUserInitials(user?: User): string {
    if (!user || !user.first_name || !user.last_name) return '';
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  }

  isMine(message: Message): boolean {
    return Number(message.sender_id) === Number(this.currentUserId());
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.receiverId()) {
      this.messageSent.emit(this.newMessage);
      this.newMessage = '';
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  triggerScrollToBottom(): void {
    this.scrollToBottom.emit();
  }
}
