import pandas as pd
import numpy as np
import sys
import json
import argparse
from IPython.display import display


def retriveData(data):
    return pd.DataFrame(data)

# Function to process mean reversion signals
def mean_reversion(data):

    data['Moving_Average_20'] = data['close_price'].rolling(window=2).mean()
    
    # Calculate the z-score for mean reversion
    data['Z_Score'] = (data['close_price'] - data['Moving_Average_20']) / data['close_price'].rolling(window=2).std()
    
    # Define a buy signal (e.g., when the z-score is below -1)
    data['Buy_Signal'] = data['Z_Score'] < -1
    
    # Define a sell signal (e.g., when the z-score is above 1)
    data['Sell_Signal'] = data['Z_Score'] > 1
    
    data = data.dropna()    
    result = data.to_json(orient='records')
    
    return result

parser = argparse.ArgumentParser(description="Mean Reversion Analysis")
parser.add_argument('ticker', type=str, help='Stock ticker symbol')
parser.add_argument('start_date', type=str, help='Start date in YYYY-MM-DD format')
parser.add_argument('end_date', type=str, help='End date in YYYY-MM-DD format')
parser.add_argument('data', type=str, help='JSON string of stock data')

args = parser.parse_args()

raw_data = args.data
print(sys.argv)

try:
    cleaned_data = json.loads(raw_data)

    df = retriveData(cleaned_data)

    result = mean_reversion(df)
    sys.stdout.write(result)
except json.JSONDecodeError as e:
    print(f"JSON decoding error: {e}")
    sys.exit(1)

