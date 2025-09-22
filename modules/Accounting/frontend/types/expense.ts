export type ExpenseType = {
  id: string;
  client_id?: string | null;
  user_id?: string | null;
  post_date: Date;
  doc_id: string;
  category_id?: string | null;
  amount: number; // Prisma Decimal -> number (atau pakai Prisma.Decimal jika mau presisi penuh)
  store_name?: string | null;
  store_branch?: string | null;
  order_date?: Date | null;
  order_id?: string | null;
  tax: number; // Prisma Decimal -> number
  payment_method?: string | null;
  is_ocr: boolean;
  is_approved: boolean;
  is_duplicate: boolean;
  approved_by?: string | null;
  approved_date?: Date | null;
  metadata?: Record<string, any> | null;
  status_id: number;
};
