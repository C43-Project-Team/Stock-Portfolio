# SQL Queries

## User/Auth:

Get a user by id (username):
```sql
SELECT *
FROM users
WHERE username = :username
LIMIT 1;
```

Create a new user:
```sql
INSERT INTO users (username, password_hash, full_name, user_created_at, profile_picture)
VALUES (:username, :password_hash, :full_name, :user_created_at, :profile_picture)
RETURNING username, password_hash, full_name, user_created_at, profile_picture;
```

Search for a user:
```sql
SELECT *
FROM users
WHERE username LIKE ':query%';
```

## Portfolio

Get portfolios for a given user:
```sql
SELECT *
FROM portfolios
WHERE owner = :owner;
```

Create a new portfolio (if the owner hasnt already created one with the same name):
```sql
WITH ExistingPortfolio AS (
    SELECT *
    FROM portfolios
    WHERE owner = :owner AND portfolio_name = :portfolio_name
    LIMIT 1
)
INSERT INTO portfolios (owner, portfolio_name, cash)
SELECT :owner, :portfolio_name, :initialDeposit
WHERE NOT EXISTS (
    SELECT *
    FROM ExistingPortfolio
)
RETURNING owner, portfolio_name, cash, portfolio_created_at;
```

Delete a portfolio:
```sql
DELETE FROM portfolios
WHERE owner = :owner AND portfolio_name = :portfolio_name;
```

: Get the info associated with a single portfolio:
```sql
SELECT *
FROM portfolios
WHERE owner = :owner AND portfolio_name = :portfolio_name
LIMIT 1;
```

Get the investments associated with a single portfolio
```sql
SELECT *
FROM investments
WHERE owner = :owner AND portfolio_name = :portfolio_name;
```

Buy `n` shares of a stock (if we have enough money)
```sql
-- Begin the transaction
BEGIN;

-- Fetch the most recent close price for the stock symbol
WITH RecentPrice AS (
    SELECT close_price
    FROM stocks_daily
    WHERE stock_symbol = :stock_symbol
    ORDER BY stock_date DESC
    LIMIT 1
),
-- Check if the portfolio has enough cash
PortfolioCash AS (
    SELECT cash
    FROM portfolios
    WHERE owner = :owner AND portfolio_name = :portfolio_name
    LIMIT 1
),
-- Calculate the total cost of the shares
TotalCost AS (
    SELECT :num_shares * (SELECT close_price FROM RecentPrice) AS total_cost
)
-- Update the portfolio's cash if there are sufficient funds
UPDATE portfolios
SET cash = cash - (SELECT total_cost FROM TotalCost)
WHERE owner = :owner AND portfolio_name = :portfolio_name
AND cash >= (SELECT total_cost FROM TotalCost);

-- Insert or update the investments table
INSERT INTO investments (owner, portfolio_name, stock_symbol, num_shares)
SELECT :owner, :portfolio_name, :stock_symbol, :num_shares
WHERE EXISTS (
    SELECT 1
    FROM PortfolioCash
    WHERE cash >= (SELECT total_cost FROM TotalCost)
)
ON CONFLICT (owner, portfolio_name, stock_symbol)
DO UPDATE SET num_shares = investments.num_shares + EXCLUDED.num_shares;

-- Commit the transaction
COMMIT;
```

Sell `n` shares of a stock (if we have enough of that stock)
```sql
-- Begin the transaction
BEGIN;

-- Check if the portfolio has enough shares and fetch the most recent close price for the stock symbol
WITH PortfolioShares AS (
    SELECT num_shares
    FROM investments
    WHERE owner = :owner AND portfolio_name = :portfolio_name AND stock_symbol = :stock_symbol
    LIMIT 1
),
RecentPrice AS (
    SELECT close_price
    FROM stocks_daily
    WHERE stock_symbol = :stock_symbol
    ORDER BY stock_date DESC
    LIMIT 1
),
-- Calculate the total proceeds from selling the shares
TotalProceeds AS (
    SELECT :num_shares * (SELECT close_price FROM RecentPrice) AS total_proceeds
)
-- Update the portfolio's cash if there are enough shares
UPDATE portfolios
SET cash = cash + (SELECT total_proceeds FROM TotalProceeds)
WHERE owner = :owner AND portfolio_name = :portfolio_name
AND EXISTS (
    SELECT 1
    FROM PortfolioShares
    WHERE num_shares >= :num_shares
);

-- Update the investments table
UPDATE investments
SET num_shares = investments.num_shares - :num_shares
WHERE owner = :owner AND portfolio_name = :portfolio_name AND stock_symbol = :stock_symbol
AND EXISTS (
    SELECT 1
    FROM PortfolioShares
    WHERE num_shares >= :num_shares
);

-- Delete the investment if the number of shares is now zero
DELETE FROM investments
WHERE owner = :owner AND portfolio_name = :portfolio_name AND stock_symbol = :stock_symbol
AND EXISTS (
    SELECT 1
    FROM investments
    WHERE owner = :owner AND portfolio_name = :portfolio_name AND stock_symbol = :stock_symbol
    AND num_shares = 0
);

-- Commit the transaction
COMMIT;
```

