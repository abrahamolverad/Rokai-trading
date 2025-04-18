# Testing Guide for Rokai-Trading Platform

This document provides instructions for testing the Rokai-Trading platform after deployment to ensure all components are functioning correctly.

## Prerequisites
- The Rokai-Trading platform has been successfully deployed to Render
- You have the URL of your deployed application (e.g., https://rokai-trading.onrender.com)
- You have a modern web browser (Chrome, Firefox, Safari, or Edge)

## Testing Checklist

### 1. Basic Access Testing
- [ ] Navigate to your application URL
- [ ] Verify the login page loads correctly with "Rokai-Trading" branding
- [ ] Confirm all static assets (CSS, JavaScript) load without errors

### 2. Authentication Testing
- [ ] Use the demo credentials to log in (email: demo@rokai-trading.com, password: demo123)
- [ ] Verify successful login redirects to the dashboard
- [ ] Test the registration page by creating a new test account
- [ ] Verify logout functionality works correctly

### 3. Dashboard Testing
- [ ] Confirm the dashboard loads with portfolio overview
- [ ] Verify the portfolio chart displays correctly
- [ ] Check that all navigation links work (Trading, AI Predictions, Analytics)
- [ ] Test the dark/light mode toggle functionality

### 4. Trading Features Testing
- [ ] Navigate to the Trading page
- [ ] Verify the order form loads correctly
- [ ] Test placing a simulated market order
- [ ] Confirm the order appears in recent trades

### 5. AI Predictions Testing
- [ ] Navigate to the AI Predictions page
- [ ] Verify prediction cards display correctly
- [ ] Check that prediction details are accessible
- [ ] Test filtering or sorting predictions if available

### 6. Analytics Testing
- [ ] Navigate to the Analytics page
- [ ] Verify performance charts load correctly
- [ ] Test any interactive elements on the analytics page

### 7. Responsive Design Testing
- [ ] Test the application on a mobile device or using browser developer tools
- [ ] Verify the responsive design adapts to different screen sizes
- [ ] Confirm all functionality works on mobile devices

### 8. API Testing
- [ ] Test the health endpoint: `GET /api/health`
- [ ] Verify authentication endpoints: `POST /api/auth/login`
- [ ] Test protected endpoints with and without authentication

## Troubleshooting Common Issues

### Application Not Loading
- Check if the Render deployment completed successfully
- Verify all environment variables are set correctly
- Check Render logs for any deployment errors

### Database Connection Issues
- Verify the MongoDB connection string is correct
- Ensure the database password is properly set in the environment variables
- Check if IP access restrictions are properly configured in MongoDB Atlas

### Authentication Problems
- Clear browser cookies and cache
- Verify the JWT_SECRET environment variable is set
- Check for any CORS issues in the browser console

## Reporting Issues
If you encounter any issues during testing, please document:
1. The specific feature or page where the issue occurred
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser and device information

## Next Steps After Testing
Once testing is complete and all features are working as expected:
1. Set up regular backups of your MongoDB database
2. Configure monitoring for your Render application
3. Consider setting up a custom domain for your application
