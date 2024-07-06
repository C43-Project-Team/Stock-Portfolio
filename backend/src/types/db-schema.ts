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

export interface PortfoliosTable {
    id: Generated<number>;
    portfolio_name: string;
    cash: number;
    portfolio_created_at: ColumnType<Date, string | undefined, never>;
}

export type Portfolio = Selectable<PortfoliosTable>;
export type NewPortfolio = Insertable<PortfoliosTable>;
export type PortfolioUpdate = Updateable<PortfoliosTable>;

export interface StocksListTable {
  id: Generated<number>;
  private: boolean;
  stock_list_name: string;
}

export type StocksList = Selectable<StocksListTable>;
export type NewStocksList = Insertable<StocksListTable>;
export type StocksListUpdate = Updateable<StocksListTable>;

export interface StocksTable {
    stock_symbol: string;
    company: string;
}

export type Stocks = Selectable<StocksTable>;
export type NewStocks = Insertable<StocksTable>;
export type StocksUpdate = Updateable<StocksTable>;

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

export interface ReviewsTable {
    user_id: number;
    stock_list_id: number;
    content: string;
    review_creation_time: ColumnType<Date, string | undefined, never>;
    review_last_update: ColumnType<Date, string | undefined, never>;
}

export type Reviews = Selectable<ReviewsTable>;
export type NewReviews = Insertable<ReviewsTable>;
export type ReviewsUpdate = Updateable<ReviewsTable>;

export interface RequestTimeoutTable {
    request_user: number;
    receive_user: number;
    expiry_time: ColumnType<Date, string | undefined, never>;
}

export type RequestTimeout = Selectable<RequestTimeoutTable>;
export type NewRequestTimeout = Insertable<RequestTimeout>;
export type RequestTimeoutUpdate = Updateable<RequestTimeout>;

export interface InvestmentsTable {
    portfolio_id: number;
    stock_symbol: string;
    stock_date: ColumnType<Date, string | undefined, never>;
    num_shares: number;
}

export type Investments = Selectable<InvestmentsTable>;
export type NewInvestments = Insertable<InvestmentsTable>;
export type InvestmentsTableUpdate = Updateable<InvestmentsTable>;

export interface ContainsTable {
    stock_list_id: number;
    stock_symbol: string;
    num_shares: number;
}

export type Contains = Selectable<ContainsTable>;
export type NewContains = Insertable<ContainsTable>;
export type ContainsUpdate = Updateable<ContainsTable>;