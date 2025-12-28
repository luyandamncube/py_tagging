export interface Tag {
  id: string;
  label: string;
  usage_count: number;
  last_used?: string | null;
}

export interface TagGroup {
  id: string;
  description?: string;
  required: boolean;
  min: number;
  max: number;
  position: number;
  tags: Tag[];
}
