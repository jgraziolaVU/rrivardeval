#!/bin/bash

# Course Evaluation Summarizer Deployment Script
# This script helps deploy the application to Vercel

echo "🚀 Course Evaluation Summarizer Deployment"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found."
    echo "Please create .env.local with your Anthropic API key:"
    echo "ANTHROPIC_API_KEY=your_anthropic_api_key_here"
    echo ""
    read -p "Do you want to create .env.local now? (y/N): " create_env
    if [[ $create_env =~ ^[Yy]$ ]]; then
        read -p "Enter your Anthropic API key: " api_key
        echo "ANTHROPIC_API_KEY=$api_key" > .env.local
        echo "✅ .env.local created successfully!"
    else
        echo "⚠️  Remember to set ANTHROPIC_API_KEY in Vercel environment variables."
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Navigate to Settings > Environment Variables"
echo "3. Add ANTHROPIC_API_KEY with your API key"
echo "4. Redeploy if needed"
echo ""
echo "🎉 Your Course Evaluation Summarizer is ready!"
