export type InboxItemStatus = 'pending' | 'converted' | 'dismissed';

export interface InboxItem {
  id: string;
  content: string;
  createdAt: string;
  status: InboxItemStatus;
}

export interface CreateInboxItemInput {
  content: string;
}
