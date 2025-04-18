import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Layout, Menu, Button, Card, Statistic, Table, Tag, Tabs, 
  Select, Input, Switch, Slider, DatePicker, TimePicker,
  Dropdown, Modal, Form, Spin, Alert, notification, Typography,
  Row, Col, Divider, Space, Avatar, Badge, Progress, List
} from 'antd';
import {
  DashboardOutlined, LineChartOutlined, BarChartOutlined, 
  PieChartOutlined, SettingOutlined, UserOutlined, 
  WalletOutlined, BankOutlined, RiseOutlined, FallOutlined,
  ReloadOutlined, SearchOutlined, BellOutlined, LogoutOutlined,
  InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, ArrowUpOutlined, ArrowDownOutlined,
  DollarOutlined, GlobalOutlined, LockOutlined, UnlockOutlined
} from '@ant-design/icons';

import './App.css';

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Mock data for demonstration
const mockPortfolioData = {
  balance: 125750.82,
  initialCapital: 100000,
  profitLoss: 25750.82,
  profitLossPercentage: 25.75,
  positions: [
    { ticker: 'AAPL', quantity: 50, entryPrice: 150.25, currentPrice: 175.50, pnl: 1262.50, pnlPercentage: 16.81 },
    { ticker: 'MSFT', quantity: 30, entryPrice: 250.75, currentPrice: 280.30, pnl: 886.50, pnlPercentage: 11.79 },
    { ticker: 'GOOGL', quantity: -20, entryPrice: 125.50, currentPrice: 115.20, pnl: 206.00, pnlPercentage: 8.21 },
  ],
  transactions: [
    { id: 1, ticker: 'AAPL', type: 'BUY', quantity: 50, price: 150.25, timestamp: '2025-04-15T14:30:00Z', total: 7512.50 },
    { id: 2, ticker: 'MSFT', type: 'BUY', quantity: 30, price: 250.75, timestamp: '2025-04-15T15:45:00Z', total: 7522.50 },
    { id: 3, ticker: 'GOOGL', type: 'SELL', quantity: 20, price: 125.50, timestamp: '2025-04-16T10:15:00Z', total: 2510.00 },
  ],
  performance: {
    daily: 1.25,
    weekly: 3.75,
    monthly: 8.50,
    yearly: 25.75,
  },
  metrics: {
    winRate: 68.5,
    profitFactor: 2.35,
    sharpeRatio: 1.85,
    maxDrawdown: 12.3,
    averageProfitPerTrade: 325.50,
    averageHoldingPeriod: 3.5,
  }
};

const mockMarketData = {
  indices: [
    { name: 'S&P 500', value: 5125.35, change: 0.75 },
    { name: 'NASDAQ', value: 16250.75, change: 1.25 },
    { name: 'DOW', value: 38750.50, change: 0.25 },
  ],
  topMovers: [
    { ticker: 'NVDA', price: 875.25, change: 5.75 },
    { ticker: 'TSLA', price: 225.50, change: -3.25 },
    { ticker: 'AMD', price: 175.75, change: 4.50 },
  ],
  sectors: [
    { name: 'Technology', performance: 2.75 },
    { name: 'Healthcare', performance: 1.25 },
    { name: 'Finance', performance: -0.50 },
    { name: 'Energy', performance: -1.25 },
    { name: 'Consumer', performance: 0.75 },
  ]
};

const mockPredictions = [
  { ticker: 'AAPL', direction: 'BUY', confidence: 0.85, target: 195.50, timeframe: '5 days' },
  { ticker: 'MSFT', direction: 'BUY', confidence: 0.75, target: 295.25, timeframe: '7 days' },
  { ticker: 'GOOGL', direction: 'SELL', confidence: 0.65, target: 105.75, timeframe: '3 days' },
  { ticker: 'AMZN', direction: 'BUY', confidence: 0.80, target: 185.50, timeframe: '5 days' },
  { ticker: 'META', direction: 'HOLD', confidence: 0.55, target: 475.25, timeframe: '10 days' },
];

