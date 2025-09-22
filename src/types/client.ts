export type Client = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  metadata: any,
  created_at: Date;
  status_id: number;
};