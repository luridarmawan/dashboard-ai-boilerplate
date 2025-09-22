export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  alias: string | null;
  description: string | null;
  last_seen: string | null;
  ip: string;
  status_id: number;
  created_at: Date;
  updated_at: Date;
  send_email?: boolean; // Optional field for form usage
};