const mockPerformanceData = [
  { date: '2025-03-16', portfolio: 100000, benchmark: 100000 },
  { date: '2025-03-23', portfolio: 102500, benchmark: 101500 },
  { date: '2025-03-30', portfolio: 105000, benchmark: 102000 },
  { date: '2025-04-06', portfolio: 112500, benchmark: 103500 },
  { date: '2025-04-13', portfolio: 120000, benchmark: 105000 },
  { date: '2025-04-16', portfolio: 125750, benchmark: 106250 },
];

const mockDailyPnL = [
  { date: '2025-04-10', pnl: 1250 },
  { date: '2025-04-11', pnl: -750 },
  { date: '2025-04-12', pnl: 2250 },
  { date: '2025-04-13', pnl: 1750 },
  { date: '2025-04-14', pnl: -500 },
  { date: '2025-04-15', pnl: 3250 },
  { date: '2025-04-16', pnl: 1500 },
];

const mockAssetAllocation = [
  { name: 'Technology', value: 45 },
  { name: 'Healthcare', value: 20 },
  { name: 'Finance', value: 15 },
  { name: 'Consumer', value: 10 },
  { name: 'Energy', value: 5 },
  { name: 'Cash', value: 5 },
];

// Main App Component
const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.className = darkMode ? '' : 'dark-theme';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading AI Trading Platform...</p>
      </div>
    );
  }

  return (
    <Router>
      <Layout className={darkMode ? 'dark-theme' : ''} style={{ minHeight: '100vh' }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          width={250}
          className="sidebar"
        >
          <div className="logo">
            {collapsed ? 'ATP' : 'AI Trading Platform'}
          </div>
          <Menu
            theme={darkMode ? 'dark' : 'light'}
            mode="inline"
            defaultSelectedKeys={['dashboard']}
          >
            <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
              <Link to="/dashboard">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="portfolio" icon={<WalletOutlined />}>
              <Link to="/portfolio">Portfolio</Link>
            </Menu.Item>
            <Menu.Item key="predictions" icon={<LineChartOutlined />}>
              <Link to="/predictions">AI Predictions</Link>
            </Menu.Item>
            <Menu.Item key="trading" icon={<RiseOutlined />}>
              <Link to="/trading">Trading</Link>
            </Menu.Item>
            <Menu.Item key="analytics" icon={<BarChartOutlined />}>
              <Link to="/analytics">Analytics</Link>
            </Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />}>
              <Link to="/settings">Settings</Link>
            </Menu.Item>
          </Menu>
          <div className="sidebar-footer">
            <Switch 
              checkedChildren="🌙" 
              unCheckedChildren="☀️" 
              checked={darkMode} 
              onChange={toggleTheme} 
            />
          </div>
        </Sider>
        <Layout>
          <Header className="header">
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)} 
              className="trigger-button"
            />
            <div className="header-right">
              <Button type="text" icon={<BellOutlined />} className="notification-button">
                <Badge count={3} />
              </Button>
              <Dropdown
                menu={{
                  items: [
                    { key: '1', label: 'Profile', icon: <UserOutlined /> },
                    { key: '2', label: 'Settings', icon: <SettingOutlined /> },
                    { key: '3', label: 'Logout', icon: <LogoutOutlined /> },
                  ],
                }}
                placement="bottomRight"
              >
                <div className="user-info">
                  <Avatar src={currentUser.avatar} />
                  {!collapsed && <span className="username">{currentUser.name}</span>}
                </div>
              </Dropdown>
            </div>
          </Header>
          <Content className="content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>
          <Footer className="footer">
            AI Trading Platform ©2025 Created by Manus
          </Footer>
        </Layout>
      </Layout>
    </Router>
  );
};

