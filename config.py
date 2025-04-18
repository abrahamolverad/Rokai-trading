"""
Configuration settings for the data collection system.
"""

# API Keys and Authentication
API_KEYS = {
    "polygon": "",  # Add your Polygon.io API key here
    "alpha_vantage": "",  # Add your Alpha Vantage API key here
    "finnhub": "",  # Add your Finnhub API key here
}

# Data Sources Configuration
DATA_SOURCES = {
    "primary": "yahoo_finance",  # Using built-in Yahoo Finance API
    "secondary": "polygon",  # Polygon.io as backup
    "alternative": "alpha_vantage",  # Alpha Vantage for additional data
}

# Market Data Types
MARKET_DATA_TYPES = [
    "ohlcv",  # Open, High, Low, Close, Volume
    "technical_indicators",
    "fundamentals",
    "news",
    "sentiment",
]

# Asset Classes
ASSET_CLASSES = [
    "stocks",
    "etfs",
    "indices",
    "forex",
    "crypto",
]

# Default Tickers to Monitor
DEFAULT_TICKERS = [
    # Major Tech Stocks (MAG7)
    "AAPL",  # Apple
    "MSFT",  # Microsoft
    "GOOGL",  # Alphabet/Google
    "AMZN",  # Amazon
    "META",  # Meta/Facebook
    "NVDA",  # NVIDIA
    "TSLA",  # Tesla
    
    # Financial Stocks
    "JPM",   # JPMorgan Chase
    "GS",    # Goldman Sachs
    "BRK-B", # Berkshire Hathaway
    
    # Other Major Stocks
    "COST",  # Costco
    
    # ETFs
    "SPY",   # S&P 500 ETF
    "QQQ",   # Nasdaq 100 ETF
    "DIA",   # Dow Jones Industrial Average ETF
    "IWM",   # Russell 2000 ETF
    
    # Indices
    "^GSPC", # S&P 500 Index
    "^NDX",  # Nasdaq 100 Index
    "^DJI",  # Dow Jones Industrial Average
]

# Data Collection Frequencies
DATA_FREQUENCIES = {
    "real_time": "1m",     # 1 minute for real-time trading
    "intraday": "5m",      # 5 minutes for intraday analysis
    "daily": "1d",         # Daily for longer-term analysis
    "historical": "1d",    # Daily for historical analysis
}

# Time Ranges for Historical Data
HISTORICAL_RANGES = {
    "short_term": "1mo",   # 1 month
    "medium_term": "6mo",  # 6 months
    "long_term": "1y",     # 1 year
    "extended": "5y",      # 5 years
}

# Database Configuration
DATABASE = {
    "type": "timescaledb",  # TimescaleDB for time-series data
    "host": "localhost",
    "port": 5432,
    "name": "trading_data",
    "user": "postgres",
    "password": "",  # Set password in environment variable
}

# Redis Cache Configuration
REDIS_CONFIG = {
    "host": "localhost",
    "port": 6379,
    "db": 0,
    "password": "",  # Set password in environment variable
}

# Logging Configuration
LOGGING = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "/home/ubuntu/trading_ai_platform/logs/data_collection.log",
}

# Error Handling
ERROR_HANDLING = {
    "max_retries": 3,
    "retry_delay": 5,  # seconds
    "fallback_source": True,  # Use secondary source if primary fails
}

# Performance Monitoring
PERFORMANCE_MONITORING = {
    "enabled": True,
    "metrics": ["latency", "throughput", "error_rate"],
    "alert_threshold": {
        "latency": 1000,  # milliseconds
        "error_rate": 0.05,  # 5%
    },
}
