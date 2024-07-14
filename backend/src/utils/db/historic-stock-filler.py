import yfinance as yf
import pandas as pd
import numpy as np
from IPython.display import display

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
    "MON": "TWX",
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
}


# List of ticker symbols
tickers = [
    "AAL", "AAPL", "AAP", "ABBV", "ABC", "ABT", "ACN", "ADBE", "ADI", "ADM",
    "ADP", "ADSK", "ADS", "AEE", "AEP", "AES", "AET", "AFL", "AGN", "AIG",
    "AIV", "AIZ", "AJG", "AKAM", "ALB", "ALGN", "ALK", "ALLE", "ALL", "ALXN",
    "AMAT", "AMD", "AME", "AMGN", "AMG", "AMP", "AMT", "AMZN", "ANDV", "ANSS",
    "ANTM", "AON", "AOS", "APA", "APC", "APD", "APH", "APTV", "ARE", "ARNC",
    "ATVI", "AVB", "AVGO", "AVY", "AWK", "AXP", "AYI", "AZO", "A", "BAC", 
    "BAX", "BA", "BBT", "BBY", "BDX", "BEN", "BF.B", "BHF", "BHGE", "BIIB",
    "BK", "BLK", "BLL", "BMY", "BRK.B", "BSX", "BWA", "BXP", "CAG", "CAH",
    "CAT", "CA", "CBG", "CBOE", "CBS", "CB", "CCI", "CCL", "CDNS", "CELG",
    "CERN", "CFG", "CF", "CHD", "CHK", "CHRW", "CHTR", "CINF", "CI", "CLX",
    "CL", "CMA", "CMCSA", "CME", "CMG", "CMI", "CMS", "CNC", "CNP", "COF",
    "COG", "COL", "COO", "COP", "COST", "COTY", "CPB", "CRM", "CSCO", "CSRA",
    "CSX", "CTAS", "CTL", "CTSH", "CTXS", "CVS", "CVX", "CXO", "C", "DAL",
    "DE", "DFS", "DGX", "DG", "DHI", "DHR", "DISCA", "DISCK", "DISH", "DIS",
    "DLR", "DLTR", "DOV", "DPS", "DRE", "DRI", "DTE", "DUK", "DVA", "DVN",
    "DWDP", "DXC", "D", "EA", "EBAY", "ECL", "ED", "EFX", "EIX", "EL", "EMN",
    "EMR", "EOG", "EQIX", "EQR", "EQT", "ESRX", "ESS", "ES", "ETFC", "ETN",
    "ETR", "EVHC", "EW", "EXC", "EXPD", "EXPE", "EXR", "FAST", "FBHS", "FB",
    "FCX", "FDX", "FE", "FFIV", "FISV", "FIS", "FITB", "FLIR", "FLR", "FLS",
    "FL", "FMC", "FOXA", "FOX", "FRT", "FTI", "FTV", "F", "GD", "GE", "GGP",
    "GILD", "GIS", "GLW", "GM", "GOOGL", "GOOG", "GPC", "GPN", "GPS", "GRMN",
    "GS", "GT", "GWW", "HAL", "HAS", "HBAN", "HBI", "HCA", "HCN", "HCP", "HD",
    "HES", "HIG", "HII", "HLT", "HOG", "HOLX", "HON", "HPE", "HPQ", "HP",
    "HRB", "HRL", "HRS", "HSIC", "HST", "HSY", "HUM", "IBM", "ICE", "IDXX",
    "IFF", "ILMN", "INCY", "INFO", "INTC", "INTU", "IPG", "IP", "IQV", "IRM",
    "IR", "ISRG", "ITW", "IT", "IVZ", "JBHT", "JCI", "JEC", "JNJ", "JNPR",
    "JPM", "JWN", "KEY", "KHC", "KIM", "KLAC", "KMB", "KMI", "KMX", "KORS",
    "KO", "KR", "KSS", "KSU", "K", "LB", "LEG", "LEN", "LH", "LKQ", "LLL",
    "LLY", "LMT", "LNC", "LNT", "LOW", "LRCX", "LUK", "LUV", "LYB", "L", 
    "MAA", "MAC", "MAR", "MAS", "MAT", "MA", "MCD", "MCHP", "MCK", "MCO",
    "MDLZ", "MDT", "MET", "MGM", "MHK", "MKC", "MLM", "MMC", "MMM", "MNST",
    "MON", "MOS", "MO", "MPC", "MRK", "MRO", "MSFT", "MSI", "MS", "MTB",
    "MTD", "MU", "MYL", "M", "NAVI", "NBL", "NCLH", "NDAQ", "NEE", "NEM",
    "NFLX", "NFX", "NI", "NKE", "NLSN", "NOC", "NOV", "NRG", "NSC", "NTAP",
    "NTRS", "NUE", "NVDA", "NWL", "NWSA", "NWS", "OKE", "OMC", "ORCL", "ORLY",
    "OXY", "O", "PAYX", "PBCT", "PCAR", "PCG", "PCLN", "PDCO", "PEG", "PEP",
    "PFE", "PFG", "PGR", "PG", "PHM", "PH", "PKG", "PKI", "PLD", "PM", "PNC",
    "PNR", "PNW", "PPG", "PPL", "PRGO", "PRU", "PSA", "PSX", "PVH", "PWR",
    "PXD", "PX", "PYPL", "QCOM", "QRVO", "RCL", "REGN", "REG", "RE", "RF",
    "RHI", "RHT", "RJF", "RL", "RMD", "ROK", "ROP", "ROST", "RRC", "RSG",
    "RTN", "SBAC", "SBUX", "SCG", "SCHW", "SEE", "SHW", "SIG", "SJM", "SLB",
    "SLG", "SNA", "SNI", "SNPS", "SO", "SPGI", "SPG", "SRCL", "SRE", "STI",
    "STT", "STX", "STZ", "SWKS", "SWK", "SYF", "SYK", "SYMC", "SYY", "TAP",
    "TDG", "TEL", "TGT", "TIF", "TJX", "TMK", "TMO", "TPR", "TRIP", "TROW",
    "TRV", "TSCO", "TSN", "TSS", "TWX", "TXN", "TXT", "T", "UAA", "UAL", "UA",
    "UDR", "UHS", "ULTA", "UNH", "UNM", "UNP", "UPS", "URI", "USB", "UTX",
    "VAR", "VFC", "VIAB", "VLO", "VMC", "VNO", "VRSK", "VRSN", "VRTX", "VTR",
    "VZ", "V", "WAT", "WBA", "WDC", "WEC", "WFC", "WHR", "WLTW", "WMB", "WMT",
    "WM", "WRK", "WU", "WYNN", "WYN", "WY", "XEC", "XEL", "XLNX", "XL", "XOM",
    "XRAY", "XRX", "XYL", "YUM", "ZBH", "ZION", "ZTS"
]

