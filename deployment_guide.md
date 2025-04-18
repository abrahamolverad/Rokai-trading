# AI Trading Platform Deployment Guide

This guide provides instructions for deploying the AI Trading Platform to various environments.

## Prerequisites

Before deploying, ensure you have the following:

1. Node.js (v14 or higher) and npm installed
2. MongoDB instance (local or cloud-based like MongoDB Atlas)
3. Git installed
4. Heroku CLI (for Heroku deployment) or Render account (for Render deployment)

## Local Deployment

To deploy the application locally for development or testing:

1. Clone the repository:
   ```
   git clone https://github.com/your-username/ai-trading-platform.git
   cd ai-trading-platform/web
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

3. Update the `.env` file with your MongoDB connection string and other configuration values.

4. Install dependencies:
   ```
   npm install
   ```

5. Start the application:
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

## Heroku Deployment

To deploy the application to Heroku:

1. Create a Heroku account if you don't have one
2. Install the Heroku CLI
3. Login to Heroku:
   ```
   heroku login
   ```

4. Run the deployment script:
   ```
   ./deploy.sh heroku ai-trading-platform
   ```

5. The script will:
   - Create a new Heroku app
   - Add MongoDB add-on
   - Configure environment variables
   - Deploy the application
   - Open the application in your browser

6. Alternatively, you can deploy manually:
   ```
   heroku create ai-trading-platform
   heroku addons:create mongolab:sandbox
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secure_jwt_secret
   git push heroku main
   heroku open
   ```

## Render Deployment

To deploy the application to Render:

1. Create a Render account if you don't have one
2. Connect your GitHub repository to Render
3. Create a new Web Service
4. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment Variables: Add all variables from `.env.example`

5. Alternatively, use the `render.yaml` file for Infrastructure as Code deployment:
   ```
   ./deploy.sh render
   ```

## Post-Deployment Verification

After deploying, verify the following:

1. The application is accessible at the deployment URL
2. User registration and login work correctly
3. Portfolio creation and management function properly
4. Trading functionality works as expected
5. AI predictions are generated and displayed
6. Analytics charts and data are displayed correctly

## Troubleshooting

If you encounter issues during deployment:

1. Check application logs:
   - Heroku: `heroku logs --tail`
   - Render: Check logs in the Render dashboard

2. Verify environment variables are set correctly

3. Ensure MongoDB connection is working:
   - Check connection string format
   - Verify network access settings (IP whitelist)

4. For frontend issues, check browser console for errors

## Monitoring

Once deployed, monitor the application using:

1. Heroku Metrics or Render Metrics
2. MongoDB Atlas monitoring (if using Atlas)
3. Application logs for error tracking
4. Regular health checks via the `/api/health` endpoint

## Maintenance

Regular maintenance tasks:

1. Update dependencies regularly:
   ```
   npm outdated
   npm update
   ```

2. Monitor database performance and scale as needed
3. Backup database regularly
4. Review and rotate JWT secrets periodically
5. Monitor API rate limits and adjust as needed
