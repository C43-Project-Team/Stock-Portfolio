# SQL Triggers

## Calculate Market Index Returns

This method is triggered after every insert into the `market_index_daily` table that contains the daily information of the S&P 500 data.

```sql
BEGIN
    UPDATE market_index_daily
    SET return = (NEW.close_price - prev.close_price) / NEW.close_price
    FROM (
        SELECT close_price
        FROM market_index_daily
        WHERE stock_date < NEW.stock_date
        ORDER BY stock_date DESC
        LIMIT 1
    ) AS prev
    WHERE NEW.stock_date = market_index_daily.stock_date;
    RETURN NEW;
END;
```

## Calculate Stock Returns

This method is triggered after every insert into the `stocks_daily` table that contains the daily information of all the stocks.

```sql
BEGIN
    UPDATE stocks_daily
    SET return = (NEW.close_price - prev.close_price) / NEW.close_price
    FROM (
        SELECT close_price
        FROM stocks_daily
        WHERE stock_symbol = NEW.stock_symbol
        AND stock_date < NEW.stock_date
        ORDER BY stock_date DESC
        LIMIT 1
    ) AS prev
    WHERE NEW.stock_date = stocks_daily.stock_date
    AND NEW.stock_symbol = stocks_daily.stock_symbol;
    RETURN NEW;
END;
```
