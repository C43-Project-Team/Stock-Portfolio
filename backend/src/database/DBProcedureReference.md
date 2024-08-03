# SQL Procedure

## Drop Multiple Tables
This procedure drops all the tables from the database if they exist and is stored in the database called `del_all_tables()`. It is used to clean up or reset the database by removing the specified tables. This can be useful during development or when reinitializing the database schema.

```sql
DROP TABLE IF EXISTS access, contains, friends, investments, owns, portfolios, request_timeout, reviews, stocks, stocks_daily, stocks_list, users;
```

To execute this procedure, 
```sql
CALL public.del_all_tables();
```