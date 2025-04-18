// Main JavaScript for AI Trading Platform

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips and popovers
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Sidebar toggle
    document.getElementById('sidebarCollapse').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('content').classList.toggle('active');
    });

    // Page navigation
    var navLinks = document.querySelectorAll('#sidebar a[data-page]');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(function(navLink) {
                navLink.parentElement.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            // Hide all pages
            var pages = document.querySelectorAll('.page-content');
            pages.forEach(function(page) {
                page.classList.remove('active');
            });
            
            // Show selected page
            var pageId = this.getAttribute('data-page') + '-page';
            document.getElementById(pageId).classList.add('active');
        });
    });

    // Dark mode toggle
    document.getElementById('darkModeSwitch').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        updateChartColors();
    });

    // Initialize charts
    initializeCharts();
});

function initializeCharts() {
    // Performance Chart
    var performanceCtx = document.getElementById('performanceChart').getContext('2d');
    var performanceChart = new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Portfolio Value',
                data: [100000, 102500, 105000, 103000, 107500, 110000, 112500, 115000, 118000, 121000, 123500, 125750],
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderColor: 'rgba(78, 115, 223, 1)',
                pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3
            }, {
                label: 'S&P 500',
                data: [100000, 101000, 102500, 101500, 103000, 104500, 106000, 107500, 109000, 110500, 112000, 113500],
                backgroundColor: 'rgba(28, 200, 138, 0.05)',
                borderColor: 'rgba(28, 200, 138, 1)',
                pointBackgroundColor: 'rgba(28, 200, 138, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(28, 200, 138, 1)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 25,
                    top: 25,
                    bottom: 0
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: "rgb(234, 236, 244)",
                        zeroLineColor: "rgb(234, 236, 244)",
                        drawBorder: false,
                        borderDash: [2],
                        zeroLineBorderDash: [2]
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '$' + context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Daily P&L Chart
    var dailyPnLCtx = document.getElementById('dailyPnLChart').getContext('2d');
    var dailyPnLChart = new Chart(dailyPnLCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Tue', 'Wed'],
            datasets: [{
                label: 'Daily P&L',
                data: [350, -120, 275, 450, 125, -200, 300, 550, -150, 225, 400, 175, 325],
                backgroundColor: function(context) {
                    var index = context.dataIndex;
                    var value = context.dataset.data[index];
                    return value < 0 ? 'rgba(231, 74, 59, 0.8)' : 'rgba(28, 200, 138, 0.8)';
                },
                borderColor: function(context) {
                    var index = context.dataIndex;
                    var value = context.dataset.data[index];
                    return value < 0 ? 'rgb(231, 74, 59)' : 'rgb(28, 200, 138)';
                },
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 25,
                    top: 25,
                    bottom: 0
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: "rgb(234, 236, 244)",
                        zeroLineColor: "rgb(234, 236, 244)",
                        drawBorder: false,
                        borderDash: [2],
                        zeroLineBorderDash: [2]
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '$' + context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Asset Allocation Chart
    var assetAllocationCtx = document.getElementById('assetAllocationChart').getContext('2d');
    var assetAllocationChart = new Chart(assetAllocationCtx, {
        type: 'doughnut',
        data: {
            labels: ['Technology', 'Healthcare', 'Financial', 'Consumer Cyclical', 'Energy', 'Cash'],
            datasets: [{
                data: [35, 20, 15, 10, 10, 10],
                backgroundColor: [
                    'rgba(78, 115, 223, 0.8)',
                    'rgba(28, 200, 138, 0.8)',
                    'rgba(54, 185, 204, 0.8)',
                    'rgba(246, 194, 62, 0.8)',
                    'rgba(231, 74, 59, 0.8)',
                    'rgba(90, 92, 105, 0.8)'
                ],
                borderColor: [
                    'rgb(78, 115, 223)',
                    'rgb(28, 200, 138)',
                    'rgb(54, 185, 204)',
                    'rgb(246, 194, 62)',
                    'rgb(231, 74, 59)',
                    'rgb(90, 92, 105)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        boxWidth: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed + '%';
                            }
                            return label;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });

    // Store charts for later reference
    window.tradingCharts = {
        performanceChart: performanceChart,
        dailyPnLChart: dailyPnLChart,
        assetAllocationChart: assetAllocationChart
    };
}

function updateChartColors() {
    // Update chart colors based on dark mode
    var isDarkMode = document.body.classList.contains('dark-mode');
    
    // Update grid colors
    var gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgb(234, 236, 244)";
    
    // Update all charts
    Object.values(window.tradingCharts).forEach(function(chart) {
        if (chart.config.type === 'line' || chart.config.type === 'bar') {
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.y.grid.zeroLineColor = gridColor;
            
            // Update text colors
            chart.options.scales.x.ticks.color = isDarkMode ? "#f8f9fc" : "#5a5c69";
            chart.options.scales.y.ticks.color = isDarkMode ? "#f8f9fc" : "#5a5c69";
            
            // Update legend colors
            if (chart.options.plugins.legend.display) {
                chart.options.plugins.legend.labels.color = isDarkMode ? "#f8f9fc" : "#5a5c69";
            }
        }
        
        chart.update();
    });
}

// Simulate API calls and data updates
function fetchMarketData() {
    // This would be replaced with actual API calls in production
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                marketIndices: {
                    sp500: { value: 5125.35, change: 0.75 },
                    nasdaq: { value: 16250.75, change: 1.25 },
                    dow: { value: 38750.50, change: 0.25 }
                },
                topMovers: [
                    { symbol: 'NVDA', price: 875.25, change: 5.75 },
                    { symbol: 'TSLA', price: 225.50, change: -3.25 },
                    { symbol: 'AMD', price: 175.75, change: 4.50 }
                ]
            });
        }, 500);
    });
}

