#!/usr/bin/env python3
"""
Main script to run the AI Trading Platform.
This script initializes all components and starts the platform.
"""

import os
import sys
import logging
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/trading_platform.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("trading_platform")

# Create logs directory if it doesn't exist
Path("logs").mkdir(parents=True, exist_ok=True)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='AI Trading Platform')
    parser.add_argument('--mode', choices=['live', 'paper'], default='paper',
                        help='Trading mode: live or paper trading (default: paper)')
    parser.add_argument('--symbols', nargs='+', default=['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'],
                        help='List of symbols to trade (default: AAPL MSFT GOOGL AMZN META)')
    parser.add_argument('--interval', default='1d',
                        help='Trading interval (default: 1d)')
    parser.add_argument('--risk', type=float, default=2.0,
                        help='Risk percentage per trade (default: 2.0)')
    parser.add_argument('--ui', action='store_true',
                        help='Start with UI (requires Node.js)')
    return parser.parse_args()

def start_platform(args):
    """Initialize and start the trading platform."""
    logger.info(f"Starting AI Trading Platform in {args.mode} mode")
    logger.info(f"Trading symbols: {args.symbols}")
    logger.info(f"Trading interval: {args.interval}")
    logger.info(f"Risk percentage: {args.risk}%")
    
    try:
        # Import platform modules
        from src.data_collection.data_collector import DataCollector
        from src.models.model_builder import ModelBuilder, FeatureEngineering
        from src.execution.trading_execution import TradingExecutor, OrderManager, RiskManager
        
        # Initialize components
        data_collector = DataCollector()
        feature_engineering = FeatureEngineering()
        model_builder = ModelBuilder()
        risk_manager = RiskManager(max_risk_percent=args.risk)
        order_manager = OrderManager()
        trading_executor = TradingExecutor(mode=args.mode)
        
        logger.info("All components initialized successfully")
        
        # Start trading loop for each symbol
        for symbol in args.symbols:
            try:
                logger.info(f"Processing symbol: {symbol}")
                
                # 1. Collect data
                data = data_collector.get_historical_data(
                    symbol=symbol,
                    period='3mo',
                    interval=args.interval
                )
                logger.info(f"Collected {len(data)} records for {symbol}")
                
                # 2. Generate features
                features = feature_engineering.generate_features(data)
                logger.info(f"Generated features for {symbol}")
                
                # 3. Train model and make prediction
                model_builder.train_model(features, target_column='close')
                prediction = model_builder.predict_next_day(features)
                logger.info(f"Prediction for {symbol} next day: {prediction}")
                
                # 4. Generate trading signal
                current_price = data.iloc[-1]['close']
                signal = 'BUY' if prediction > current_price else 'SELL'
                confidence = abs((prediction - current_price) / current_price) * 100
                logger.info(f"Signal for {symbol}: {signal} with {confidence:.2f}% confidence")
                
                # 5. Calculate position size
                position_size = risk_manager.calculate_position_size(
                    symbol=symbol,
                    signal=signal,
                    confidence=confidence,
                    current_price=current_price
                )
                logger.info(f"Position size for {symbol}: {position_size}")
                
                # 6. Create and execute order if confidence is high enough
                if confidence >= 60:  # Only trade if confidence is at least 60%
                    order = order_manager.create_order({
                        'symbol': symbol,
                        'quantity': position_size,
                        'side': signal,
                        'type': 'MARKET',
                        'time_in_force': 'DAY'
                    })
                    
                    result = trading_executor.execute_order(order)
                    logger.info(f"Order execution result for {symbol}: {result}")
                else:
                    logger.info(f"Skipping {symbol} due to low confidence: {confidence:.2f}%")
            
            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")
        
        logger.info("Trading cycle completed successfully")
        
        # Start UI if requested
        if args.ui:
            logger.info("Starting UI...")
            start_ui()
        
        return True
    
    except Exception as e:
        logger.error(f"Error starting platform: {e}")
        return False

def start_ui():
    """Start the React UI."""
    try:
        import subprocess
        
        # Check if Node.js is installed
        try:
            subprocess.run(["node", "--version"], check=True, stdout=subprocess.PIPE)
        except (subprocess.SubprocessError, FileNotFoundError):
            logger.error("Node.js is not installed. Cannot start UI.")
            return False
        
        # Navigate to UI directory and start the server
        ui_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "ui")
        
        # Install dependencies if needed
        if not os.path.exists(os.path.join(ui_dir, "node_modules")):
            logger.info("Installing UI dependencies...")
            subprocess.run(["npm", "install"], cwd=ui_dir, check=True)
        
        # Start the server
        logger.info("Starting UI server...")
        subprocess.Popen(["npm", "start"], cwd=ui_dir)
        
        logger.info("UI server started. Access the dashboard at http://localhost:3000")
        return True
    
    except Exception as e:
        logger.error(f"Error starting UI: {e}")
        return False

if __name__ == "__main__":
    args = parse_arguments()
    success = start_platform(args)
    
    if success:
        logger.info("AI Trading Platform started successfully")
    else:
        logger.error("Failed to start AI Trading Platform")
        sys.exit(1)
