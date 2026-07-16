declare module "app-store-scraper" {
  export const sort: { RECENT: number; HELPFUL: number };
  export function reviews(opts: {
    id: number;
    sort?: number;
    page?: number;
    country?: string;
  }): Promise<
    Array<{
      userName: string;
      score: number;
      text: string;
      updated: string;
    }>
  >;
}
