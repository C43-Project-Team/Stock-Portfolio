import yfinance as yf
import pandas as pd
import numpy as np
import psycopg2
from datetime import datetime, timedelta
from IPython.display import display
import json
import dotenv
import os

dotenv.load_dotenv()
DB_NAME = os.getenv("DATABASE_NAME")
DB_HOST = os.getenv("DATABASE_HOST")
DB_PORT = os.getenv("DATABASE_PORT")
DB_USER = os.getenv("DATABASE_USER")
DB_PASS = os.getenv("DATABASE_PASSWORD")

# Load stock metadata
with open('../data/stock_meta_data.json') as f:
    load_stock_meta_data = json.load(f)

# List of ticker symbols
tickers = load_stock_meta_data["tickers"]

ticker_map = {
    "ABC": "CHRW", "ADS": "APD", "AGN": "CL", "ALXN": "BDX", "ANTM": "CDNS",
    "APC": "AJG", "ARNC": "BA", "ATVI": "TSCO", "BBT": "CHTR", "BF.B": "TPR",
    "BHGE": "AMD", "BLL": "TGT", "BRK.B": "CB", "CBG": "TRV", "CBS": "AYI",
    "CELG": "CHD", "CERN": "APH", "COG": "A", "CTL": "BXP", "CTXS": "TJX",
    "CXO": "AXP", "DISCA": "NTAP", "DISCK": "CA", "DISH": "BK", "DPS": "TMO",
    "DRE": "CF", "DWDP": "BEN", "ETFC": "BAC", "FBHS": "CAG", "FB": "AWK",
    "FLIR": "CCL", "GGP": "BBY", "HCN": "APA", "HRS": "BLK", "INFO": "ARE",
    "JEC": "CCI", "KORS": "ALB", "KSU": "AMGN", "LLL": "TRIP", "LUK": "ANSS",
    "MON": "SPG", "MYL": "BWA", "NBL": "BSX", "NLSN": "BHF", "PBCT": "CAH",
    "PCLN": "TSN", "PKI": "TDG", "PXD": "CMA", "RE": "CI", "RHT": "ALK",
    "RTN": "ALL", "SYMC": "AIG", "TIF": "AMT", "TMK": "AMP", "TSS": "BMY",
    "UTX": "CINF", "VAR": "NTRS", "VIAB": "CFG", "WLTW": "AIZ", "WYN": "NSC",
    "XEC": "AVY", "XLNX": "APTV", "XL": "CAT", "AET": "HUM", "ANDV": "MPC",
    "COL": "HON", "CSRA": "DXC", "ESRX": "CVS", "EVHC": "HCA", "TWX": "MSFT",
    "NFX": "APA", "SCG": "D", "SNI": "A", "WRK": "IP"
}

def swap_columns(df, col1, col2):
    col_list = list(df.columns)
    x, y = col_list.index(col1), col_list.index(col2)
    col_list[y], col_list[x] = col_list[x], col_list[y]
    df = df[col_list]
    return df

def fetch_data(ticker, og_ticker_name, start_date, end_date):
    log_file = '../logs/error_log.txt'
    os.makedirs(os.path.dirname(log_file), exist_ok=True)

    try:
        stock = yf.Ticker(ticker)
        df = stock.history(start=start_date, end=end_date, actions=False)
        df['Code'] = og_ticker_name
        df = df[['Code', 'Open', 'Close', 'Low', 'High', 'Volume']]
        df = df.round({'Open': 2, 'Close': 2, 'Low': 2, 'High': 2})
        df.reset_index(inplace=True)
        df.rename(columns={'Date': 'Timestamp'}, inplace=True)
        df['Timestamp'] = pd.to_datetime(df['Timestamp']).dt.strftime('%Y-%m-%d')
        return swap_columns(df, 'Timestamp', 'Code')
    except Exception as e:
        with open(log_file, 'a') as f:
            f.write(f"{datetime.today().date().strftime('%Y-%m-%d')} Error fetching data for {ticker}: {e}\n")
        return pd.DataFrame()

def insert_data_to_market_index_daily(df):
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        cur = conn.cursor()

        for index, row in df.iterrows():
            cur.execute("""
                INSERT INTO market_index_daily (stock_date, open_price, close_price, low, high, volume, return)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (row['Timestamp'], row['Open'], row['Close'], row['Low'], row['High'], row['Volume'], None))

        conn.commit()
        cur.close()
        conn.close()
        print("Data inserted successfully market index table!")
    except Exception as e:
        print(f"Error inserting data into the database: {e}")


def insert_data_to_stocks_daily(df):
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        cur = conn.cursor()

        for index, row in df.iterrows():
            cur.execute("""
                INSERT INTO stocks_daily (stock_symbol, stock_date, open_price, close_price, low, high, volume, return)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (row['Code'], row['Timestamp'], row['Open'], row['Close'], row['Low'], row['High'], row['Volume'], None))

        conn.commit()
        cur.close()
        conn.close()
        print("Data inserted successfully in stocks daily table!")
    except Exception as e:
        print(f"Error inserting data into the database: {e}")

if __name__ == "__main__":
    end_date = datetime.today().strftime('%Y-%m-%d')
    start_date = (datetime.today() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    all_data = pd.concat([fetch_data(ticker_map.get(ticker, ticker), ticker, start_date, end_date) for ticker in tickers])
    all_data['Return'] = None
    insert_data_to_stocks_daily(all_data)

    market_index_data = pd.concat([fetch_data("^GSPC", "^GSPC", start_date, end_date)])
    market_index_data['Return'] = None
    insert_data_to_market_index_daily(market_index_data)

    # Debugging
    # display(all_data)
    # display(market_index_data)
    print("Data fetched, modified, and inserted successfully!")