function fetchPortfolioData() {
    // This would be replaced with actual API calls in production
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalValue: 125750.82,
                totalGain: 25750.82,
                totalGainPercent: 25.75,
                performance: {
                    daily: 1.25,
                    weekly: 3.75,
                    monthly: 8.50,
                    yearly: 25.75
                },
                positions: [
                    { ticker: 'AAPL', type: 'LONG', quantity: 50, entryPrice: 150.25, currentPrice: 175.50, pnl: 1262.50, pnlPercent: 16.81 },
                    { ticker: 'MSFT', type: 'LONG', quantity: 30, entryPrice: 250.75, currentPrice: 280.30, pnl: 886.50, pnlPercent: 11.79 },
                    { ticker: 'GOOGL', type: 'SHORT', quantity: 20, entryPrice: 125.50, currentPrice: 115.20, pnl: 206.00, pnlPercent: 8.21 }
                ]
            });
        }, 700);
    });
}

function fetchPredictions() {
    // This would be replaced with actual API calls in production
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { symbol: 'AAPL', signal: 'BUY', target: 195.50, timeframe: 5, confidence: 85 },
                { symbol: 'MSFT', signal: 'BUY', target: 295.25, timeframe: 7, confidence: 75 },
                { symbol: 'GOOGL', signal: 'SELL', target: 105.75, timeframe: 3, confidence: 65 }
            ]);
        }, 600);
    });
}

// Refresh data periodically (would be implemented in production)
function startDataRefresh() {
    // Refresh market data every 5 minutes
    setInterval(() => {
        fetchMarketData().then(updateMarketDisplay);
    }, 300000);
    
    // Refresh portfolio data every minute
    setInterval(() => {
        fetchPortfolioData().then(updatePortfolioDisplay);
    }, 60000);
    
    // Refresh predictions every 15 minutes
    setInterval(() => {
        fetchPredictions().then(updatePredictionsDisplay);
    }, 900000);
}

// These functions would update the UI with fresh data
function updateMarketDisplay(data) {
    console.log('Updating market display with:', data);
    // Implementation would update DOM elements with new data
}

function updatePortfolioDisplay(data) {
    console.log('Updating portfolio display with:', data);
    // Implementation would update DOM elements with new data
}

function updatePredictionsDisplay(data) {
    console.log('Updating predictions display with:', data);
    // Implementation would update DOM elements with new data
}
