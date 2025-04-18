"""
Trading execution module for the AI Trading Platform.

This module handles the execution of trades based on signals from the AI prediction models.
It includes order management, position sizing, risk management, and broker integration.
"""

import os
import sys
import logging
import time
import json
import queue
import threading
import datetime
import numpy as np
import pandas as pd
from enum import Enum
from typing import Dict, List, Optional, Union, Tuple, Any

# Import configuration
from config import (
    EXECUTION_SETTINGS, ORDER_TYPES, POSITION_SIZING, ENTRY_RULES, EXIT_RULES,
    RISK_MANAGEMENT, BROKER_SETTINGS, EVENT_PROCESSING, LOGGING,
    PERFORMANCE_MONITORING, BACKTESTING, TRADING_STRATEGIES, PORTFOLIO_OPTIMIZATION
)

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOGGING["level"]),
    format=LOGGING["format"],
    filename=LOGGING["file"],
)
logger = logging.getLogger("trading_execution")

# Create a separate trade logger
trade_logger = logging.getLogger("trade_log")
trade_handler = logging.FileHandler(LOGGING["trade_log"])
trade_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
trade_logger.addHandler(trade_handler)
trade_logger.setLevel(logging.INFO)


class OrderType(Enum):
    """Enum for order types."""
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"


class OrderSide(Enum):
    """Enum for order sides."""
    BUY = "buy"
    SELL = "sell"


class OrderStatus(Enum):
    """Enum for order statuses."""
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELED = "canceled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class EventType(Enum):
    """Enum for event types."""
    SIGNAL = "signal"
    ORDER = "order"
    FILL = "fill"
    POSITION = "position"
    BALANCE = "balance"
    MARKET_DATA = "market_data"
    ERROR = "error"
    SYSTEM = "system"


class Event:
    """Base class for all events."""
    
    def __init__(self, event_type: EventType, timestamp: Optional[datetime.datetime] = None):
        """
        Initialize an event.
        
        Args:
            event_type: Type of the event
            timestamp: Timestamp of the event (defaults to current time)
        """
        self.event_type = event_type
        self.timestamp = timestamp or datetime.datetime.now()
    
    def __str__(self):
        return f"{self.event_type.value} Event at {self.timestamp}"


class SignalEvent(Event):
    """Event for trading signals."""
    
    def __init__(
        self,
        ticker: str,
        direction: int,
        strength: float,
        timestamp: Optional[datetime.datetime] = None,
        source: str = "model",
        metadata: Optional[Dict] = None
    ):
        """
        Initialize a signal event.
        
        Args:
            ticker: Ticker symbol
            direction: 1 for buy, -1 for sell
            strength: Signal strength (0.0 to 1.0)
            timestamp: Timestamp of the signal
            source: Source of the signal (e.g., "model", "strategy")
            metadata: Additional metadata about the signal
        """
        super().__init__(EventType.SIGNAL, timestamp)
        self.ticker = ticker
        self.direction = direction
        self.strength = strength
        self.source = source
        self.metadata = metadata or {}
    
    def __str__(self):
        direction_str = "BUY" if self.direction == 1 else "SELL"
        return f"Signal Event: {direction_str} {self.ticker} with strength {self.strength:.2f} at {self.timestamp}"


class OrderEvent(Event):
    """Event for order creation, modification, or cancellation."""
    
    def __init__(
        self,
        ticker: str,
        order_type: OrderType,
        side: OrderSide,
        quantity: float,
        price: Optional[float] = None,
        stop_price: Optional[float] = None,
        order_id: Optional[str] = None,
        timestamp: Optional[datetime.datetime] = None,
        metadata: Optional[Dict] = None
    ):
        """
        Initialize an order event.
        
        Args:
            ticker: Ticker symbol
            order_type: Type of order
            side: Buy or sell
            quantity: Quantity to buy or sell
            price: Limit price (for limit and stop-limit orders)
            stop_price: Stop price (for stop and stop-limit orders)
            order_id: Order ID (if modifying or canceling an existing order)
            timestamp: Timestamp of the order
            metadata: Additional metadata about the order
        """
        super().__init__(EventType.ORDER, timestamp)
        self.ticker = ticker
        self.order_type = order_type
        self.side = side
        self.quantity = quantity
        self.price = price
        self.stop_price = stop_price
        self.order_id = order_id
        self.metadata = metadata or {}
    
    def __str__(self):
        price_str = f" at {self.price}" if self.price else ""
        stop_str = f" stop {self.stop_price}" if self.stop_price else ""
        return f"Order Event: {self.side.value.upper()} {self.quantity} {self.ticker} ({self.order_type.value}){price_str}{stop_str}"


