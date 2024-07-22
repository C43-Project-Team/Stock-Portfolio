export interface HistoricStockInterface {
	stock_symbol: string,
    stock_date: Date,
    open_price: number,
    close_price: number,
    low: number,
    high: number,
    volume: number
}
