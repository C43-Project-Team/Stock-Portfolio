export interface Investment {
	owner: string;
	portfolio_name: string;
	stock_symbol: string;
	num_shares: number;
    stock_beta?: number;
    stock_cov?: number;
}
