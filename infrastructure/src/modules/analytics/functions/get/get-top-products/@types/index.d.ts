export interface GetTopProductsInput {
  gtins: string[];
  range: string;
}

export interface GetTopProductsOutput {
  gtin: string;
  gtin_count: number;
}
