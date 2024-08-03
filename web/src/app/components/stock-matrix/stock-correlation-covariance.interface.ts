export interface StockCorrelation {
	stock1: string;
	stock2: string;
	correlation: number;
}

export interface StockCorrelationsResponse {
	stock_correlations: StockCorrelation[];
}

export interface StockCovariance {
	stock1: string;
	stock2: string;
	covariance: number;
}

export interface StockCovarianceResponse {
	stock_covariances: StockCovariance[];
}
