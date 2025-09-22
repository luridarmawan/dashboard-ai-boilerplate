export type ModuleType = {
  id: string;
  client_id: string | null;
  path: string
  name: string;
  description: string | null;
  version: string;
  metadata: string;
  status_id: number;
};
