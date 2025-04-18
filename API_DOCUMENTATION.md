# API Documentation for AI Trading Platform

## Base URL
```
https://api.aitrading.com/api
```

## Authentication
The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header for protected endpoints:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authentication Endpoints

#### Register a new user
```
POST /auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## User Endpoints

#### Get User Profile
```
GET /user/profile
```

**Response:**
```json
{
  "id": "user_id",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-04-16T12:00:00.000Z",
  "settings": {
    "darkMode": false,
    "notifications": true,
    "riskLevel": "moderate"
  }
}
```

#### Update User Profile
```
PUT /user/profile
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "id": "user_id",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Update User Settings
```
PUT /user/settings
```

**Request Body:**
```json
{
  "darkMode": true,
  "notifications": true,
  "riskLevel": "aggressive"
}
```

**Response:**
```json
{
  "darkMode": true,
  "notifications": true,
  "riskLevel": "aggressive"
}
```

## Portfolio Endpoints

#### Get All Portfolios
```
GET /portfolios
```

**Response:**
```json
[
  {
    "id": "portfolio_id",
    "userId": "user_id",
    "name": "Main Account",
    "balance": 105250.75,
    "equity": 125750.50,
    "positions": [
      {
        "symbol": "AAPL",
        "quantity": 50,
        "entryPrice": 150.25,
        "currentPrice": 175.50,
        "value": 8775.00,
        "unrealizedPL": 1262.50,
        "unrealizedPLPercent": 16.80
      }
    ],
    "performance": {
      "totalReturn": 25750.50,
      "totalReturnPercent": 25.75,
      "dailyReturn": 1250.25,
      "dailyReturnPercent": 1.25
    },
    "createdAt": "2025-04-10T12:00:00.000Z"
  }
]
```

#### Get Portfolio by ID
```
GET /portfolios/:id
```

**Response:**
```json
{
  "id": "portfolio_id",
  "userId": "user_id",
  "name": "Main Account",
  "balance": 105250.75,
  "equity": 125750.50,
  "positions": [
    {
      "symbol": "AAPL",
      "quantity": 50,
      "entryPrice": 150.25,
      "currentPrice": 175.50,
      "value": 8775.00,
      "unrealizedPL": 1262.50,
      "unrealizedPLPercent": 16.80
    }
  ],
  "performance": {
    "totalReturn": 25750.50,
    "totalReturnPercent": 25.75,
    "dailyReturn": 1250.25,
    "dailyReturnPercent": 1.25
  },
  "createdAt": "2025-04-10T12:00:00.000Z"
}
```

#### Create Portfolio
```
POST /portfolios
```

**Request Body:**
```json
{
  "name": "Retirement Account",
  "balance": 200000
}
```

**Response:**
```json
{
  "id": "portfolio_id",
  "userId": "user_id",
  "name": "Retirement Account",
  "balance": 200000,
  "equity": 200000,
  "positions": [],
  "performance": {
    "totalReturn": 0,
    "totalReturnPercent": 0,
    "dailyReturn": 0,
    "dailyReturnPercent": 0
  },
  "createdAt": "2025-04-16T12:00:00.000Z"
}
```

## Trade Endpoints

#### Get Trades
```
GET /trades
```

**Query Parameters:**
- `portfolioId` (optional): Filter by portfolio ID
- `status` (optional): Filter by status (open, filled, canceled, rejected)
- `limit` (optional): Limit number of results (default: 50)

**Response:**
```json
[
  {
    "id": "trade_id",
    "userId": "user_id",
    "portfolioId": "portfolio_id",
    "symbol": "AAPL",
    "type": "market",
    "side": "buy",
    "quantity": 10,
    "price": 175.50,
    "status": "filled",
    "executedPrice": 175.50,
    "executedQuantity": 10,
    "commission": 0,
    "realizedPL": null,
    "createdAt": "2025-04-16T12:00:00.000Z",
    "executedAt": "2025-04-16T12:00:05.000Z"
  }
]
```

#### Create Trade
```
POST /trades
```

