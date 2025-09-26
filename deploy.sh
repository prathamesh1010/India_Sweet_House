#!/bin/bash

# India Sweet House Analytics - Vercel Deployment Script
# This script helps you deploy your application to Vercel

echo "🚀 India Sweet House Analytics - Vercel Deployment"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "Please install it with: npm i -g vercel"
    echo "Or deploy via the Vercel Dashboard at https://vercel.com"
    exit 1
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "Your application is now live on Vercel!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test your deployed application"
    echo "2. Check the API endpoints:"
    echo "   - /api/health"
    echo "   - /api/process-file"
    echo "   - /api/interest-analysis"
    echo "3. Upload a sample Excel file to test functionality"
    echo ""
    echo "📖 For more information, see VERCEL_DEPLOYMENT.md"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
