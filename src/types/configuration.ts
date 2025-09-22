export type Configuration = {
  id: string;
  client_id: string | null;
  section: string;
  sub: string;
  key: string;
  value: string;
  title: string | null;
  note: string | null;
  type: string; // string, text, boolean, number, etc.
  order: number;
  public: boolean;
  pro?: boolean;
  created_at: Date;
  updated_at: Date;
  status_id: number;
};

export type ConfigurationCreateRequest = {
  section: string;
  key: string;
  value: string;
  title?: string;
  type?: string;
  client_id?: string;
};

export type ConfigurationUpdateRequest = {
  section?: string;
  key?: string;
  value?: string;
  title?: string;
  type?: string;
};