// Dashboard Component
const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="page-header">
        <Title level={2}>Dashboard</Title>
        <div className="page-header-actions">
          <Button icon={<ReloadOutlined />}>Refresh</Button>
          <DatePicker />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* Portfolio Summary */}
        <Col xs={24} lg={8}>
          <Card title="Portfolio Summary" className="summary-card">
            <Statistic
              title="Total Balance"
              value={mockPortfolioData.balance}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
            <div className="profit-loss">
              <Statistic
                title="Profit/Loss"
                value={mockPortfolioData.profitLoss}
                precision={2}
                prefix="$"
                suffix={`(${mockPortfolioData.profitLossPercentage}%)`}
                valueStyle={{ 
                  color: mockPortfolioData.profitLoss >= 0 ? '#3f8600' : '#cf1322',
                  fontSize: '16px'
                }}
                prefix={mockPortfolioData.profitLoss >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              />
            </div>
            <Divider />
            <div className="performance-metrics">
              <div className="metric">
                <Text type="secondary">Daily</Text>
                <Text style={{ 
                  color: mockPortfolioData.performance.daily >= 0 ? '#3f8600' : '#cf1322' 
                }}>
                  {mockPortfolioData.performance.daily >= 0 ? '+' : ''}
                  {mockPortfolioData.performance.daily}%
                </Text>
              </div>
              <div className="metric">
                <Text type="secondary">Weekly</Text>
                <Text style={{ 
                  color: mockPortfolioData.performance.weekly >= 0 ? '#3f8600' : '#cf1322' 
                }}>
                  {mockPortfolioData.performance.weekly >= 0 ? '+' : ''}
                  {mockPortfolioData.performance.weekly}%
                </Text>
              </div>
              <div className="metric">
                <Text type="secondary">Monthly</Text>
                <Text style={{ 
                  color: mockPortfolioData.performance.monthly >= 0 ? '#3f8600' : '#cf1322' 
                }}>
                  {mockPortfolioData.performance.monthly >= 0 ? '+' : ''}
                  {mockPortfolioData.performance.monthly}%
                </Text>
              </div>
              <div className="metric">
                <Text type="secondary">Yearly</Text>
                <Text style={{ 
                  color: mockPortfolioData.performance.yearly >= 0 ? '#3f8600' : '#cf1322' 
                }}>
                  {mockPortfolioData.performance.yearly >= 0 ? '+' : ''}
                  {mockPortfolioData.performance.yearly}%
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Performance Chart */}
        <Col xs={24} lg={16}>
          <Card title="Portfolio Performance" className="chart-card">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="portfolio" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Portfolio"
                />
                <Line 
                  type="monotone" 
                  dataKey="benchmark" 
                  stroke="#82ca9d" 
                  name="S&P 500"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Top AI Predictions */}
        <Col xs={24} lg={12}>
          <Card title="Top AI Predictions" className="predictions-card">
            <List
              itemLayout="horizontal"
              dataSource={mockPredictions.slice(0, 3)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: item.direction === 'BUY' 
                            ? '#52c41a' 
                            : item.direction === 'SELL' 
                              ? '#f5222d' 
                              : '#faad14'
                        }}
                      >
                        {item.direction === 'BUY' 
                          ? <ArrowUpOutlined /> 
                          : item.direction === 'SELL' 
                            ? <ArrowDownOutlined /> 
                            : <MinusOutlined />}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong>{item.ticker}</Text>
                        <Tag color={
                          item.direction === 'BUY' 
                            ? 'green' 
                            : item.direction === 'SELL' 
                              ? 'red' 
                              : 'orange'
                        }>
                          {item.direction}
                        </Tag>
                      </Space>
                    }
                    description={
                      <>
                        <Text type="secondary">Target: ${item.target} • Timeframe: {item.timeframe}</Text>
                        <Progress 
                          percent={Math.round(item.confidence * 100)} 
                          size="small" 
                          status={
                            item.confidence > 0.8 
                              ? 'success' 
                              : item.confidence > 0.6 
                                ? 'normal' 
                                : 'exception'
                          }
                        />
                      </>
                    }
                  />
                </List.Item>
              )}
            />
            <div className="card-footer">
              <Button type="link">View All Predictions</Button>
            </div>
          </Card>
        </Col>

        {/* Daily P&L */}
        <Col xs={24} lg={12}>
          <Card title="Daily Profit & Loss" className="chart-card">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockDailyPnL}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="pnl" 
                  name="P&L ($)"
                  fill={(entry) => (entry.pnl >= 0 ? '#52c41a
(Content truncated due to size limit. Use line ranges to read in chunks)