def swap_columns(df, col1, col2):
    col_list = list(df.columns)
    x, y = col_list.index(col1), col_list.index(col2)
    col_list[y], col_list[x] = col_list[x], col_list[y]
    df = df[col_list]
    return df

# Function to fetch historical data
def fetch_data(ticker, start_date='2018-02-08', end_date='2024-07-12'):
    # Uncomment for log file to record errors on unavaiable stocks
    # log_file = 'error_log.txt'

    try:
        stock = yf.Ticker(ticker)
        df = stock.history(start=start_date, end=end_date, actions=False)
        df['Code'] = ticker
        df = df[['Code', 'Open', 'Close', 'Low', 'High', 'Volume']]
        df = df.round({'Open': 2, 'Close': 2, 'Low': 2, 'High': 2})
        # df.index = df.index.date
        df.reset_index(inplace=True)
        df.rename(columns={'Date': 'Timestamp'}, inplace=True)
        df['Timestamp'] = df['Timestamp'].dt.strftime('%Y-%m-%d')
        return swap_columns(df, 'Timestamp', 'Code')
    except Exception as e:
        # with open(log_file, 'a') as f:
            # f.write(f"Error fetching data for {ticker}: {e}\n")
        return pd.DataFrame()


if __name__ == "__main__":
    # Fetch data for all tickers
    all_data = pd.concat([fetch_data(ticker_map.get(ticker, ticker)) for ticker in tickers])

    # Save to a CSV file without index
    all_data.to_csv('../data/stock_data_recent.csv', index=False)
    
    # Debugging
    # display(all_data.head(10))
    print("Data fetched and saved successfully!")
