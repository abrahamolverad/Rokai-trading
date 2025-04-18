#!/usr/bin/env python3
"""
Test script for the AI Trading Platform performance validation.
This script tests the integration between different components and validates the platform's performance.
"""

import os
import sys
import json
import time
import logging
import datetime
import pandas as pd
import numpy as np
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("../logs/performance_test.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("performance_test")

# Create logs directory if it doesn't exist
Path("../logs").mkdir(parents=True, exist_ok=True)

# Import platform modules
try:
    from src.data_collection.data_collector import DataCollector
    from src.models.model_builder import ModelBuilder, FeatureEngineering
    from src.execution.trading_execution import TradingExecutor, OrderManager, RiskManager
    logger.info("Successfully imported platform modules")
except ImportError as e:
    logger.error(f"Failed to import platform modules: {e}")
    sys.exit(1)

class PlatformTester:
    """Test harness for the AI Trading Platform."""
    
    def __init__(self):
        """Initialize the tester with platform components."""
        self.data_collector = DataCollector()
        self.feature_engineering = FeatureEngineering()
        self.model_builder = ModelBuilder()
        self.risk_manager = RiskManager()
        self.order_manager = OrderManager()
        self.trading_executor = TradingExecutor()
        
        self.test_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']
        self.test_period = '1mo'
        self.test_interval = '1d'
        
        self.results = {
            'data_collection': {},
            'feature_engineering': {},
            'model_prediction': {},
            'trading_execution': {},
            'overall_performance': {}
        }
        
        logger.info("PlatformTester initialized")
    
    def test_data_collection(self):
        """Test the data collection module."""
        logger.info("Testing data collection module...")
        start_time = time.time()
        
        success_count = 0
        total_count = len(self.test_symbols)
        
        for symbol in self.test_symbols:
            try:
                # Collect historical data
                data = self.data_collector.get_historical_data(
                    symbol=symbol,
                    period=self.test_period,
                    interval=self.test_interval
                )
                
                # Validate data
                if data is not None and len(data) > 0:
                    logger.info(f"Successfully collected data for {symbol}: {len(data)} records")
                    success_count += 1
                else:
                    logger.warning(f"Collected empty data for {symbol}")
            except Exception as e:
                logger.error(f"Error collecting data for {symbol}: {e}")
        
        elapsed_time = time.time() - start_time
        success_rate = (success_count / total_count) * 100
        
        self.results['data_collection'] = {
            'success_rate': success_rate,
            'elapsed_time': elapsed_time,
            'symbols_tested': total_count
        }
        
        logger.info(f"Data collection test completed: {success_rate:.2f}% success rate in {elapsed_time:.2f} seconds")
        return success_rate >= 80  # Require at least 80% success rate
    
    def test_feature_engineering(self):
        """Test the feature engineering module."""
        logger.info("Testing feature engineering module...")
        start_time = time.time()
        
        success_count = 0
        total_count = len(self.test_symbols)
        
        for symbol in self.test_symbols:
            try:
                # Collect data
                data = self.data_collector.get_historical_data(
                    symbol=symbol,
                    period=self.test_period,
                    interval=self.test_interval
                )
                
                if data is not None and len(data) > 0:
                    # Generate features
                    features = self.feature_engineering.generate_features(data)
                    
                    # Validate features
                    expected_features = ['sma_20', 'sma_50', 'rsi_14', 'macd', 'bollinger_upper', 'bollinger_lower']
                    missing_features = [f for f in expected_features if f not in features.columns]
                    
                    if not missing_features:
                        logger.info(f"Successfully generated features for {symbol}")
                        success_count += 1
                    else:
                        logger.warning(f"Missing features for {symbol}: {missing_features}")
                else:
                    logger.warning(f"Cannot generate features for {symbol}: no data")
            except Exception as e:
                logger.error(f"Error generating features for {symbol}: {e}")
        
        elapsed_time = time.time() - start_time
        success_rate = (success_count / total_count) * 100
        
        self.results['feature_engineering'] = {
            'success_rate': success_rate,
            'elapsed_time': elapsed_time,
            'symbols_tested': total_count
        }
        
        logger.info(f"Feature engineering test completed: {success_rate:.2f}% success rate in {elapsed_time:.2f} seconds")
        return success_rate >= 80  # Require at least 80% success rate
    
    def test_model_prediction(self):
        """Test the AI prediction models."""
        logger.info("Testing AI prediction models...")
        start_time = time.time()
        
        success_count = 0
        total_count = len(self.test_symbols)
        prediction_accuracy = []
        
        for symbol in self.test_symbols:
            try:
                # Collect data
                data = self.data_collector.get_historical_data(
                    symbol=symbol,
                    period=self.test_period,
                    interval=self.test_interval
                )
                
                if data is not None and len(data) > 0:
                    # Generate features
                    features = self.feature_engineering.generate_features(data)
                    
                    # Split data for testing
                    train_size = int(len(features) * 0.8)
                    train_data = features.iloc[:train_size]
                    test_data = features.iloc[train_size:]
                    
                    # Train model
                    self.model_builder.train_model(train_data, target_column='close')
                    
                    # Make predictions
                    predictions = self.model_builder.predict(test_data)
                    
                    # Calculate accuracy (direction prediction)
                    actual_direction = np.sign(test_data['close'].pct_change().dropna())
                    pred_direction = np.sign(predictions.pct_change().dropna())
                    
                    # Align the arrays
                    min_len = min(len(actual_direction), len(pred_direction))
                    actual_direction = actual_direction[-min_len:]
                    pred_direction = pred_direction[-min_len:]
                    
                    accuracy = np.mean(actual_direction == pred_direction) * 100
                    prediction_accuracy.append(accuracy)
                    
                    logger.info(f"Model prediction accuracy for {symbol}: {accuracy:.2f}%")
                    success_count += 1
                else:
                    logger.warning(f"Cannot test model for {symbol}: no data")
            except Exception as e:
                logger.error(f"Error testing model for {symbol}: {e}")
        
        elapsed_time = time.time() - start_time
        success_rate = (success_count / total_count) * 100
        avg_accuracy = np.mean(prediction_accuracy) if prediction_accuracy else 0
        
        self.results['model_prediction'] = {
            'success_rate': success_rate,
            'elapsed_time': elapsed_time,
            'symbols_tested': total_count,
            'average_accuracy': avg_accuracy
        }
        
        logger.info(f"Model prediction test completed: {success_rate:.2f}% success rate, {avg_accuracy:.2f}% average accuracy in {elapsed_time:.2f} seconds")
        return success_rate >= 80 and avg_accuracy >= 55  # Require at least 55% prediction accuracy
    
    def test_trading_execution(self):
        """Test the trading execution module."""
        logger.info("Testing trading execution module...")
        start_time = time.time()
        
        success_count = 0
        total_count = len(self.test_symbols) * 2  # Buy and sell for each symbol
        
        for symbol in self.test_symbols:
            try:
                # Test buy order
                buy_order = {
                    'symbol': symbol,
                    'quantity': 10,
                    'side': 'BUY',
                    'type': 'MARKET',
                    'time_in_force': 'DAY'
                }
                
                buy_result = self.trading_executor.execute_order(buy_order)
                
                if buy_result and buy_result.get('status') == 'FILLED':
                    logger.info(f"Successfully executed buy order for {symbol}")
                    success_count += 1
                else:
                    logger.warning(f"Failed to execute buy order for {symbol}")
                
                # Test sell order
                sell_order = {
                    'symbol': symbol,
                    'quantity': 10,
                    'side': 'SELL',
                    'type': 'MARKET',
                    'time_in_force': 'DAY'
                }
                
                sell_result = self.trading_executor.execute_order(sell_order)
                
                if sell_result and sell_result.get('status') == 'FILLED':
                    logger.info(f"Successfully executed sell order for {symbol}")
                    success_count += 1
                else:
                    logger.warning(f"Failed to execute sell order for {symbol}")
                
            except Exception as e:
                logger.error(f"Error executing orders for {symbol}: {e}")
        
        elapsed_time = time.time() - start_time
        success_rate = (success_count / total_count) * 100
        
        self.results['trading_execution'] = {
            'success_rate': success_rate,
            'elapsed_time': elapsed_time,
            'orders_tested': total_count
        }
        
        logger.info(f"Trading execution test completed: {success_rate:.2f}% success rate in {elapsed_time:.2f} seconds")
        return success_rate >= 90  # Require at least 90% success rate for orders
    
    def test_end_to_end_workflow(self):
        """Test the complete end-to-end workflow."""
        logger.info("Testing end-to-end workflow...")
        start_time = time.time()
        
        success_count = 0
        total_count = len(self.test_symbols)
        portfolio_performance = []
        
        for symbol in self.test_symbols:
            try:
                # 1. Collect data
                data = self.data_collector.get_historical_data(
                    symbol=symbol,
                    period=self.test_period,
                    interval=self.test_interval
                )
                
                if data is not None and len(data) > 0:
                    # 2. Generate features
                    features = self.feature_engineering.generate_features(data)
                    
                    # 3. Make predictions
                    self.model_builder.train_model(features, target_column='close')
                    prediction = self.model_builder.predict_next_day(features)
                    
                    # 4. Generate trading signal
                    current_price = data.iloc[-1]['close']
                    signal = 'BUY' if prediction > current_price else 'SELL'
                    confidence = abs((prediction - current_price) / current_price) * 100
                    
                    # 5. Calculate position size
                    position_size = self.risk_manager.calculate_position_size(
                        symbol=symbol,
                        signal=signal,
                        confidence=confidence,
                        current_price=current_price
                    )
                    
                    # 6. Execute order
                    order = {
                        'symbol': symbol,
                        'quantity': position_size,
                        'side': signal,
                        'type': 'MARKET',
                        'time_in_force': 'DAY'
                    }
                    
                    order_result = self.trading_executor.execute_order(order)
                    
                    # 7. Simulate performance
                    if order_result and order_result.get('status') == 'FILLED':
                        # Simulate next day performance
                        next_day_return = (prediction - current_price) / current_price
                        if signal == 'BUY':
                            trade_pnl = next_day_return * position_size * current_price
                        else:  # SELL
                            trade_pnl = -next_day_return * position_size * current_price
                        
                        portfolio_performance.append(trade_pnl)
                        logger.info(f"End-to-end workflow for {symbol}: Signal={signal}, Confidence={confidence:.2f}%, P&L=${trade_pnl:.2f}")
                        success_count += 1
                    else:
                        logger.warning(f"Failed to execute order in end-to-end workflow for {symbol}")
                else:
                    logger.warning(f"Cannot test end-to-end workflow for {symbol}: no data")
            except Exception as e:
                logger.error(f"Error in end-to-end workflow for {symbol}: {e}")
        
        elapsed_time = time.time() - start_time
        success_rate = (success_count / total_count) * 100
        total_pnl = sum(portfolio_performance)
        avg_pnl_per_trade = np.mean(portfolio_performance) if portfolio_performance else 0
        
        self.results['overall_performance'] = {
            'success_rate': success_rate,
            'elapsed_time': elapsed_time,
            'symbols_tested': total_count,
            'total_pnl': total_pnl,
            'avg_pnl_per_trade': avg_pnl_per_trade
        }
        
        logger.info(f"End-to-end workflow test completed: {success_rate:.2f}% success rate, Total P&L=${total_pnl:.2f}, Avg P&L per trade=${avg_pnl_per_trade:.2f} in {elapsed_time:.2f} seconds")
        return success_rate >= 80 and total_pnl > 0  # Require at least 80% success rate and positive P&L
    
    def run_all_tests(self):
        """Run all tests and generate a comprehensive report."""
        logger.info("Starting comprehensive platform testing...")
        
        # Create test results directory
        results_dir = Path("../test_results")
        results_dir.mkdir(parents=True, exist_ok=True)
        
        # Run individual component tests
        data_collection_passed = self.test_data_collection()
        feature_engineering_passed = self.test_feature_engineering()
        model_prediction_passed = self.test_model_prediction()
        trading_execution_passed = self.test_trading_execution()
        
        # Run end-to
(Content truncated due to size limit. Use line ranges to read in chunks)