export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_image?: string;
}

export interface Message {
  id?: number;
  sender_id: number | string;
  receiver_id: number | string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export interface ChatConversation {
  other_user_id: number;
  messages: Message[];
}

export interface Conversation {
  otherUser: User;
  lastMessage?: Message;
}
