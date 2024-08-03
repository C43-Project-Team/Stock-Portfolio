import type { Stock } from "./stock"
export interface StockListEntry extends Stock {
  num_shares: number;
  stock_beta?: number;
  stock_cov?: number;
}