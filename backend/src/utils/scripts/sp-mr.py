import pandas as pd
import numpy as np
import sys
import json
import argparse
from IPython.display import display

# Function to fetch historical data
# def fetch_data(ticker, start_date='2018-02-08', end_date='2024-07-11'):
#     stock = yf.Ticker(ticker)
#     df = stock.history(start=start_date, end=end_date, actions=False)
#     return df

# # Fetch data for a single ticker as an example
# ticker = "AAPL"
# data = fetch_data(ticker)

# # Calculate the moving average (mean)
# data['Moving_Average_20'] = data['Close'].rolling(window=15).mean()

# # Calculate the z-score for mean reversion
# data['Z_Score'] = (data['Close'] - data['Moving_Average_20']) / data['Close'].rolling(window=15).std()

# # Define a buy signal (e.g., when the z-score is below -1)
# data['Buy_Signal'] = data['Z_Score'] < -1

# # Define a sell signal (e.g., when the z-score is above 1)
# data['Sell_Signal'] = data['Z_Score'] > 1

# Plot the stock price and signals
# plt.figure(figsize=(14, 7))
# plt.plot(data['Close'], label='Close Price')
# plt.plot(data['Moving_Average_20'], label='20-Day Moving Average', color='orange')
# plt.scatter(data.index[data['Buy_Signal']], data['Close'][data['Buy_Signal']], marker='^', color='g', label='Buy Signal', alpha=1)
# plt.scatter(data.index[data['Sell_Signal']], data['Close'][data['Sell_Signal']], marker='v', color='r', label='Sell Signal', alpha=1)
# plt.xlabel('Date')
# plt.ylabel('Price')
# plt.title(f'{ticker} Mean Reversion Strategy')
# plt.legend()
# plt.show()

# display(data.head(20))

def mean_reversion(data):
    data = pd.read_json(data)

    data['Moving_Average_20'] = data['close'].rolling(window=15).mean()
    data['Z_Score'] = (data['close'] - data['Moving_Average_20']) / data['close'].rolling(window=15).std()
    data['Buy_Signal'] = data['Z_Score'] < -1
    data['Sell_Signal'] = data['Z_Score'] > 1
    
    # Drop rows with NaN values
    data = data.dropna()
    
    # Convert data to JSON
    result = data[['date', 'close', 'Moving_Average_20', 'Z_Score', 'Buy_Signal', 'Sell_Signal']].reset_index().to_json(orient='records')
    
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mean Reversion Analysis")
    parser.add_argument('ticker', type=str, help='Stock ticker symbol')
    parser.add_argument('start_date', type=str, help='Start date in YYYY-MM-DD format')
    parser.add_argument('end_date', type=str, help='End date in YYYY-MM-DD format')
    parser.add_argument('data', type=str, help='JSON string of stock data')
    
    args = parser.parse_args()
    
    data = args.data
    
    result = mean_reversion(data)
    print(result)