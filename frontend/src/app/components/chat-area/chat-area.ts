import { Component, input, output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingStateComponent } from '../loading-state/loading-state';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { User, Message, Conversation } from '../../types';

export type { User, Message, Conversation } from '../../types';

@Component({
  selector: 'app-chat-area',
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

  isFirstInGroup(message: Message, index: number): boolean {
    if (index === 0) return true;
    const messages = this.messages();
    return messages[index - 1].sender_id !== message.sender_id;
  }

  isLastInGroup(message: Message, index: number): boolean {
    const messages = this.messages();
    if (index === messages.length - 1) return true;
    return messages[index + 1].sender_id !== message.sender_id;
  }

  getMessageBubbleClasses(message: Message, index: number): string {
    const isMine = this.isMine(message);
    const isFirst = this.isFirstInGroup(message, index);
    const isLast = this.isLastInGroup(message, index);

    const baseClasses = isMine
      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
      : 'bg-white text-slate-800 shadow-sm border border-slate-200/60';

    // Messenger-style border radius logic
    if (isMine) {
      if (isFirst && isLast) {
        // Single message - standard bubble with tail
        return `${baseClasses} rounded-2xl rounded-tr-md`;
      } else if (isFirst) {
        // First in group - top rounded, small bottom-right for connection
        return `${baseClasses} rounded-2xl rounded-tr-md rounded-br-lg`;
      } else if (isLast) {
        // Last in group - tail on right, rounded elsewhere
        return `${baseClasses} rounded-2xl rounded-tr-md rounded-br-sm`;
      } else {
        // Middle message - flat right side to connect
        return `${baseClasses} rounded-2xl rounded-tr-md rounded-br-lg`;
      }
    } else {
      if (isFirst && isLast) {
        // Single message
        return `${baseClasses} rounded-2xl rounded-tl-md`;
      } else if (isFirst) {
        // First in group
        return `${baseClasses} rounded-2xl rounded-tl-md rounded-bl-lg`;
      } else if (isLast) {
        // Last in group
        return `${baseClasses} rounded-2xl rounded-tl-md rounded-bl-sm`;
      } else {
        // Middle message
        return `${baseClasses} rounded-2xl rounded-tl-md rounded-bl-lg`;
      }
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.receiverId()) {
      this.messageSent.emit(this.newMessage);
      this.newMessage = '';
    }
  }

  onKeyUp(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  triggerScrollToBottom(): void {
    this.scrollToBottom.emit();
  }
}
