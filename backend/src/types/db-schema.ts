import type {
	ColumnType,
	Generated,
	Insertable,
	Selectable,
	Updateable,
} from "kysely";

export interface UsersTable {
	username: string;
	password_hash: string;
	full_name: string;
	profile_picture: string;
	user_created_at: ColumnType<Date, Date, never>;
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
	user_id: string;
	stock_list_id: number;
	content: string;
	review_creation_time: ColumnType<Date, string | undefined, never>;
	review_last_updated: ColumnType<Date, string | undefined, never>;
}

export type Review = Selectable<ReviewsTable>;
export type NewReview = Insertable<ReviewsTable>;
export type ReviewUpdate = Updateable<ReviewsTable>;

export interface FriendsTable {
	requesting_friend: string;
	receiving_friend: string;
	pending: boolean;
}

export type Friend = Selectable<FriendsTable>;
export type NewFriend = Insertable<FriendsTable>;
export type FriendUpdate = Updateable<FriendsTable>;

export interface RequestTimeoutTable {
	request_user: string;
	receive_user: string;
	expiry_time: ColumnType<Date, string | undefined, never>;
}

export type RequestTimeout = Selectable<RequestTimeoutTable>;
export type NewRequestTimeout = Insertable<RequestTimeout>;
export type RequestTimeoutUpdate = Updateable<RequestTimeout>;

export interface OwnsTable {
	portfolio_id: number;
	user_id: string;
}

export type Owns = Selectable<OwnsTable>;
export type NewOwns = Insertable<OwnsTable>;
export type OwnsUpdate = Updateable<OwnsTable>;

export interface InvestmentsTable {
	portfolio_id: number;
	stock_symbol: string;
	stock_date: ColumnType<Date, string | undefined, never>;
	num_shares: number;
}

export type Investments = Selectable<InvestmentsTable>;
export type NewInvestments = Insertable<InvestmentsTable>;
export type InvestmentsTableUpdate = Updateable<InvestmentsTable>;

export interface AccessTable {
	user_id: string;
	stock_list_id: number;
	is_owner: boolean;
}

export type Access = Selectable<AccessTable>;
export type NewAccess = Insertable<AccessTable>;
export type AccessUpdate = Updateable<AccessTable>;

export interface ContainsTable {
	stock_list_id: number;
	stock_symbol: string;
	num_shares: number;
}

export type Contains = Selectable<ContainsTable>;
export type NewContains = Insertable<ContainsTable>;
export type ContainsUpdate = Updateable<ContainsTable>;

export interface Database {
	users: UsersTable;
	portfolios: PortfoliosTable;
	stocks_list: StocksListTable;
	stocks: StocksTable;
	stocks_daily: StocksDailyTable;
	reviews: ReviewsTable;
	friends: FriendsTable;
	request_timeout: RequestTimeoutTable;
	owns: OwnsTable;
	investments: InvestmentsTable;
	access: AccessTable;
	contains: ContainsTable;
}
