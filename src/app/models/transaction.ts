import { CategoryType } from './category';

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  date: string;
  notes?: string;
  type: CategoryType;
}
