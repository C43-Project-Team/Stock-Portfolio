import yfinance as yf
import pandas as pd
import numpy as np
from IPython.display import display
import json
from datetime import datetime

load_stock_meta_data = json.loads(open('../data/stock_meta_data.json').read())

# List of ticker symbols
tickers = load_stock_meta_data["tickers"]

ticker_map = {
    "ABC": "CHRW",
    "ADS": "APD",
    "AGN": "CL",
    "ALXN": "BDX",
    "ANTM": "CDNS",
    "APC": "AJG",
    "ARNC": "BA",
    "ATVI": "TSCO",
    "BBT": "CHTR",
    "BF.B": "TPR",
    "BHGE": "AMD",
    "BLL": "TGT",
    "BRK.B": "CB",
    "CBG": "TRV",
    "CBS": "AYI",
    "CELG": "CHD",
    "CERN": "APH",
    "COG": "A",
    "CTL": "BXP",
    "CTXS": "TJX",
    "CXO": "AXP",
    "DISCA": "NTAP",
    "DISCK": "CA",
    "DISH": "BK",
    "DPS": "TMO",
    "DRE": "CF",
    "DWDP": "BEN",
    "ETFC": "BAC",
    "FBHS": "CAG",
    "FB": "AWK",
    "FLIR": "CCL",
    "GGP": "BBY",
    "HCN": "APA",
    "HRS": "BLK",
    "INFO": "ARE",
    "JEC": "CCI",
    "KORS": "ALB",
    "KSU": "AMGN",
    "LLL": "TRIP",
    "LUK": "ANSS",
    "MON": "SPG",
    "MYL": "BWA",
    "NBL": "BSX",
    "NLSN": "BHF",
    "PBCT": "CAH",
    "PCLN": "TSN",
    "PKI": "TDG",
    "PXD": "CMA",
    "RE": "CI",
    "RHT": "ALK",
    "RTN": "ALL",
    "SYMC": "AIG",
    "TIF": "AMT",
    "TMK": "AMP",
    "TSS": "BMY",
    "UTX": "CINF",
    "VAR": "NTRS",
    "VIAB": "CFG",
    "WLTW": "AIZ",
    "WYN": "NSC",
    "XEC": "AVY",
    "XLNX": "APTV",
    "XL": "CAT",
    "AET": "HUM",
    "ANDV": "MPC",
    "COL": "HON",
    "CSRA": "DXC",
    "ESRX": "CVS",
    "EVHC": "HCA",
    "TWX": "MSFT",
    "NFX": "APA",
    "SCG": "D",
    "SNI": "A",
    "WRK": "IP"
}

def swap_columns(df, col1, col2):
    col_list = list(df.columns)
    x, y = col_list.index(col1), col_list.index(col2)
    col_list[y], col_list[x] = col_list[x], col_list[y]
    df = df[col_list]
    return df

# Function to fetch historical data
# 1st given timeline: 2013-02-08 to 2018-02-07
# 2nd timeline: 2018-02-08 to 2024-07-12
# 3rd timeline: 2024-07-13 to 2024-07-19
def fetch_data(ticker, og_ticker_name, start_date='2024-07-13', end_date='2024-07-19'):
    # Uncomment for log file to record errors on unavaiable stocks
    log_file = '../logs/error_log.txt'

    try:
        stock = yf.Ticker(ticker)
        # print(ticker)
        df = stock.history(start=start_date, end=end_date, actions=False)
        df['Code'] = og_ticker_name
        df = df[['Code', 'Open', 'Close', 'Low', 'High', 'Volume']]
        df = df.round({'Open': 2, 'Close': 2, 'Low': 2, 'High': 2})
        # df.index = df.index.date
        df.reset_index(inplace=True)
        df.rename(columns={'Date': 'Timestamp'}, inplace=True)
        df['Timestamp'] = df['Timestamp'].dt.strftime('%Y-%m-%d')
        return swap_columns(df, 'Timestamp', 'Code')
    except Exception as e:
        with open(log_file, 'a') as f:
            f.write(f"{datetime.today().date().strftime('%Y-%m-%d')} Error fetching data for {ticker}: {e}\n")
        return pd.DataFrame()


if __name__ == "__main__":
    # Fetch data for all tickers
    all_data = pd.concat([fetch_data(ticker_map.get(ticker, ticker), ticker) for ticker in tickers])

    # Save to a CSV file without index
    all_data.to_csv('../data/stock_data_3.csv', index=False)
    
    # Debugging
    # display(all_data.head(10))
    print("Data fetched and saved successfully!")
