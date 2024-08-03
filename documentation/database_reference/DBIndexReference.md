## Index Docs

### Indexes on friends Table
Index on requesting_friend:
```sql
CREATE INDEX idx_requesting_friend
ON friends (requesting_friend);
```

**Purpose**:

This index is created to speed up queries that filter on the requesting_friend column in the friends table, which is often used to track friendship requests (pending requests, searching friends, searching non-friends, etc)


Index on receiving_friend:
```sql
CREATE INDEX idx_receiving_friend
ON friends (receiving_friend);
```
**Purpose**:
This index improves the performance of queries filtering on the receiving_friend column in the friends table, aiding in efficiently managing friendship connections.

## Indexes on portfolios Table

Index on portfolio_name:
```sql
CREATE INDEX idx_portfolio_name
ON portfolios (portfolio_name);
```

**Purpose**:
This index enhances the performance of queries that filter or search by the portfolio_name column in the portfolios table, making it faster to find portfolios by name.

## Indexes on stock_lists Table

Index on stock_list_name
```sql
CREATE INDEX idx_stock_list_name
ON stock_lists (stock_list_name);
```

**Purpose**:
This index is created to optimize the performance of queries filtering on the stock_list_name column in the stock_lists table, facilitating faster search and retrieval of stock lists by name.