class FillEvent(Event):
    """Event for order fills."""
    
    def __init__(
        self,
        ticker: str,
        side: OrderSide,
        quantity: float,
        price: float,
        commission: float,
        order_id: str,
        timestamp: Optional[datetime.datetime] = None,
        metadata: Optional[Dict] = None
    ):
        """
        Initialize a fill event.
        
        Args:
            ticker: Ticker symbol
            side: Buy or sell
            quantity: Quantity filled
            price: Fill price
            commission: Commission paid
            order_id: Order ID
            timestamp: Timestamp of the fill
            metadata: Additional metadata about the fill
        """
        super().__init__(EventType.FILL, timestamp)
        self.ticker = ticker
        self.side = side
        self.quantity = quantity
        self.price = price
        self.commission = commission
        self.order_id = order_id
        self.metadata = metadata or {}
    
    def __str__(self):
        return f"Fill Event: {self.side.value.upper()} {self.quantity} {self.ticker} at {self.price} (Commission: {self.commission})"


class Position:
    """Class representing a trading position."""
    
    def __init__(
        self,
        ticker: str,
        quantity: float,
        entry_price: float,
        entry_time: datetime.datetime,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
        metadata: Optional[Dict] = None
    ):
        """
        Initialize a position.
        
        Args:
            ticker: Ticker symbol
            quantity: Position quantity (positive for long, negative for short)
            entry_price: Average entry price
            entry_time: Entry timestamp
            stop_loss: Stop loss price
            take_profit: Take profit price
            metadata: Additional metadata about the position
        """
        self.ticker = ticker
        self.quantity = quantity
        self.entry_price = entry_price
        self.entry_time = entry_time
        self.stop_loss = stop_loss
        self.take_profit = take_profit
        self.metadata = metadata or {}
        self.exit_price = None
        self.exit_time = None
        self.pnl = 0.0
        self.pnl_percentage = 0.0
        self.status = "open"
    
    def update_stop_loss(self, price: float):
        """Update stop loss price."""
        self.stop_loss = price
    
    def update_take_profit(self, price: float):
        """Update take profit price."""
        self.take_profit = price
    
    def close(self, exit_price: float, exit_time: datetime.datetime):
        """
        Close the position.
        
        Args:
            exit_price: Exit price
            exit_time: Exit timestamp
        """
        self.exit_price = exit_price
        self.exit_time = exit_time
        self.pnl = (self.exit_price - self.entry_price) * self.quantity
        self.pnl_percentage = (self.exit_price / self.entry_price - 1) * 100 * (1 if self.quantity > 0 else -1)
        self.status = "closed"
    
    def __str__(self):
        position_type = "LONG" if self.quantity > 0 else "SHORT"
        status_str = f"OPEN (Entry: {self.entry_price})" if self.status == "open" else f"CLOSED (Entry: {self.entry_price}, Exit: {self.exit_price}, PnL: {self.pnl:.2f})"
        return f"{position_type} {abs(self.quantity)} {self.ticker} - {status_str}"


