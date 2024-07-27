// PORTFOLIO BETA CALCULATION

// /* Get stocks that are only in portfolio along with its investment value  */
// WITH PortfolioStocks AS (
//     SELECT 
//         i.stock_symbol,
//         i.num_shares,
//         lp.close_price,
//         (i.num_shares * lp.close_price) AS investment_value
//     FROM 
//         investments i
//     JOIN 
//         (SELECT stock_symbol, close_price
//          FROM stocks_daily
//          WHERE stock_date = (SELECT MAX(stock_date) FROM stocks_daily)) lp 
//     ON 
//         i.stock_symbol = lp.stock_symbol
//     WHERE 
//         i.owner = 'murphylee10' AND i.portfolio_name = 'portfolio9999'
// ),

// /* Total investment value of portfolio */
// TotalInvestment AS (
//     SELECT 
//         SUM(investment_value) AS total_value
//     FROM 
//         PortfolioStocks
// ),

// /* Weight of each stock in portfolio */
// WeightedStocks AS (
//     SELECT 
//         ps.stock_symbol,
//         ps.investment_value,
//         ps.investment_value / ti.total_value AS weight
//     FROM 
//         PortfolioStocks ps, TotalInvestment ti
// ),

// /* Returns of each stock in the portfolio */
// StockReturns AS (
//     SELECT 
//         s.stock_symbol,
//         s.stock_date,
//         s.return AS stock_return,
//         m.return AS market_return
//     FROM 
//         stocks_daily s
//     JOIN 
//         market_index_daily m ON s.stock_date = m.stock_date
//     WHERE 
//         s.stock_symbol IN (SELECT stock_symbol FROM PortfolioStocks)
// ),

// /* beta of each stock in portfolio */
// StockBetas AS (
//     SELECT 
//         sr.stock_symbol,
//         covar_samp(sr.stock_return, sr.market_return) / var_samp(sr.market_return) AS beta
//     FROM 
//         StockReturns sr
//     GROUP BY 
//         sr.stock_symbol
// ),

// /* Normalize beta by weight */
// PortfolioBeta AS (
//     SELECT 
//         ws.stock_symbol,
//         ws.weight,
//         sb.beta,
//         ws.weight * sb.beta AS weighted_beta
//     FROM 
//         WeightedStocks ws
//     JOIN 
//         StockBetas sb ON ws.stock_symbol = sb.stock_symbol
// )

// /* Finally get overall beta */
// SELECT 
//     SUM(weighted_beta) AS portfolio_beta
// FROM 
//     PortfolioBeta;

////////////////////////////////////////////////////////////////////////

// STOCK BETA CALCULATION

// WITH CombinedData AS (
//     SELECT 
//         s.stock_date,
//         s.return AS stock_return,
//         m.return AS market_return
//     FROM 
//         stocks_daily s
//     INNER JOIN 
//         market_index_daily m ON s.stock_date = m.stock_date
//     WHERE 
//         s.stock_symbol = 'A'
// )
// SELECT 
//     covar_samp(stock_return, market_return) / var_samp(market_return) AS beta
// 	-- stock_return, market_return
// FROM 
//     CombinedData;

////////////////////////////////////////////////////////////////////////

// COV STOCK CALCULATION

// DECLARE
//     mean_return FLOAT;
//     stddev_return FLOAT;
// BEGIN
//     SELECT AVG(return), STDDEV(return)
//     INTO mean_return, stddev_return
//     FROM stocks_daily sd
//     WHERE sd.stock_symbol = cov.stock_symbol;

//     RETURN stddev_return / mean_return;
// END;

////////////////////////////////////////////////////////////////////////