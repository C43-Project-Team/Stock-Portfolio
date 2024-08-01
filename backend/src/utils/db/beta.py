import yfinance as yf
import json
import psycopg2
from psycopg2 import sql
from IPython.display import display
import dotenv
import os

dotenv.load_dotenv()
DB_NAME = os.getenv("DATABASE_NAME")
DB_HOST = os.getenv("DATABASE_HOST")
DB_PORT = os.getenv("DATABASE_PORT")
DB_USER = os.getenv("DATABASE_USER")
DB_PASS = os.getenv("DATABASE_PASSWORD")

def get_beta(ticker) -> float:
    stock = yf.Ticker(ticker)
    beta = stock.info["beta"]
    return beta

def get_stock_desc(ticker) -> str:
    stock = yf.Ticker(ticker)
    desc = stock.info.get("longBusinessSummary", "")
    return desc

def update_stock_description(cursor, stock_symbol, description):
    query = sql.SQL("UPDATE stocks SET description = %s WHERE stock_symbol = %s")
    cursor.execute(query, (description, stock_symbol))

load_stock_meta_data = json.loads(open('../data/stock_meta_data.json').read())
tickers = load_stock_meta_data["tickers"]

db_params = {
    "dbname": DB_NAME,
    "user": DB_USER,
    "password": DB_PASS,
    "host": DB_HOST,
    "port": DB_PORT
}

try:
    # conn = psycopg2.connect(**db_params)
    # cursor = conn.cursor()

    # for ticker in tickers:
    #     description = get_stock_desc(ticker)
    #     update_stock_description(cursor, ticker, description)

    display(get_SP500_data("2024-07-13", "2024-07-19")).head(10)

    # conn.commit()
    print("Stock descriptions updated successfully.")

except Exception as e:
    print(f"An error occurred: {e}")

# finally:
    # if conn:
    #     cursor.close()
    #     conn.close()
