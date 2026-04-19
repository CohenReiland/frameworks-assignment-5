export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  type: CategoryType;
  isPredefined: boolean;
}
