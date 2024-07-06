import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export interface UsersTable {
  username: string;
  password_hash: string;
  first_name: string;
  surname: string;
  user_created_at: ColumnType<Date, string | undefined, never>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export interface StocksListTable {
  id: Generated<number>;
  private: boolean;
  stock_list_name: string;
}

export type StocksList = Selectable<StocksListTable>;
export type NewStocksList = Insertable<StocksListTable>;
export type StocksListUpdate = Updateable<StocksListTable>;

export interface StocksDailyTable {
  stock_symbol: string;
  stock_date: ColumnType<Date, string | undefined, never>;
  open_price: number;
  close_price: number;
  low: number;
  high: number;
  volume: number;
}

export type StocksDaily = Selectable<StocksDailyTable>;
export type NewStocksDaily = Insertable<StocksDailyTable>;
export type StocksDailyUpdate = Updateable<StocksDailyTable>;
