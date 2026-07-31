export const CONTACT_MESSAGE_READ_PORT = Symbol('CONTACT_MESSAGE_READ_PORT');

export type ContactMessageListItem = {
  id: string;
  name: string;
  email: string;
  message: string;
  ip: string | null;
  createdAt: Date;
};

export type ListContactMessagesQuery = {
  limit: number;
  cursor?: string;
};

export type ListContactMessagesResult = {
  items: ContactMessageListItem[];
  nextCursor?: string;
};

export interface ContactMessageReadPort {
  listMessages(
    query: ListContactMessagesQuery,
  ): Promise<ListContactMessagesResult>;
}
