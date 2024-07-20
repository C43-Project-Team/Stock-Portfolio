export interface HistoricStock {
    stock_symbol: string;
    stock_date: string;
    open_price: number;
    close_price: number;
    low: number;
    high: number;
    volume: number;
}