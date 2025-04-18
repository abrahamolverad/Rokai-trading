"""
Data collection module for the AI Trading Platform.

This module handles fetching, processing, and storing market data from various sources.
"""

import os
import sys
import time
import logging
import pandas as pd
from datetime import datetime, timedelta
import json
import requests
from concurrent.futures import ThreadPoolExecutor

# Add path for data API access
sys.path.append('/opt/.manus/.sandbox-runtime')

# Import configuration
from config import (
    API_KEYS, DATA_SOURCES, MARKET_DATA_TYPES, ASSET_CLASSES,
    DEFAULT_TICKERS, DATA_FREQUENCIES, HISTORICAL_RANGES,
    DATABASE, REDIS_CONFIG, LOGGING, ERROR_HANDLING, PERFORMANCE_MONITORING
)

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOGGING["level"]),
    format=LOGGING["format"],
    filename=LOGGING["file"],
)
logger = logging.getLogger("data_collection")

# Import data API client for Yahoo Finance
try:
    from data_api import ApiClient
    yahoo_client = ApiClient()
    logger.info("Successfully initialized Yahoo Finance API client")
except ImportError:
    logger.warning("Could not import data_api module. Yahoo Finance API will not be available.")
    yahoo_client = None

class DataCollector:
    """Main class for collecting market data from various sources."""
    
    def __init__(self):
        """Initialize the DataCollector with configuration settings."""
        self.api_keys = API_KEYS
        self.data_sources = DATA_SOURCES
        self.tickers = DEFAULT_TICKERS
        self.frequencies = DATA_FREQUENCIES
        self.historical_ranges = HISTORICAL_RANGES
        self.error_handling = ERROR_HANDLING
        
        # Initialize connection to database (placeholder for actual implementation)
        self.db_connection = self._init_database()
        
        # Initialize Redis cache (placeholder for actual implementation)
        self.cache = self._init_cache()
        
        logger.info("DataCollector initialized successfully")
    
    def _init_database(self):
        """Initialize database connection."""
        # This is a placeholder for actual database connection code
        logger.info(f"Database connection initialized to {DATABASE['type']} at {DATABASE['host']}")
        return None
    
    def _init_cache(self):
        """Initialize Redis cache connection."""
        # This is a placeholder for actual Redis connection code
        logger.info(f"Redis cache connection initialized at {REDIS_CONFIG['host']}")
        return None
    
    def collect_historical_data(self, tickers=None, data_type="ohlcv", 
                               time_range="medium_term", frequency="daily"):
        """
        Collect historical market data for specified tickers.
        
        Args:
            tickers (list): List of ticker symbols to collect data for
            data_type (str): Type of data to collect (ohlcv, technical_indicators, etc.)
            time_range (str): Time range for historical data
            frequency (str): Data frequency
            
        Returns:
            dict: Dictionary of DataFrames with collected data
        """
        tickers = tickers or self.tickers
        time_range = self.historical_ranges.get(time_range, "1mo")
        frequency = self.frequencies.get(frequency, "1d")
        
        logger.info(f"Collecting {data_type} data for {len(tickers)} tickers at {frequency} frequency for {time_range} range")
        
        results = {}
        
        # Use ThreadPoolExecutor for parallel data collection
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(self._fetch_ticker_data, ticker, data_type, time_range, frequency): ticker for ticker in tickers}
            
            for future in futures:
                ticker = futures[future]
                try:
                    data = future.result()
                    if data is not None:
                        results[ticker] = data
                        logger.debug(f"Successfully collected data for {ticker}")
                    else:
                        logger.warning(f"No data returned for {ticker}")
                except Exception as e:
                    logger.error(f"Error collecting data for {ticker}: {str(e)}")
        
        logger.info(f"Completed data collection for {len(results)}/{len(tickers)} tickers")
        return results
    
    def _fetch_ticker_data(self, ticker, data_type, time_range, frequency):
        """
        Fetch data for a single ticker from the primary data source.
        Falls back to secondary sources if primary fails.
        
        Args:
            ticker (str): Ticker symbol
            data_type (str): Type of data to collect
            time_range (str): Time range for historical data
            frequency (str): Data frequency
            
        Returns:
            pandas.DataFrame: DataFrame with collected data
        """
        # Try primary data source first
        primary_source = self.data_sources["primary"]
        
        for attempt in range(self.error_handling["max_retries"]):
            try:
                if primary_source == "yahoo_finance" and yahoo_client is not None:
                    return self._fetch_from_yahoo(ticker, data_type, time_range, frequency)
                elif primary_source == "polygon":
                    return self._fetch_from_polygon(ticker, data_type, time_range, frequency)
                elif primary_source == "alpha_vantage":
                    return self._fetch_from_alpha_vantage(ticker, data_type, time_range, frequency)
                else:
                    logger.error(f"Unknown primary data source: {primary_source}")
                    break
            except Exception as e:
                logger.warning(f"Attempt {attempt+1} failed for {ticker} from {primary_source}: {str(e)}")
                time.sleep(self.error_handling["retry_delay"])
        
        # If primary source failed and fallback is enabled, try secondary source
        if self.error_handling["fallback_source"]:
            secondary_source = self.data_sources["secondary"]
            logger.info(f"Falling back to {secondary_source} for {ticker}")
            
            try:
                if secondary_source == "yahoo_finance" and yahoo_client is not None:
                    return self._fetch_from_yahoo(ticker, data_type, time_range, frequency)
                elif secondary_source == "polygon":
                    return self._fetch_from_polygon(ticker, data_type, time_range, frequency)
                elif secondary_source == "alpha_vantage":
                    return self._fetch_from_alpha_vantage(ticker, data_type, time_range, frequency)
                else:
                    logger.error(f"Unknown secondary data source: {secondary_source}")
            except Exception as e:
                logger.error(f"Secondary source {secondary_source} failed for {ticker}: {str(e)}")
        
        return None
    
    def _fetch_from_yahoo(self, ticker, data_type, time_range, frequency):
        """
        Fetch data from Yahoo Finance API.
        
        Args:
            ticker (str): Ticker symbol
            data_type (str): Type of data to collect
            time_range (str): Time range for historical data
            frequency (str): Data frequency
            
        Returns:
            pandas.DataFrame: DataFrame with collected data
        """
        logger.debug(f"Fetching {ticker} data from Yahoo Finance")
        
        if data_type == "ohlcv":
            # Use the Yahoo Finance API to get stock chart data
            response = yahoo_client.call_api('YahooFinance/get_stock_chart', query={
                'symbol': ticker,
                'interval': frequency,
                'range': time_range,
                'includeAdjustedClose': True
            })
            
            # Process the response into a DataFrame
            if response and 'chart' in response and 'result' in response['chart'] and response['chart']['result']:
                result = response['chart']['result'][0]
                
                # Extract timestamp and quote data
                timestamps = result.get('timestamp', [])
                quotes = result.get('indicators', {}).get('quote', [{}])[0]
                
                # Create DataFrame
                df = pd.DataFrame({
                    'timestamp': [datetime.fromtimestamp(ts) for ts in timestamps],
                    'open': quotes.get('open', []),
                    'high': quotes.get('high', []),
                    'low': quotes.get('low', []),
                    'close': quotes.get('close', []),
                    'volume': quotes.get('volume', [])
                })
                
                # Add adjusted close if available
                if 'adjclose' in result.get('indicators', {}):
                    adj_close = result['indicators']['adjclose'][0].get('adjclose', [])
                    if len(adj_close) == len(df):
                        df['adj_close'] = adj_close
                
                return df
            
            logger.warning(f"Invalid response format from Yahoo Finance for {ticker}")
            return None
        
        elif data_type == "fundamentals":
            # Use the Yahoo Finance API to get stock insights
            response = yahoo_client.call_api('YahooFinance/get_stock_insights', query={
                'symbol': ticker
            })
            
            # Process the response into a DataFrame (simplified for now)
            if response and 'finance' in response and 'result' in response['finance']:
                # Convert to DataFrame (this would need more processing in a real implementation)
                return pd.DataFrame([response['finance']['result']])
            
            logger.warning(f"Invalid response format from Yahoo Finance insights for {ticker}")
            return None
        
        else:
            logger.warning(f"Unsupported data type {data_type} for Yahoo Finance")
            return None
    
    def _fetch_from_polygon(self, ticker, data_type, time_range, frequency):
        """
        Fetch data from Polygon.io API.
        
        Args:
            ticker (str): Ticker symbol
            data_type (str): Type of data to collect
            time_range (str): Time range for historical data
            frequency (str): Data frequency
            
        Returns:
            pandas.DataFrame: DataFrame with collected data
        """
        logger.debug(f"Fetching {ticker} data from Polygon.io")
        
        # This is a placeholder for actual Polygon.io API implementation
        # In a real implementation, we would use the Polygon.io API key and endpoints
        
        api_key = self.api_keys.get("polygon")
        if not api_key:
            logger.error("Polygon.io API key not configured")
            return None
        
        # Convert time_range to start_date
        end_date = datetime.now()
        if time_range == "1mo":
            start_date = end_date - timedelta(days=30)
        elif time_range == "6mo":
            start_date = end_date - timedelta(days=180)
        elif time_range == "1y":
            start_date = end_date - timedelta(days=365)
        elif time_range == "5y":
            start_date = end_date - timedelta(days=365*5)
        else:
            start_date = end_date - timedelta(days=30)  # Default to 1 month
        
        # Format dates for API
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        
        # Map frequency to Polygon.io timespan
        timespan_map = {
            "1m": "minute",
            "5m": "minute",
            "1h": "hour",
            "1d": "day",
            "1wk": "week",
            "1mo": "month"
        }
        timespan = timespan_map.get(frequency, "day")
        
        # Determine multiplier based on frequency
        multiplier = 1
        if frequency == "5m":
            multiplier = 5
        
        if data_type == "ohlcv":
            # Construct URL for Polygon.io Aggregates (OHLC) endpoint
            url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{start_date_str}/{end_date_str}?apiKey={api_key}"
            
            try:
                response = requests.get(url)
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") == "OK" and "results" in data:
                    # Convert results to DataFrame
                    df = pd.DataFrame(data["results"])
                    
                    # Rename columns to match our standard format
                    column_map = {
                        "t": "timestamp",
                        "o": "open",
                        "h": "high",
                        "l": "low",
                        "c": "close",
                        "v": "volume"
                    }
                    df = df.rename(columns=column_map)
                    
                    # Convert timestamp from milliseconds to datetime
                    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
                    
                    return df
                
                logger.warning(f"Invalid response from Polygon.io for {ticker}: {data.get('status')}")
                return None
                
            except Exception as e:
                logger.error(f"Error fetching data from Polygon.io for {ticker}: {str(e)}")
                return None
        
        else:
            logger.warning(f"Unsupported data type {data_type} for Polygon.io")
            return None
    
    def _fetch_from_alpha_vantage(self, ticker, data_type, time_range, frequency):
        """
        Fetch data from Alpha Vantage API.
        
        Args:
            ticker (str): Ticker symbol
            data_type (str): Type of data to collect
            time_range (str): Time range for historical data
            frequency (str): Data frequency
            
        Returns:
            pandas.DataFrame: DataFrame with collected data
        """
        logger.debug(f"Fetching {ticker} data from Alpha Vantage")
        
        # This is a placeholder for actual Alpha Vantage API implementation
        # In a real implementation, we would use the Alpha Vantage API key and endpoints
        
        api_key = self.api_keys.get("alpha_vantage")
        if not api_key:
            logger.error("Alpha Vantage API key not configured")
            return None
        
        # Map frequency to Alpha Vantage function and interval
        function = "TIME_SERIES_DAILY_ADJUSTED"
        interval = None
        
        if frequency in ["1m", "5m", "15m", "30m", "60m"]:
            function = "TIME_SERIES_INTRADAY"
            interval = frequency
        elif frequency == "1d":
            function = "TIME_SERIES_DAILY_ADJUSTED"
        elif frequency == "1wk":
            function = "TIME_SERIES_WEEKLY_ADJUSTED"
        elif frequency == "1mo":
            function = "TIME_SERIES_MONTHLY_ADJUSTED"
        
        if data_type == "ohlcv":
            # Construct URL for Alpha Vantage API
            url = f"https://www.alphavantage.co/query?function={function}&symbol={ticker}&apikey={api_key}"
            
            if interval:
                url += f"&interval={interval}"
            
            try:
                response = requests.get(url)
                response.raise_for_status()
                data = response.json()
                
                # Extract time series data based on the function
                time_series_key = None
                if function == "TIME_SERIES_INTRADAY":
                    time_series_key = f"Time Series ({interval})"
                elif function == "TIME_SERIES_DAILY_ADJUSTED":
                    time_series_key = "Time 
(Content truncated due to size limit. Use line ranges to read in chunks)