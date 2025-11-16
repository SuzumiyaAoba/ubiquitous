export interface BoundedContext {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
