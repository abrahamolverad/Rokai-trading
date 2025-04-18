#!/bin/bash

# Deployment script for Rokai-Trading platform to Render

echo "Starting deployment of Rokai-Trading platform to Render..."

# Create a temporary directory for deployment
DEPLOY_DIR=$(mktemp -d)
echo "Created temporary directory: $DEPLOY_DIR"

# Copy necessary files to deployment directory
echo "Copying files to deployment directory..."
cp -r /home/ubuntu/trading_ai_platform/web/* $DEPLOY_DIR/
cp /home/ubuntu/trading_ai_platform/web/render.yaml $DEPLOY_DIR/

# Create .env file for Render
echo "Creating .env file for Render..."
cat > $DEPLOY_DIR/.env << EOL
NODE_ENV=production
PORT=8080
JWT_SECRET=$(openssl rand -hex 32)
MONGODB_URI=mongodb+srv://abrahamisaiolvera:${DB_PASSWORD}@rokai.gynaifg.mongodb.net/rokai-trading?retryWrites=true&w=majority&appName=rokai
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
BCRYPT_SALT_ROUNDS=10
TOKEN_EXPIRATION=86400
EOL

# Initialize Git repository
echo "Initializing Git repository..."
cd $DEPLOY_DIR
git init
git add .
git config --global user.email "deployment@rokai-trading.com"
git config --global user.name "Deployment Bot"
git commit -m "Initial deployment of Rokai-Trading platform"

# Instructions for manual deployment to Render
echo "==============================================================="
echo "Deployment package prepared successfully!"
echo "To deploy to Render, follow these steps:"
echo "1. Create a new account on Render.com if you don't have one"
echo "2. Create a new Web Service"
echo "3. Connect your GitHub/GitLab account or use the 'Upload' option"
echo "4. If using Upload, compress this directory and upload it:"
echo "   $DEPLOY_DIR"
echo "5. Set the following environment variables in Render:"
echo "   - NODE_ENV: production"
echo "   - PORT: 8080"
echo "   - JWT_SECRET: (a secure random string)"
echo "   - MONGODB_URI: mongodb+srv://abrahamisaiolvera:YOUR_PASSWORD@rokai.gynaifg.mongodb.net/rokai-trading?retryWrites=true&w=majority&appName=rokai"
echo "   - RATE_LIMIT_WINDOW_MS: 900000"
echo "   - RATE_LIMIT_MAX: 100"
echo "   - BCRYPT_SALT_ROUNDS: 10"
echo "   - TOKEN_EXPIRATION: 86400"
echo "6. Set the build command to: npm install"
echo "7. Set the start command to: node server.js"
echo "==============================================================="

echo "Deployment preparation complete. Files are ready at: $DEPLOY_DIR"
