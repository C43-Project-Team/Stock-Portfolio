export interface StockCorrelation {
	stock1: string;
	stock2: string;
	correlation: number;
}

export interface StockCorrelationsResponse {
	stock_correlations: StockCorrelation[];
}