Depositing cash:
```sql
UPDATE portfolios
SET cash = cash + :amount
WHERE owner = :owner AND portfolio_name = :portfolio_name;
```

Calculating the beta of portfolio (over all data)
```sql
-- Relevant function can be found in DBFunctionReference.md
SELECT public.calculate_portfolio_beta(:owner, :portfolio_name);
```

Calculating the beta of portfolio (using data from a date range)
```sql
-- Relevant function can be found in DBFunctionReference.md
SELECT public.calculate_portfolio_beta(:owner, :portfolio_name, :startDate, :endDate);
```

Beta of a stock:
```sql
-- Relevant function can be found in DBFunctionReference.md
SELECT public.calculate_stock_beta(:stock_ticker);
```

Beta of a stock (using data from a date range)
```sql
-- Relevant function can be found in DBFunctionReference.md
SELECT public.calculate_stock_beta(:stock_ticker, :startDate, :endDate);
```

Calculate correlation matrix:
```sql
-- Relevant function can be found in DBFunctionReference.md
SELECT *
FROM public.correlation_matrix(:stock_symbols);
```

Calculate correlation matrix (using data from a date range):
```sql
-- Relevant function can be found in DBFunctionReference.md
SELECT *
FROM public.correlation_matrix(:stock_symbols, :startDate, :endDate);

```

Calculate Coefficient of Variation:
```sql
SELECT public.cov(:stock_symbol);
```

Calculate Coefficient of Variation (using data from a date range):
```sql
SELECT public.cov(:stock_symbol, :startDate, :endDate);
```

Transfer money between portfolios:
```sql
UPDATE portfolios
SET cash = cash - :amount
WHERE owner = :owner AND portfolio_name = :sending_portfolio;

UPDATE portfolios
SET cash = cash + :amount
WHERE owner = :owner AND portfolio_name = :receiving_portfolio;
```

## Stock Lists

Get stock lists for a given user:

```sql

SELECT *
FROM stocks_list
WHERE owner = :owner;
```

