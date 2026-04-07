import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketSubject } from 'rxjs/webSocket';
import { AuthService } from '../../services/authService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ChatSidebarComponent } from '../../components/chat-sidebar/chat-sidebar';
import { ChatAreaComponent } from '../../components/chat-area/chat-area';
import { User, Conversation, Message } from '../../types';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, ChatSidebarComponent, ChatAreaComponent],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private queryClient = injectQueryClient();
  private notificationSound = new Audio('notification.mp3');

  receiverId = signal<number | null>(null);
  currentUserId!: number;
  private socket$!: WebSocketSubject<any>;

  usersQuery = injectQuery(() => ({
    queryKey: ['users'],
    queryFn: () => lastValueFrom(this.authService.getUsers(undefined, 1, 100)),
  }));

  conversationsQuery = injectQuery(() => ({
    queryKey: ['conversationsData'],
    queryFn: () => lastValueFrom(this.chatService.getConversations()),
  }));

  messagesQuery = injectQuery(() => ({
    queryKey: ['chatMessages', this.receiverId()],
    queryFn: () => lastValueFrom(this.chatService.getMessages(this.receiverId()!)),
    enabled: !!this.receiverId(),
  }));

  users = computed(() => {
    const data = this.usersQuery.data() as any;
    if (!data?.results) return [] as User[];
    return data.results.filter((user: User) => Number(user.id) !== Number(this.currentUserId));
  });

  conversations = computed(() => {
    const usersList = this.users();
    if (!usersList || usersList.length === 0) return [];

    const caseData = this.conversationsQuery.data() as any[] | undefined;

    const existingConvs = new Map<number, Message>();
    if (caseData && Array.isArray(caseData)) {
      caseData.forEach((caseItem) => {
        const messages = caseItem.messages;
        if (messages && messages.length > 0) {
          existingConvs.set(caseItem.other_user_id, messages[messages.length - 1]);
        }
      });
    }

    const convs = usersList.map((user: User) => ({
      otherUser: user,
      lastMessage: existingConvs.get(user.id),
    }));

    return convs.sort((a: Conversation, b: Conversation) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );
    });
  });

  currentConversation = computed(() => {
    const rid = this.receiverId();
    if (!rid) return undefined;
    return this.conversations().find((c: Conversation) => c.otherUser.id === rid);
  });

  messages = computed(() => {
    const data = this.messagesQuery.data();
    return data || [];
  });

  constructor() {
    this.currentUserId = this.authService.getCurrentUserId()!;

    effect(() => {
      const msgs = this.messagesQuery.data();
      if (msgs && msgs.length > 0) {
        this.scrollToBottom();
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const rid = +params['receiverId'];
      if (rid) {
        this.receiverId.set(rid);
        this.connectWebSocket();
      }
    });
  }

  ngOnDestroy() {
    if (this.socket$) {
      this.socket$.complete();
    }
  }

  onConversationSelected(conv: Conversation): void {
    this.selectConversation(conv);
  }

  selectConversation(conv: Conversation): void {
    this.receiverId.set(conv.otherUser.id);
    this.connectWebSocket();
    this.router.navigate(['/dashboard/chat'], {
      queryParams: { receiverId: conv.otherUser.id },
    });
    this.markAsRead(conv.otherUser.id);
  }

  private markAsRead(userId: number): void {
    this.chatService.markConversationAsRead(userId).subscribe({
      next: () => {
        this.queryClient.setQueryData(['chatMessages', userId], (old: Message[] | undefined) =>
          old ? old.map(msg => ({ ...msg, is_read: true })) : [],
        );
        this.queryClient.invalidateQueries({ queryKey: ['conversationsData'] });
      },
      error: (err) => console.error('Error marking conversation as read:', err),
    });
  }

  connectWebSocket(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
    const rid = this.receiverId();
    if (!rid) return;

    const wsUrl = `ws://localhost:8000/ws/chat/${this.currentUserId}/${rid}/`;
    this.socket$ = new WebSocketSubject(wsUrl);

    this.socket$.subscribe({
      next: (message: Message) => {
        const rid = this.receiverId();
        this.queryClient.setQueryData(['chatMessages', rid], (old: Message[] | undefined) =>
          old ? [...old, message] : [message],
        );
        this.queryClient.invalidateQueries({ queryKey: ['conversationsData'] });
        this.scrollToBottom();

        if (Number(message.sender_id) !== Number(this.currentUserId)) {
          this.notificationSound.play().catch(() => {});
        }
      },
      error: (err) => console.error('WebSocket error:', err),
      complete: () => console.log('WebSocket connection closed'),
    });
  }

  onMessageSent(messageContent: string): void {
    const rid = this.receiverId();
    if (messageContent.trim() && rid) {
      const messageData = {
        message: messageContent,
        sender_id: this.currentUserId,
        receiver_id: rid,
      };
      this.socket$.next(messageData);
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    });
  }
}
