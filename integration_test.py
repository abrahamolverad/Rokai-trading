#!/usr/bin/env python3
"""
Integration test script for the AI Trading Platform.
This script tests the integration between all components and validates the platform's functionality.
"""

import os
import sys
import json
import logging
import datetime
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("../logs/integration_test.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("integration_test")

# Create logs directory if it doesn't exist
Path("../logs").mkdir(parents=True, exist_ok=True)

def test_data_collection_module():
    """Test the data collection module functionality."""
    logger.info("Testing data collection module...")
    try:
        from src.data_collection.data_collector import DataCollector
        
        collector = DataCollector()
        test_symbols = ['AAPL', 'MSFT', 'GOOGL']
        
        for symbol in test_symbols:
            data = collector.get_historical_data(symbol=symbol, period='1mo', interval='1d')
            logger.info(f"Collected {len(data)} records for {symbol}")
            
            # Validate data structure
            expected_columns = ['open', 'high', 'low', 'close', 'volume']
            missing_columns = [col for col in expected_columns if col not in data.columns]
            
            if missing_columns:
                logger.error(f"Missing columns in data: {missing_columns}")
                return False
        
        logger.info("Data collection module test passed")
        return True
    except Exception as e:
        logger.error(f"Data collection module test failed: {e}")
        return False

def test_models_module():
    """Test the AI models module functionality."""
    logger.info("Testing AI models module...")
    try:
        from src.data_collection.data_collector import DataCollector
        from src.models.model_builder import ModelBuilder, FeatureEngineering
        
        collector = DataCollector()
        feature_engineering = FeatureEngineering()
        model_builder = ModelBuilder()
        
        # Get sample data
        data = collector.get_historical_data(symbol='AAPL', period='3mo', interval='1d')
        
        # Generate features
        features = feature_engineering.generate_features(data)
        logger.info(f"Generated {len(features.columns)} features")
        
        # Train model
        model_builder.train_model(features, target_column='close')
        
        # Make prediction
        prediction = model_builder.predict_next_day(features)
        logger.info(f"Prediction for next day: {prediction}")
        
        if prediction is not None:
            logger.info("AI models module test passed")
            return True
        else:
            logger.error("Failed to generate prediction")
            return False
    except Exception as e:
        logger.error(f"AI models module test failed: {e}")
        return False

def test_execution_module():
    """Test the trading execution module functionality."""
    logger.info("Testing trading execution module...")
    try:
        from src.execution.trading_execution import TradingExecutor, OrderManager, RiskManager
        
        risk_manager = RiskManager()
        order_manager = OrderManager()
        trading_executor = TradingExecutor()
        
        # Test risk management
        position_size = risk_manager.calculate_position_size(
            symbol='AAPL',
            signal='BUY',
            confidence=75.5,
            current_price=175.25
        )
        logger.info(f"Calculated position size: {position_size}")
        
        # Test order creation
        order = order_manager.create_order({
            'symbol': 'AAPL',
            'quantity': position_size,
            'side': 'BUY',
            'type': 'MARKET',
            'time_in_force': 'DAY'
        })
        logger.info(f"Created order: {order}")
        
        # Test order execution
        result = trading_executor.execute_order(order)
        logger.info(f"Order execution result: {result}")
        
        if result and result.get('status') == 'FILLED':
            logger.info("Trading execution module test passed")
            return True
        else:
            logger.error("Failed to execute order")
            return False
    except Exception as e:
        logger.error(f"Trading execution module test failed: {e}")
        return False

def test_end_to_end_integration():
    """Test the end-to-end integration of all components."""
    logger.info("Testing end-to-end integration...")
    try:
        from src.data_collection.data_collector import DataCollector
        from src.models.model_builder import ModelBuilder, FeatureEngineering
        from src.execution.trading_execution import TradingExecutor, OrderManager, RiskManager
        
        # Initialize components
        collector = DataCollector()
        feature_engineering = FeatureEngineering()
        model_builder = ModelBuilder()
        risk_manager = RiskManager()
        order_manager = OrderManager()
        trading_executor = TradingExecutor()
        
        # Test symbol
        symbol = 'AAPL'
        
        # 1. Collect data
        data = collector.get_historical_data(symbol=symbol, period='3mo', interval='1d')
        logger.info(f"Collected {len(data)} records for {symbol}")
        
        # 2. Generate features
        features = feature_engineering.generate_features(data)
        logger.info(f"Generated {len(features.columns)} features")
        
        # 3. Train model and make prediction
        model_builder.train_model(features, target_column='close')
        prediction = model_builder.predict_next_day(features)
        logger.info(f"Prediction for next day: {prediction}")
        
        # 4. Generate trading signal
        current_price = data.iloc[-1]['close']
        signal = 'BUY' if prediction > current_price else 'SELL'
        confidence = abs((prediction - current_price) / current_price) * 100
        logger.info(f"Generated signal: {signal} with {confidence:.2f}% confidence")
        
        # 5. Calculate position size
        position_size = risk_manager.calculate_position_size(
            symbol=symbol,
            signal=signal,
            confidence=confidence,
            current_price=current_price
        )
        logger.info(f"Calculated position size: {position_size}")
        
        # 6. Create order
        order = order_manager.create_order({
            'symbol': symbol,
            'quantity': position_size,
            'side': signal,
            'type': 'MARKET',
            'time_in_force': 'DAY'
        })
        logger.info(f"Created order: {order}")
        
        # 7. Execute order
        result = trading_executor.execute_order(order)
        logger.info(f"Order execution result: {result}")
        
        if result and result.get('status') == 'FILLED':
            logger.info("End-to-end integration test passed")
            return True
        else:
            logger.error("End-to-end integration test failed")
            return False
    except Exception as e:
        logger.error(f"End-to-end integration test failed: {e}")
        return False

def run_all_tests():
    """Run all integration tests and generate a report."""
    logger.info("Starting integration tests...")
    
    # Create test results directory
    results_dir = Path("../test_results")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # Run tests
    data_collection_passed = test_data_collection_module()
    models_passed = test_models_module()
    execution_passed = test_execution_module()
    integration_passed = test_end_to_end_integration()
    
    # Calculate results
    tests = [
        ("Data Collection", data_collection_passed),
        ("AI Models", models_passed),
        ("Trading Execution", execution_passed),
        ("End-to-End Integration", integration_passed)
    ]
    
    passed = sum(1 for _, result in tests if result)
    total = len(tests)
    
    # Generate report
    report = {
        "timestamp": datetime.datetime.now().isoformat(),
        "tests": {name: result for name, result in tests},
        "summary": {
            "passed": passed,
            "total": total,
            "pass_rate": (passed / total) * 100 if total > 0 else 0
        }
    }
    
    # Save report
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = results_dir / f"integration_test_report_{timestamp}.json"
    
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"Integration test report saved to {report_file}")
    
    # Log summary
    logger.info("=== INTEGRATION TEST SUMMARY ===")
    for name, result in tests:
        logger.info(f"{name}: {'PASSED' if result else 'FAILED'}")
    
    logger.info(f"Overall: {passed}/{total} tests passed ({report['summary']['pass_rate']:.2f}%)")
    
    if passed == total:
        logger.info("All integration tests passed! The platform is ready for deployment.")
    else:
        logger.warning("Some integration tests failed. Please review the logs and fix the issues.")
    
    return report

if __name__ == "__main__":
    # Run all tests
    report = run_all_tests()
    
    # Exit with appropriate status code
    sys.exit(0 if report["summary"]["passed"] == report["summary"]["total"] else 1)
