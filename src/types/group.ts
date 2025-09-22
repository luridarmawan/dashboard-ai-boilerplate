export type Group = {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  created_at: Date;
  status_id: number;
};