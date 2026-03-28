import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketSubject } from 'rxjs/webSocket';
import { AuthService } from '../../services/authService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ChatService, Message } from '../../services/chat.service';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Conversation {
  otherUser: User;
  lastMessage?: Message;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  receiverId = signal<number | null>(null);
  currentUserId!: number;
  newMessage = '';
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
    return data.results.filter((user: User) => user.id !== this.currentUserId);
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

  selectConversation(conv: Conversation) {
    this.receiverId.set(conv.otherUser.id);
    this.connectWebSocket();
    this.router.navigate(['/dashboard/chat'], {
      queryParams: { receiverId: conv.otherUser.id },
    });
  }

  getUserInitials(user?: User): string {
    if (!user || !user.first_name || !user.last_name) return '';
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  }

  connectWebSocket() {
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
      },
      error: (err) => console.error('WebSocket error:', err),
      complete: () => console.log('WebSocket connection closed'),
    });
  }

  sendMessage() {
    const rid = this.receiverId();
    if (this.newMessage.trim() && rid) {
      const messageData = {
        message: this.newMessage,
        sender_id: this.currentUserId,
        receiver_id: rid,
      };
      this.socket$.next(messageData);
      this.newMessage = '';
    }
  }

  isMine(message: Message): boolean {
  return Number(message.sender_id) === Number(this.currentUserId);
}

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    });
  }
}