**Request Body:**
```json
{
  "portfolioId": "portfolio_id",
  "symbol": "MSFT",
  "type": "market",
  "side": "buy",
  "quantity": 5,
  "price": 280.30
}
```

**Response:**
```json
{
  "id": "trade_id",
  "userId": "user_id",
  "portfolioId": "portfolio_id",
  "symbol": "MSFT",
  "type": "market",
  "side": "buy",
  "quantity": 5,
  "price": 280.30,
  "status": "filled",
  "executedPrice": 280.30,
  "executedQuantity": 5,
  "commission": 0,
  "realizedPL": null,
  "createdAt": "2025-04-16T12:00:00.000Z",
  "executedAt": "2025-04-16T12:00:05.000Z"
}
```

#### Cancel Trade
```
PUT /trades/:id/cancel
```

**Response:**
```json
{
  "id": "trade_id",
  "userId": "user_id",
  "portfolioId": "portfolio_id",
  "symbol": "GOOGL",
  "type": "limit",
  "side": "buy",
  "quantity": 10,
  "price": 110.00,
  "status": "canceled",
  "createdAt": "2025-04-16T12:00:00.000Z"
}
```

## Prediction Endpoints

#### Get Predictions
```
GET /predictions
```

**Query Parameters:**
- `symbol` (optional): Filter by symbol
- `signal` (optional): Filter by signal (buy, sell, hold)
- `confidence` (optional): Filter by minimum confidence (0-100)
- `limit` (optional): Limit number of results (default: 20)

**Response:**
```json
[
  {
    "id": "prediction_id",
    "symbol": "AAPL",
    "signal": "buy",
    "currentPrice": 175.50,
    "targetPrice": 195.50,
    "potential": 11.4,
    "timeframe": "5 days",
    "confidence": 85,
    "model": "ensemble",
    "createdAt": "2025-04-16T10:00:00.000Z",
    "expiresAt": "2025-04-21T10:00:00.000Z"
  }
]
```

## Analytics Endpoints

#### Get Performance Analytics
```
GET /analytics/performance
```

**Query Parameters:**
- `portfolioId`: Portfolio ID
- `period` (optional): Time period (week, month, year)

**Response:**
```json
[
  {
    "date": "2025-03-17T00:00:00.000Z",
    "value": 100000
  },
  {
    "date": "2025-03-18T00:00:00.000Z",
    "value": 100250
  },
  ...
  {
    "date": "2025-04-16T00:00:00.000Z",
    "value": 125750
  }
]
```

#### Get Trade Analytics
```
GET /analytics/trades
```

**Query Parameters:**
- `portfolioId`: Portfolio ID
- `period` (optional): Time period (week, month, year)

**Response:**
```json
{
  "totalTrades": 79,
  "winningTrades": 62,
  "losingTrades": 17,
  "winRate": 78.5,
  "averageWin": 425.50,
  "averageLoss": -180.75,
  "profitFactor": 2.35,
  "totalProfit": 25750.82
}
```

## Market Data Endpoints

#### Get Market Quotes
```
GET /market/quotes
```

**Query Parameters:**
- `symbols`: Comma-separated list of symbols

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "price": 175.50,
    "change": 2.25,
    "changePercent": 1.3,
    "volume": 45200000,
    "high": 176.20,
    "low": 172.80,
    "open": 173.25
  }
]
```

#### Get Market History
```
GET /market/history
```

**Query Parameters:**
- `symbol`: Symbol
- `interval` (optional): Data interval (1h, 1d, 1wk, 1mo)
- `range` (optional): Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y)

**Response:**
```json
[
  {
    "date": "2025-03-17T00:00:00.000Z",
    "open": 170.25,
    "high": 171.50,
    "low": 169.75,
    "close": 171.25,
    "volume": 42500000
  },
  ...
  {
    "date": "2025-04-16T00:00:00.000Z",
    "open": 173.25,
    "high": 176.20,
    "low": 172.80,
    "close": 175.50,
    "volume": 45200000
  }
]
```

## Error Responses

All endpoints return standard HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response body:
```json
{
  "message": "Error message description"
}
```
