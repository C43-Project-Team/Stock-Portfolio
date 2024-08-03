# SQL Functions

## Calculate Portfolio Beta

This function calculates the beta value of user's portfolio.\
Parameters:                   `owner_name: varchar`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`portfolio: varchar`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`start_date: date`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`end_date: date`

```sql
DECLARE
    portfolio_beta FLOAT;
BEGIN
    WITH PortfolioStocks AS (
        SELECT 
            i.stock_symbol,
            i.num_shares,
            lp.close_price,
            (i.num_shares * lp.close_price) AS investment_value
        FROM 
            investments i
        JOIN 
            (SELECT stock_symbol, close_price
             FROM stocks_daily
             WHERE stock_date = (SELECT MAX(stock_date) FROM stocks_daily)) lp 
        ON 
            i.stock_symbol = lp.stock_symbol
        WHERE 
            i.owner = owner_name AND i.portfolio_name = portfolio
    ),
    TotalInvestment AS (
        SELECT 
            SUM(investment_value) AS total_value
        FROM 
            PortfolioStocks
    ),
    WeightedStocks AS (
        SELECT 
            ps.stock_symbol,
            ps.investment_value,
            ps.investment_value / ti.total_value AS weight
        FROM 
            PortfolioStocks ps, TotalInvestment ti
    ),
    StockReturns AS (
        SELECT 
            s.stock_symbol,
            s.stock_date,
            s.return AS stock_return,
            m.return AS market_return
        FROM 
            stocks_daily s
        JOIN 
            market_index_daily m ON s.stock_date = m.stock_date
        WHERE 
            s.stock_symbol IN (SELECT stock_symbol FROM PortfolioStocks)
            AND s.stock_date BETWEEN start_date AND end_date
    ),
    StockBetas AS (
        SELECT 
            sr.stock_symbol,
            COVAR_SAMP(sr.stock_return, sr.market_return) / VAR_SAMP(sr.market_return) AS beta
        FROM 
            StockReturns sr
        GROUP BY 
            sr.stock_symbol
    ),
    PortfolioBeta AS (
        SELECT 
            ws.stock_symbol,
            ws.weight,
            sb.beta,
            ws.weight * sb.beta AS weighted_beta
        FROM 
            WeightedStocks ws
        JOIN 
            StockBetas sb ON ws.stock_symbol = sb.stock_symbol
    )
    SELECT 
        SUM(weighted_beta) INTO portfolio_beta
    FROM 
        PortfolioBeta;

    RETURN portfolio_beta;
END;
```

## Calculate Stock list Beta

This function calculates the beta value of user's stock list.\
Parameters:                   `owner_name: varchar`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`stocklist: varchar`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`start_date: date`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`end_date: date`

```sql
DECLARE
    stockList_beta FLOAT;
BEGIN
    WITH StockListStocks AS (
        SELECT 
            co.stock_symbol,
            co.num_shares,
            lp.close_price,
            (co.num_shares * lp.close_price) AS investment_value
        FROM 
            public.contains co
        JOIN 
            (SELECT stock_symbol, close_price
             FROM stocks_daily
             WHERE stock_date = (SELECT MAX(stock_date) FROM stocks_daily)) lp 
        ON 
            co.stock_symbol = lp.stock_symbol
        WHERE 
            co.stock_list_owner = owner_name AND co.stock_list_name = stockList
    ),
    TotalInvestment AS (
        SELECT 
            SUM(investment_value) AS total_value
        FROM 
            StockListStocks
    ),
    WeightedStocks AS (
        SELECT 
            sl.stock_symbol,
            sl.investment_value,
            sl.investment_value / ti.total_value AS weight
        FROM 
            StockListStocks sl, TotalInvestment ti
    ),
    StockReturns AS (
        SELECT 
            s.stock_symbol,
            s.stock_date,
            s.return AS stock_return,
            m.return AS market_return
        FROM 
            stocks_daily s
        JOIN 
            market_index_daily m ON s.stock_date = m.stock_date
        WHERE 
            s.stock_symbol IN (SELECT stock_symbol FROM StockListStocks)
            AND s.stock_date BETWEEN start_date AND end_date
    ),
    StockBetas AS (
        SELECT 
            sr.stock_symbol,
            COVAR_SAMP(sr.stock_return, sr.market_return) / VAR_SAMP(sr.market_return) AS beta
        FROM 
            StockReturns sr
        GROUP BY 
            sr.stock_symbol
    ),
    StockListBeta AS (
        SELECT 
            ws.stock_symbol,
            ws.weight,
            sb.beta,
            ws.weight * sb.beta AS weighted_beta
        FROM 
            WeightedStocks ws
        JOIN 
            StockBetas sb ON ws.stock_symbol = sb.stock_symbol
    )
    SELECT 
        SUM(weighted_beta) INTO stockList_beta
    FROM 
        StockListBeta;

    RETURN stockList_beta;
END;
```

