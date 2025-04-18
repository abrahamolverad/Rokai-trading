#!/bin/bash

# Deploy script for AI Trading Platform

echo "Starting deployment process for AI Trading Platform..."

# Check if we're deploying locally or to cloud
if [ "$1" == "local" ]; then
    echo "Setting up for local deployment..."
    
    # Create .env file from example if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        echo "Please update the .env file with your actual configuration values."
    fi
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    
    # Start the application
    echo "Starting the application locally..."
    npm run dev
    
elif [ "$1" == "heroku" ]; then
    echo "Setting up for Heroku deployment..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        echo "Heroku CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to Heroku
    if ! heroku auth:whoami &> /dev/null; then
        echo "Not logged in to Heroku. Please run 'heroku login' first."
        exit 1
    fi
    
    # Create Heroku app if app name is provided
    if [ -n "$2" ]; then
        echo "Creating Heroku app: $2..."
        heroku create $2
    else
        echo "Creating Heroku app with random name..."
        heroku create
    fi
    
    # Add MongoDB addon
    echo "Adding MongoDB addon..."
    heroku addons:create mongolab:sandbox
    
    # Set environment variables
    echo "Setting environment variables..."
    heroku config:set NODE_ENV=production
    heroku config:set JWT_SECRET=$(openssl rand -hex 32)
    
    # Deploy to Heroku
    echo "Deploying to Heroku..."
    git add .
    git commit -m "Deployment to Heroku"
    git push heroku main
    
    # Open the app
    echo "Opening the app..."
    heroku open
    
elif [ "$1" == "render" ]; then
    echo "Setting up for Render deployment..."
    
    # Check if render-cli is installed
    if ! command -v render &> /dev/null; then
        echo "Render CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Deploy using render.yaml
    echo "Deploying to Render using render.yaml..."
    render deploy
    
else
    echo "Please specify deployment target: local, heroku, or render"
    echo "Usage: ./deploy.sh [local|heroku|render] [app-name]"
    exit 1
fi

echo "Deployment process completed!"
