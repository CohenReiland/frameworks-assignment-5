export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  month: string;
  limit: number;
  spent: number;
  alertThreshold: number;
}