## Calculate Stock Beta

This function calculates the beta of individual stocks.\
Parameters:                   `stock_ticker: varchar`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`start_date: date`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`end_date: date`

```sql
DECLARE
    stock_beta FLOAT;
BEGIN
    WITH CombinedData AS (
        SELECT 
            s.stock_date,
            s.return AS stock_return,
            m.return AS market_return
        FROM 
            stocks_daily s
        INNER JOIN 
            market_index_daily m ON s.stock_date = m.stock_date
        WHERE 
            s.stock_symbol = stock_ticker
            AND s.stock_date BETWEEN start_date AND end_date
    )
    SELECT 
        covar_samp(stock_return, market_return) / var_samp(market_return) INTO stock_beta
    FROM 
        CombinedData;

    RETURN stock_beta;
END;
```

## Calculate Correlation Matrix

This function computes the correlation matrix of stock pairs.\
Parameters:                   `stock_symbols: text[]`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`start_date: date`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`end_date: date`

```sql
BEGIN
    RETURN QUERY
    WITH CombinedData AS (
        SELECT
            r1.stock_symbol::TEXT AS stock1,
            r2.stock_symbol::TEXT AS stock2,
            r1.return AS return1,
            r2.return AS return2
        FROM stocks_daily r1
        JOIN stocks_daily r2
        ON r1.stock_date = r2.stock_date
        WHERE r1.stock_symbol = ANY(stock_symbols) 
        AND r2.stock_symbol = ANY(stock_symbols)
        AND r1.stock_date BETWEEN start_date AND end_date
        AND r2.stock_date BETWEEN start_date AND end_date
    )
    SELECT
        cd.stock1,
        cd.stock2,
        CORR(cd.return1, cd.return2) AS correlation
    FROM CombinedData cd
    GROUP BY cd.stock1, cd.stock2;
END;
```

## Calculate Covariance Matrix

This function computes the covariance matrix of stock pairs.\
Parameters:                   `stock_symbols: text[]`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`start_date: date`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`end_date: date`

```sql
BEGIN
    RETURN QUERY
    WITH CombinedData AS (
        SELECT
            r1.stock_symbol::TEXT AS stock1,
            r2.stock_symbol::TEXT AS stock2,
            r1.return AS return1,
            r2.return AS return2
        FROM stocks_daily r1
        JOIN stocks_daily r2
        ON r1.stock_date = r2.stock_date
        WHERE r1.stock_symbol = ANY(stock_symbols) 
        AND r2.stock_symbol = ANY(stock_symbols)
        AND r1.stock_date BETWEEN start_date AND end_date
        AND r2.stock_date BETWEEN start_date AND end_date
    )
    SELECT
        cd.stock1,
        cd.stock2,
        COVAR_SAMP(cd.return1, cd.return2) AS covariance
    FROM CombinedData cd
    GROUP BY cd.stock1, cd.stock2;
END;
```

## Calculate Coefficient of Variance

This function computes the covariance matrix of stock pairs.\
Parameters:                   `stock_ticker: varchar`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`start_date: date`\
&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;`end_date: date`

```sql
DECLARE
    mean_return FLOAT;
    stddev_return FLOAT;
BEGIN
    SELECT AVG(close_price), STDDEV(close_price)
    INTO mean_return, stddev_return
    FROM stocks_daily sd
    WHERE sd.stock_symbol = stock_ticker
    AND sd.stock_date BETWEEN start_date AND end_date;

    RETURN stddev_return / mean_return;
END;
```