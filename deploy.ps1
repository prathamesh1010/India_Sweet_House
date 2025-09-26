# India Sweet House Analytics - Vercel Deployment Script (PowerShell)
# This script helps you deploy your application to Vercel

Write-Host "🚀 India Sweet House Analytics - Vercel Deployment" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Vercel CLI not found"
    }
} catch {
    Write-Host "❌ Vercel CLI is not installed." -ForegroundColor Red
    Write-Host "Please install it with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host "Or deploy via the Vercel Dashboard at https://vercel.com" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    vercel whoami 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
} catch {
    Write-Host "🔐 Please log in to Vercel:" -ForegroundColor Yellow
    vercel login
}

Write-Host "📦 Building the project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Blue
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "Your application is now live on Vercel!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test your deployed application" -ForegroundColor White
    Write-Host "2. Check the API endpoints:" -ForegroundColor White
    Write-Host "   - /api/health" -ForegroundColor Gray
    Write-Host "   - /api/process-file" -ForegroundColor Gray
    Write-Host "   - /api/interest-analysis" -ForegroundColor Gray
    Write-Host "3. Upload a sample Excel file to test functionality" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 For more information, see VERCEL_DEPLOYMENT.md" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
