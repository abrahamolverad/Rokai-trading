"""
Implementation of AI prediction models for the trading platform.

This module contains the implementation of various AI models for predicting
stock prices and generating trading signals.
"""

import os
import sys
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from sklearn.ensemble import RandomForestRegressor
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model, Model
from tensorflow.keras.layers import Dense, LSTM, Dropout, GRU, Input, Concatenate
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import xgboost as xgb
import joblib

# Import configuration
from config import (
    MODEL_TYPES, DEFAULT_MODELS, FEATURE_ENGINEERING, SEQUENCE_LENGTHS,
    PREDICTION_HORIZONS, LSTM_CONFIG, XGBOOST_CONFIG, RANDOM_FOREST_CONFIG,
    ENSEMBLE_CONFIG, CROSS_VALIDATION, EVALUATION_METRICS,
    HYPERPARAMETER_TUNING, MODEL_PERSISTENCE, LOGGING, PERFORMANCE_MONITORING
)

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOGGING["level"]),
    format=LOGGING["format"],
    filename=LOGGING["file"],
)
logger = logging.getLogger("ai_models")

# Create model save directory if it doesn't exist
os.makedirs(MODEL_PERSISTENCE["save_dir"], exist_ok=True)


class FeatureEngineering:
    """Class for engineering features from raw stock data."""
    
    def __init__(self):
        """Initialize the FeatureEngineering class."""
        self.price_scaler = None
        self.feature_scalers = {}
        logger.info("FeatureEngineering initialized")
    
    def create_technical_indicators(self, df):
        """
        Create technical indicators from price data.
        
        Args:
            df (pandas.DataFrame): DataFrame with OHLCV data
            
        Returns:
            pandas.DataFrame: DataFrame with technical indicators
        """
        logger.info("Creating technical indicators")
        
        # Make a copy to avoid modifying the original
        df_features = df.copy()
        
        # Simple Moving Averages
        if "sma" in FEATURE_ENGINEERING["technical_indicators"]:
            df_features['sma_5'] = df['close'].rolling(window=5).mean()
            df_features['sma_10'] = df['close'].rolling(window=10).mean()
            df_features['sma_20'] = df['close'].rolling(window=20).mean()
            df_features['sma_50'] = df['close'].rolling(window=50).mean()
            df_features['sma_200'] = df['close'].rolling(window=200).mean()
        
        # Exponential Moving Averages
        if "ema" in FEATURE_ENGINEERING["technical_indicators"]:
            df_features['ema_5'] = df['close'].ewm(span=5, adjust=False).mean()
            df_features['ema_10'] = df['close'].ewm(span=10, adjust=False).mean()
            df_features['ema_20'] = df['close'].ewm(span=20, adjust=False).mean()
            df_features['ema_50'] = df['close'].ewm(span=50, adjust=False).mean()
            df_features['ema_200'] = df['close'].ewm(span=200, adjust=False).mean()
        
        # Relative Strength Index (RSI)
        if "rsi" in FEATURE_ENGINEERING["technical_indicators"]:
            delta = df['close'].diff()
            gain = delta.where(delta > 0, 0)
            loss = -delta.where(delta < 0, 0)
            
            avg_gain = gain.rolling(window=14).mean()
            avg_loss = loss.rolling(window=14).mean()
            
            rs = avg_gain / avg_loss
            df_features['rsi_14'] = 100 - (100 / (1 + rs))
        
        # Moving Average Convergence Divergence (MACD)
        if "macd" in FEATURE_ENGINEERING["technical_indicators"]:
            ema_12 = df['close'].ewm(span=12, adjust=False).mean()
            ema_26 = df['close'].ewm(span=26, adjust=False).mean()
            df_features['macd'] = ema_12 - ema_26
            df_features['macd_signal'] = df_features['macd'].ewm(span=9, adjust=False).mean()
            df_features['macd_hist'] = df_features['macd'] - df_features['macd_signal']
        
        # Bollinger Bands
        if "bollinger" in FEATURE_ENGINEERING["technical_indicators"]:
            df_features['bollinger_mid'] = df['close'].rolling(window=20).mean()
            df_features['bollinger_std'] = df['close'].rolling(window=20).std()
            df_features['bollinger_upper'] = df_features['bollinger_mid'] + 2 * df_features['bollinger_std']
            df_features['bollinger_lower'] = df_features['bollinger_mid'] - 2 * df_features['bollinger_std']
            df_features['bollinger_width'] = (df_features['bollinger_upper'] - df_features['bollinger_lower']) / df_features['bollinger_mid']
        
        # Stochastic Oscillator
        if "stochastic" in FEATURE_ENGINEERING["technical_indicators"]:
            n = 14
            df_features['stoch_k'] = 100 * ((df['close'] - df['low'].rolling(window=n).min()) / 
                                           (df['high'].rolling(window=n).max() - df['low'].rolling(window=n).min()))
            df_features['stoch_d'] = df_features['stoch_k'].rolling(window=3).mean()
        
        # Average True Range (ATR)
        if "atr" in FEATURE_ENGINEERING["technical_indicators"]:
            high_low = df['high'] - df['low']
            high_close = (df['high'] - df['close'].shift()).abs()
            low_close = (df['low'] - df['close'].shift()).abs()
            
            ranges = pd.concat([high_low, high_close, low_close], axis=1)
            true_range = ranges.max(axis=1)
            
            df_features['atr_14'] = true_range.rolling(window=14).mean()
        
        # On-Balance Volume (OBV)
        if "obv" in FEATURE_ENGINEERING["technical_indicators"]:
            obv = (np.sign(df['close'].diff()) * df['volume']).fillna(0).cumsum()
            df_features['obv'] = obv
        
        # Drop NaN values created by rolling windows
        df_features = df_features.dropna()
        
        logger.info(f"Created {len(df_features.columns) - len(df.columns)} technical indicators")
        return df_features
    
    def create_price_transformations(self, df):
        """
        Create price transformations.
        
        Args:
            df (pandas.DataFrame): DataFrame with price data
            
        Returns:
            pandas.DataFrame: DataFrame with price transformations
        """
        logger.info("Creating price transformations")
        
        # Make a copy to avoid modifying the original
        df_features = df.copy()
        
        # Daily returns
        if "returns" in FEATURE_ENGINEERING["price_transformations"]:
            df_features['daily_return'] = df['close'].pct_change()
            df_features['daily_return_lag1'] = df_features['daily_return'].shift(1)
            df_features['daily_return_lag2'] = df_features['daily_return'].shift(2)
            df_features['daily_return_lag3'] = df_features['daily_return'].shift(3)
        
        # Logarithmic returns
        if "log_returns" in FEATURE_ENGINEERING["price_transformations"]:
            df_features['log_return'] = np.log(df['close'] / df['close'].shift(1))
            df_features['log_return_lag1'] = df_features['log_return'].shift(1)
            df_features['log_return_lag2'] = df_features['log_return'].shift(2)
            df_features['log_return_lag3'] = df_features['log_return'].shift(3)
        
        # Price momentum (percent change over different periods)
        df_features['price_momentum_5d'] = df['close'].pct_change(periods=5)
        df_features['price_momentum_10d'] = df['close'].pct_change(periods=10)
        df_features['price_momentum_20d'] = df['close'].pct_change(periods=20)
        
        # Volatility (standard deviation of returns over different periods)
        df_features['volatility_5d'] = df_features['daily_return'].rolling(window=5).std()
        df_features['volatility_10d'] = df_features['daily_return'].rolling(window=10).std()
        df_features['volatility_20d'] = df_features['daily_return'].rolling(window=20).std()
        
        # Drop NaN values created by shifting and rolling windows
        df_features = df_features.dropna()
        
        logger.info(f"Created {len(df_features.columns) - len(df.columns)} price transformations")
        return df_features
    
    def create_time_features(self, df):
        """
        Create time-based features.
        
        Args:
            df (pandas.DataFrame): DataFrame with timestamp index
            
        Returns:
            pandas.DataFrame: DataFrame with time features
        """
        logger.info("Creating time features")
        
        # Make a copy to avoid modifying the original
        df_features = df.copy()
        
        # Ensure the index is a datetime
        if not isinstance(df_features.index, pd.DatetimeIndex):
            if 'timestamp' in df_features.columns:
                df_features['timestamp'] = pd.to_datetime(df_features['timestamp'])
                df_features = df_features.set_index('timestamp')
            else:
                logger.warning("No timestamp column found, skipping time features")
                return df_features
        
        # Day of week
        if "day_of_week" in FEATURE_ENGINEERING["time_features"]:
            df_features['day_of_week'] = df_features.index.dayofweek
            # One-hot encode day of week
            for i in range(5):  # 0-4 for Monday-Friday
                df_features[f'day_{i}'] = (df_features['day_of_week'] == i).astype(int)
        
        # Month
        if "month" in FEATURE_ENGINEERING["time_features"]:
            df_features['month'] = df_features.index.month
            # One-hot encode month
            for i in range(1, 13):  # 1-12 for January-December
                df_features[f'month_{i}'] = (df_features['month'] == i).astype(int)
        
        # Quarter
        if "quarter" in FEATURE_ENGINEERING["time_features"]:
            df_features['quarter'] = df_features.index.quarter
            # One-hot encode quarter
            for i in range(1, 5):  # 1-4 for Q1-Q4
                df_features[f'quarter_{i}'] = (df_features['quarter'] == i).astype(int)
        
        # Month start/end
        if "is_month_start" in FEATURE_ENGINEERING["time_features"]:
            df_features['is_month_start'] = df_features.index.is_month_start.astype(int)
        
        if "is_month_end" in FEATURE_ENGINEERING["time_features"]:
            df_features['is_month_end'] = df_features.index.is_month_end.astype(int)
        
        logger.info(f"Created {len(df_features.columns) - len(df.columns)} time features")
        return df_features
    
    def normalize_features(self, df, is_training=True):
        """
        Normalize features using Min-Max scaling.
        
        Args:
            df (pandas.DataFrame): DataFrame with features
            is_training (bool): Whether this is training data or not
            
        Returns:
            pandas.DataFrame: DataFrame with normalized features
        """
        logger.info("Normalizing features")
        
        # Make a copy to avoid modifying the original
        df_normalized = df.copy()
        
        # Normalize price data
        price_columns = ['open', 'high', 'low', 'close', 'adj_close'] if 'adj_close' in df.columns else ['open', 'high', 'low', 'close']
        price_columns = [col for col in price_columns if col in df.columns]
        
        if price_columns and is_training:
            self.price_scaler = MinMaxScaler()
            df_normalized[price_columns] = self.price_scaler.fit_transform(df[price_columns])
        elif price_columns and not is_training and self.price_scaler is not None:
            df_normalized[price_columns] = self.price_scaler.transform(df[price_columns])
        
        # Normalize other features by category
        feature_categories = {
            'sma': [col for col in df.columns if col.startswith('sma_')],
            'ema': [col for col in df.columns if col.startswith('ema_')],
            'rsi': [col for col in df.columns if col.startswith('rsi_')],
            'macd': [col for col in df.columns if col.startswith('macd')],
            'bollinger': [col for col in df.columns if col.startswith('bollinger_')],
            'stoch': [col for col in df.columns if col.startswith('stoch_')],
            'atr': [col for col in df.columns if col.startswith('atr_')],
            'obv': [col for col in df.columns if col == 'obv'],
            'returns': [col for col in df.columns if 'return' in col],
            'momentum': [col for col in df.columns if 'momentum' in col],
            'volatility': [col for col in df.columns if 'volatility' in col],
        }
        
        for category, cols in feature_categories.items():
            if cols and is_training:
                self.feature_scalers[category] = StandardScaler()
                df_normalized[cols] = self.feature_scalers[category].fit_transform(df[cols])
            elif cols and not is_training and category in self.feature_scalers:
                df_normalized[cols] = self.feature_scalers[category].transform(df[cols])
        
        logger.info("Features normalized")
        return df_normalized
    
    def prepare_sequence_data(self, df, target_col='close', sequence_length=None, prediction_horizon=None):
        """
        Prepare sequence data for time series models.
        
        Args:
            df (pandas.DataFrame): DataFrame with features
            target_col (str): Target column to predict
            sequence_length (int): Length of input sequences
            prediction_horizon (int): How many steps ahead to predict
            
        Returns:
            tuple: (X, y) where X is the input sequences and y is the target values
        """
        logger.info(f"Preparing sequence data with length {sequence_length} and horizon {prediction_horizon}")
        
        # Set default values if not provided
        if sequence_length is None:
            sequence_length = SEQUENCE_LENGTHS["medium_term"]
        
        if prediction_horizon is None:
            prediction_horizon = PREDICTION_HORIZONS["next_day"]
        
        # Create sequences
        X, y = [], []
        for i in range(len(df) - sequence_length - prediction_horizon + 1):
            X.append(df.iloc[i:(i + sequence_length)].values)
            y.append(df.iloc[i + sequence_length + prediction_horizon - 1][target_col])
        
        X = np.array(X)
        y = np.array(y)
        
        logger.info(f"Created {len(X)} sequences with shape {X.shape}")
        return X, y


class ModelBuilder:
    """Class for building and training prediction models."""
    
    def __init__(self):
        """Initialize the ModelBuilder class."""
        self.models = {}
        self.feature_engineering = FeatureEngineering()
        logger.info("ModelBuilder initialized")
    
    def build_lstm_model(self, input_shape, output_units=1):
        """
        Build an LSTM model.
        
        Args:
            input_shape (tuple): Shape of input data (sequence_length, n_features)
            output_units (int): Number of output units
            
        Returns:
            tensorflow.keras.models.Model: LSTM model
        """
        logger.info(f"Building LSTM model with input shape {input_shape}")
        
        model = Sequential()
        
        # Add LSTM layers
        for i, units in enumerate(LSTM_CONFIG["layers"]):
            return_sequences = i < len(LSTM_CONFIG["layers"]) - 1
            if i == 0:
                model.add(LSTM(
                    units=units,
                    return_sequences=return_sequences,
                    input_shape=input_shape,
                    activation=LSTM_CONFIG["activation"],
               
(Content truncated due to size limit. Use line ranges to read in chunks)