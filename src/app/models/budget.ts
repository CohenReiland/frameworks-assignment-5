export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  month: string;
  limit: number;
  spent: number;
  alertThreshold: number;
}