Get a single stock list for a given user:
```sql

SELECT *
FROM stocks_list
WHERE owner = :owner AND stock_list_name = :stock_list_name
LIMIT 1;
```
Create a new stock list (if the owner hasn't already created one with the same name):

```sql
WITH ExistingStockList AS (
    SELECT *
    FROM stocks_list
    WHERE owner = :owner AND stock_list_name = :stock_list_name
    LIMIT 1
)
INSERT INTO stocks_list (owner, stock_list_name, private)
SELECT :owner, :stock_list_name, :isPrivate
WHERE NOT EXISTS (
    SELECT *
    FROM ExistingStockList
)
RETURNING owner, stock_list_name, private;
```

Delete a stock list:

```sql
DELETE FROM stocks_list
WHERE owner = :owner AND stock_list_name = :stock_list_name;
```

Get private stock lists shared with a user:

```sql
SELECT stocks_list.*
FROM private_access
INNER JOIN stocks_list
ON private_access.stock_list_owner = stocks_list.owner
AND private_access.stock_list_name = stocks_list.stock_list_name
WHERE private_access.user = :authenticatedUser
AND private_access.stock_list_owner = :stockListOwner;
```

Get public stock lists of a user:

```sql
SELECT *
FROM stocks_list
WHERE owner = :username AND private = false;
```

Get public stock lists (with pagination):

```sql
SELECT *
FROM stocks_list
WHERE private = false
LIMIT :limit
OFFSET :offset;
```

Count of public stock lists:

```sql
SELECT COUNT(owner) AS count
FROM stocks_list
WHERE private = false
LIMIT 1;
```

Toggle stock list visibility:

```sql
WITH ExistingStockList AS (
    SELECT *
    FROM stocks_list
    WHERE owner = :owner AND stock_list_name = :stock_list_name
    LIMIT 1
)
UPDATE stocks_list
SET private = NOT private
WHERE owner = :owner AND stock_list_name = :stock_list_name
RETURNING owner, stock_list_name, private
LIMIT 1;
```

Get stocks in a stock list:
```sql

SELECT *
FROM contains
WHERE stock_list_owner = :owner AND stock_list_name = :stock_list_name;
```

Add stock to a stock list (or update if it exists):
```sql

INSERT INTO contains (stock_list_owner, stock_list_name, stock_symbol, num_shares)
VALUES (:owner, :stock_list_name, :stock_symbol, :num_shares)
ON CONFLICT (stock_list_owner, stock_list_name, stock_symbol)
DO UPDATE SET num_shares = contains.num_shares + EXCLUDED.num_shares;
```

Remove shares from a stock list:
```sql

WITH Investment AS (
    SELECT num_shares
    FROM contains
    WHERE stock_list_owner = :owner
    AND stock_list_name = :stock_list_name
    AND stock_symbol = :stock_symbol
    LIMIT 1
),
UpdatedInvestment AS (
    UPDATE contains
    SET num_shares = contains.num_shares - :num_shares
    WHERE stock_list_owner = :owner
    AND stock_list_name = :stock_list_name
    AND stock_symbol = :stock_symbol
    RETURNING num_shares
)
DELETE FROM contains
WHERE stock_list_owner = :owner
AND stock_list_name = :stock_list_name
AND stock_symbol = :stock_symbol
AND (SELECT num_shares FROM UpdatedInvestment) = 0;
```

Delete stock from a stock list:

```sql
DELETE FROM contains
WHERE stock_list_owner = :owner
AND stock_list_name = :stock_list_name
AND stock_symbol = :stock_symbol;
```

Get shared users of a stock list:

```sql
SELECT *
FROM private_access
WHERE stock_list_owner = :owner
AND stock_list_name = :stock_list_name;
```

Search for friends who have not been shared a stock list:

```sql
WITH SharedUsers AS (
    SELECT user
    FROM private_access
    WHERE stock_list_owner = :owner
    AND stock_list_name = :stockListName
),
Friends AS (
    SELECT receiving_friend AS username
    FROM friends
    WHERE requesting_friend = :owner
    AND pending = false
    UNION
    SELECT requesting_friend AS username
    FROM friends
    WHERE receiving_friend = :owner
    AND pending = false
)
SELECT *
FROM users
WHERE username LIKE :query%
AND username NOT IN (SELECT user FROM SharedUsers)
AND username IN (SELECT username FROM Friends)
AND username <> :owner;
```

Share a stock list with a user:

```sql
WITH StockList AS (
    SELECT *
    FROM stocks_list
    WHERE owner = :owner
    AND stock_list_name = :stock_list_name
    LIMIT 1
)
INSERT INTO private_access (user, stock_list_owner, stock_list_name)
SELECT :user, :owner, :stock_list_name
WHERE (SELECT private FROM StockList) = true;
```

Check if two users are friends:
```sql

SELECT *
FROM friends
WHERE (requesting_friend = :owner AND receiving_friend = :user AND pending = false)
OR (requesting_friend = :user AND receiving_friend = :owner AND pending = false)
LIMIT 1;
```

Revoke sharing of a stock list with a user:

```sql
DELETE FROM private_access
WHERE stock_list_owner = :owner
AND stock_list_name = :stock_list_name
AND user = :user;
```

Check if a user has access to a stock list:

```sql
WITH StockList AS (
    SELECT *
    FROM stocks_list
    WHERE owner = :stock_list_owner
    AND stock_list_name = :stock_list_name
    LIMIT 1
)
SELECT *
FROM private_access
WHERE user = :user
AND stock_list_owner = :stock_list_owner
AND stock_list_name = :stock_list_name
AND (SELECT private FROM StockList) = true
LIMIT 1;
```

Get all private stock lists shared with a user:

```sql
SELECT stocks_list.*
FROM private_access
INNER JOIN stocks_list
ON private_access.stock_list_owner = stocks_list.owner
AND private_access.stock_list_name = stocks_list.stock_list_name
WHERE private_access.user = :authenticatedUser;
```


Calculate the beta of a stock list:

```sql
-- Relevant function can be found in DBFunctionReference.md
SELECT public.calculate_stocklist_beta(:owner, :stockList_name);
```

Calculate the beta of a stock list (using data from a date range):

```sql
-- Relevant function can be found in DBFunctionReference.md
SELECT public.calculate_stocklist_beta(:owner, :stockList_name, :startDate, :endDate);
```

## Reviews

Get a single review:
-- Relevant function can be found in DBFunctionReference.md
```sql
SELECT *
FROM reviews
WHERE reviewer = :reviewer
AND stock_list_owner = :stock_list_owner
AND stock_list_name = :stock_list_name
LIMIT 1;
```
Create a review for a stock list:

```sql
INSERT INTO reviews (reviewer, stock_list_owner, stock_list_name, content, rating)
VALUES (:reviewer, :stock_list_owner, :stock_list_name, :content, :rating);
```

Update a review for a stock list:

```sql
UPDATE reviews
SET content = :content, rating = :rating, review_last_updated = NOW()
WHERE reviewer = :reviewer
AND stock_list_owner = :stock_list_owner
AND stock_list_name = :stock_list_name;
```

Get reviews for a stock list:

```sql
SELECT *
FROM reviews
WHERE stock_list_owner = :stock_list_owner
AND stock_list_name = :stock_list_name
ORDER BY review_creation_time DESC;
```

Delete a review:

```sql
DELETE FROM reviews
WHERE reviewer = :reviewer
AND stock_list_owner = :stock_list_owner
AND stock_list_name = :stock_list_name;
```

## Friends

Create a friend request:
```sql
SELECT *
FROM request_timeout
WHERE request_user = :requestingFriend
AND receive_user = :receivingFriend
AND expiry_time > :now
LIMIT 1;

SELECT *
FROM friends
WHERE (requesting_friend = :requestingFriend
AND receiving_friend = :receivingFriend)
OR (receiving_friend = :requestingFriend
AND requesting_friend = :receivingFriend)
LIMIT 1;

INSERT INTO friends (requesting_friend, receiving_friend, pending)
VALUES (:requestingFriend, :receivingFriend, true)
RETURNING *;
```

Accept a friend request:

```sql
UPDATE friends
SET pending = false
WHERE requesting_friend = :requestingFriend
AND receiving_friend = :receivingFriend;
```

Remove a friend (consequently they have a timeout from requesting again):

```sql
DELETE FROM friends
WHERE (requesting_friend = :requestingFriend
AND receiving_friend = :receivingFriend)
OR (receiving_friend = :requestingFriend
AND requesting_friend = :receivingFriend);

SELECT *
FROM request_timeout
WHERE request_user = :requestingFriend
AND receive_user = :receivingFriend
LIMIT 1;

UPDATE request_timeout
SET expiry_time = :expiryTime
WHERE request_user = :requestingFriend
AND receive_user = :receivingFriend;

INSERT INTO request_timeout (request_user, receive_user, expiry_time)
VALUES (:requestingFriend, :receivingFriend, :expiryTime);
```

Search for new friends:

```sql
SELECT *
FROM users
WHERE username != :username
AND username LIKE :query%
AND NOT EXISTS (
    SELECT requesting_friend
    FROM friends
    WHERE (requesting_friend = :username
    AND receiving_friend = users.username)
    OR (receiving_friend = :username
    AND requesting_friend = users.username)
);
```

Withdraw a friend request:

```sql
DELETE FROM friends
WHERE (requesting_friend = :requestingFriend
AND receiving_friend = :receivingFriend)
OR (receiving_friend = :requestingFriend
AND requesting_friend = :receivingFriend);
```

Get connections:

```sql
SELECT *
FROM friends
WHERE (requesting_friend = :username
OR receiving_friend = :username)
AND pending = false;
```

Get incoming friend requests:

```sql
SELECT *
FROM friends
WHERE receiving_friend = :username
AND pending = true;
```

Get sent friend requests:

```sql
SELECT *
FROM friends
WHERE requesting_friend = :username
AND pending = true;
```

Get non-friends:

```sql
SELECT *
FROM users
WHERE username != :username
AND NOT EXISTS (
    SELECT *
    FROM friends
    WHERE requesting_friend = :username
    AND receiving_friend = users.username
)
AND NOT EXISTS (
    SELECT *
    FROM friends
    WHERE receiving_friend = :username
    AND requesting_friend = users.username
);
```

## Stocks

Get stock data for a specific time period:
```sql
SELECT *
FROM stocks_daily
WHERE stock_symbol = :ticker
AND stock_date BETWEEN :startDate AND :endDate
ORDER BY stock_date ASC;
```

Get all stock data for a specific ticker:

```sql
SELECT *
FROM stocks_daily
WHERE stock_symbol = :ticker
ORDER BY stock_date ASC;
```

Get similar stock companies based on ticker:

```sql

SELECT *
FROM stocks
WHERE stock_symbol LIKE :ticker%
ORDER BY stock_symbol ASC;
```

Get stock company details by ticker:

```sql
SELECT *
FROM stocks
WHERE stock_symbol = :ticker;
```

Get all stock companies:

```sql
SELECT *
FROM stocks
ORDER BY stock_symbol ASC;
```

Get the most recent stock price:

```sql
SELECT close_price
FROM stocks_daily
WHERE stock_symbol = :stock_symbol
ORDER BY stock_date DESC
LIMIT 1;
```