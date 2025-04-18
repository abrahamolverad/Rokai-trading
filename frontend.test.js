const puppeteer = require('puppeteer');

describe('Frontend Integration Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('Login page loads correctly', async () => {
    await page.goto('http://localhost:3000/login.html');
    
    // Check that login form elements exist
    const usernameInput = await page.$('input[name="username"]');
    const passwordInput = await page.$('input[name="password"]');
    const loginButton = await page.$('button[type="submit"]');
    
    expect(usernameInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(loginButton).toBeTruthy();
  });
  
  test('Registration page loads correctly', async () => {
    await page.goto('http://localhost:3000/register.html');
    
    // Check that registration form elements exist
    const usernameInput = await page.$('input[name="username"]');
    const emailInput = await page.$('input[name="email"]');
    const passwordInput = await page.$('input[name="password"]');
    const confirmPasswordInput = await page.$('input[name="confirmPassword"]');
    const registerButton = await page.$('button[type="submit"]');
    
    expect(usernameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
    expect(registerButton).toBeTruthy();
  });
  
  test('Dashboard loads correctly after login', async () => {
    await page.goto('http://localhost:3000/login.html');
    
    // Fill in login form
    await page.type('input[name="username"]', 'testuser');
    await page.type('input[name="password"]', 'Password123!');
    
    // Submit form and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Check that we're on the dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('index.html');
    
    // Check for dashboard elements
    const portfolioSection = await page.$('.portfolio-summary');
    const tradingSection = await page.$('.trading-section');
    const predictionsSection = await page.$('.predictions-section');
    
    expect(portfolioSection).toBeTruthy();
    expect(tradingSection).toBeTruthy();
    expect(predictionsSection).toBeTruthy();
  });
  
  test('Trading page functionality', async () => {
    await page.goto('http://localhost:3000/trading.html');
    
    // Check for trading form elements
    const symbolInput = await page.$('input[name="symbol"]');
    const quantityInput = await page.$('input[name="quantity"]');
    const buyButton = await page.$('button.buy-btn');
    const sellButton = await page.$('button.sell-btn');
    
    expect(symbolInput).toBeTruthy();
    expect(quantityInput).toBeTruthy();
    expect(buyButton).toBeTruthy();
    expect(sellButton).toBeTruthy();
    
    // Test buy order submission
    await page.type('input[name="symbol"]', 'AAPL');
    await page.type('input[name="quantity"]', '10');
    
    // Click buy and wait for confirmation
    await Promise.all([
      page.click('button.buy-btn'),
      page.waitForSelector('.order-confirmation')
    ]);
    
    // Check confirmation message
    const confirmationText = await page.$eval('.order-confirmation', el => el.textContent);
    expect(confirmationText).toContain('Order placed successfully');
  });
  
  test('Predictions page displays AI signals', async () => {
    await page.goto('http://localhost:3000/predictions.html');
    
    // Wait for predictions to load
    await page.waitForSelector('.prediction-card');
    
    // Check that predictions are displayed
    const predictionCards = await page.$$('.prediction-card');
    expect(predictionCards.length).toBeGreaterThan(0);
    
    // Check prediction card content
    const firstCardContent = await page.$eval('.prediction-card', el => el.textContent);
    expect(firstCardContent).toContain('Signal');
    expect(firstCardContent).toContain('Confidence');
    expect(firstCardContent).toContain('Target Price');
  });
  
  test('Analytics page displays charts', async () => {
    await page.goto('http://localhost:3000/analytics.html');
    
    // Wait for charts to load
    await page.waitForSelector('.chart-container');
    
    // Check that charts are displayed
    const chartContainers = await page.$$('.chart-container');
    expect(chartContainers.length).toBeGreaterThan(0);
    
    // Check for performance metrics
    const metricsSection = await page.$('.performance-metrics');
    expect(metricsSection).toBeTruthy();
    
    const metricsContent = await page.$eval('.performance-metrics', el => el.textContent);
    expect(metricsContent).toContain('Win Rate');
    expect(metricsContent).toContain('Profit Factor');
  });
  
  test('Responsive design works on mobile viewport', async () => {
    // Set viewport to mobile size
    await page.setViewport({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000/index.html');
    
    // Check that mobile menu button is visible
    const mobileMenuButton = await page.$('.mobile-menu-toggle');
    expect(mobileMenuButton).toBeTruthy();
    
    // Open mobile menu
    await page.click('.mobile-menu-toggle');
    
    // Check that menu items are visible
    await page.waitForSelector('.mobile-menu.open');
    
    const mobileMenuItems = await page.$$('.mobile-menu.open .nav-item');
    expect(mobileMenuItems.length).toBeGreaterThan(3); // Should have at least 4 nav items
  });
});