class Portfolio:
    """Class for managing the portfolio of positions and cash."""
    
    def __init__(self, initial_capital: float = 100000.0):
        """
        Initialize the portfolio.
        
        Args:
            initial_capital: Initial capital
        """
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.positions = {}  # ticker -> Position
        self.closed_positions = []
        self.equity_curve = []
        self.transactions = []
    
    def add_position(self, position: Position):
        """
        Add a position to the portfolio.
        
        Args:
            position: Position to add
        """
        self.positions[position.ticker] = position
        self.cash -= position.quantity * position.entry_price
        self.transactions.append({
            "type": "open",
            "ticker": position.ticker,
            "quantity": position.quantity,
            "price": position.entry_price,
            "timestamp": position.entry_time,
            "value": position.quantity * position.entry_price
        })
        logger.info(f"Added position: {position}")
        trade_logger.info(f"OPEN,{position.ticker},{position.quantity},{position.entry_price},{position.entry_time}")
    
    def close_position(self, ticker: str, exit_price: float, exit_time: datetime.datetime):
        """
        Close a position.
        
        Args:
            ticker: Ticker symbol
            exit_price: Exit price
            exit_time: Exit timestamp
        """
        if ticker not in self.positions:
            logger.warning(f"Cannot close position for {ticker}: Position not found")
            return
        
        position = self.positions[ticker]
        position.close(exit_price, exit_time)
        self.cash += position.quantity * exit_price
        self.closed_positions.append(position)
        self.transactions.append({
            "type": "close",
            "ticker": position.ticker,
            "quantity": position.quantity,
            "price": exit_price,
            "timestamp": exit_time,
            "value": position.quantity * exit_price,
            "pnl": position.pnl,
            "pnl_percentage": position.pnl_percentage
        })
        logger.info(f"Closed position: {position}")
        trade_logger.info(f"CLOSE,{position.ticker},{position.quantity},{exit_price},{exit_time},{position.pnl},{position.pnl_percentage}")
        del self.positions[ticker]
    
    def update_position(self, ticker: str, current_price: float, current_time: datetime.datetime):
        """
        Update a position with current market data.
        
        Args:
            ticker: Ticker symbol
            current_price: Current market price
            current_time: Current timestamp
        """
        if ticker not in self.positions:
            return
        
        position = self.positions[ticker]
        unrealized_pnl = (current_price - position.entry_price) * position.quantity
        unrealized_pnl_percentage = (current_price / position.entry_price - 1) * 100 * (1 if position.quantity > 0 else -1)
        
        # Check stop loss
        if position.stop_loss is not None:
            if (position.quantity > 0 and current_price <= position.stop_loss) or \
               (position.quantity < 0 and current_price >= position.stop_loss):
                logger.info(f"Stop loss triggered for {ticker} at {current_price}")
                self.close_position(ticker, current_price, current_time)
                return
        
        # Check take profit
        if position.take_profit is not None:
            if (position.quantity > 0 and current_price >= position.take_profit) or \
               (position.quantity < 0 and current_price <= position.take_profit):
                logger.info(f"Take profit triggered for {ticker} at {current_price}")
                self.close_position(ticker, current_price, current_time)
                return
        
        # Update trailing stop if enabled
        if EXIT_RULES["stop_loss"]["trailing"] and position.stop_loss is not None:
            if position.quantity > 0:  # Long position
                new_stop = current_price * (1 - EXIT_RULES["stop_loss"]["percentage"])
                if new_stop > position.stop_loss:
                    position.update_stop_loss(new_stop)
                    logger.info(f"Updated trailing stop for {ticker} to {new_stop}")
            else:  # Short position
                new_stop = current_price * (1 + EXIT_RULES["stop_loss"]["percentage"])
                if new_stop < position.stop_loss:
                    position.update_stop_loss(new_stop)
                    logger.info(f"Updated trailing stop for {ticker} to {new_stop}")
    
    def update_portfolio(self, current_prices: Dict[str, float], current_time: datetime.datetime):
        """
        Update the entire portfolio with current market data.
        
        Args:
            current_prices: Dictionary of current prices (ticker -> price)
            current_time: Current timestamp
        """
        # Update positions
        for ticker in list(self.positions.keys()):
            if ticker in current_prices:
                self.update_position(ticker, current_prices[ticker], current_time)
        
        # Calculate portfolio value
        portfolio_value = self.cash
        for ticker, position in self.positions.items():
            if ticker in current_prices:
                portfolio_value += position.quantity * current_prices[ticker]
        
        # Update equity curve
        self.equity_curve.append({
            "timestamp": current_time,
            "portfolio_value": portfolio_value,
            "cash": self.cash
        })
    
    def get_portfolio_value(self, current_prices: Dict[str, float]) -> float:
        """
        Calculate the current portfolio value.
        
        Args:
            current_prices: Dictionary of current prices (ticker -> price)
            
        Returns:
            float: Current portfolio value
        """
        portfolio_value = self.cash
        for ticker, position in self.positions.items():
            if ticker in current_prices:
                portfolio_value += position.quantity * current_prices[ticker]
        return portfolio_value
    
    def get_position_value(self, current_prices: Dict[str, float]) -> float:
        """
        Calculate the current value of all positions.
        
        Args:
            current_prices: Dictionary of current prices (ticker -> price)
            
        Returns:
            float: Current position value
        """
        position_value = 0.0
        for ticker, position in self.positions.items():
            if ticker in current_prices:
                position_value += position.quantity * current_prices[ticker]
        return position_value
    
    def get_position_exposure(self) -> Dict[str, float]:
        """
        Calculate the exposure of each position as a percentage of the portfolio.
        
        Returns:
            Dict[str, float]: Dictionary of position exposures (ticker -> exposure)
        """
        portfolio_value = self.get_portfolio_value({ticker: position.entry_price for ticker, position in self.positions.items()})
        e
(Content truncated due to size limit. Use line ranges to read in chunks)