export interface Cat {
  _id?: string; // Some API responses only have `id`
  id?: string; // Fallback ID
  mimetype: string;
  size: number;
  tags?: string[]; // Optional, as some cats may have no tags
}
