#!/bin/bash

echo "🚀 Atlas Geography Games - Deployment Script"
echo "=============================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "   Download from: https://git-scm.com/"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Atlas Geography Games"
    echo "✅ Git repository initialized"
else
    echo "📁 Git repository already exists"
fi

echo ""
echo "🌐 Choose deployment method:"
echo "1. GitHub Pages (Free, recommended)"
echo "2. Netlify (Free, drag & drop)"
echo "3. Vercel (Free, CLI deployment)"
echo "4. Manual deployment instructions"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📋 GitHub Pages Deployment Steps:"
        echo "=================================="
        echo ""
        echo "1. Create a new repository on GitHub:"
        echo "   - Go to https://github.com/new"
        echo "   - Name it: atlas-geography"
        echo "   - Make it public"
        echo "   - Don't initialize with README"
        echo ""
        echo "2. Add your GitHub username:"
        read -p "Enter your GitHub username: " username
        echo ""
        echo "3. Connect and push to GitHub:"
        echo "   git remote add origin https://github.com/$username/atlas-geography.git"
        echo "   git branch -M main"
        echo "   git push -u origin main"
        echo ""
        echo "4. Enable GitHub Pages:"
        echo "   - Go to your repository on GitHub"
        echo "   - Click 'Settings' → 'Pages'"
        echo "   - Select 'Deploy from a branch'"
        echo "   - Choose 'main' branch and '/ (root)' folder"
        echo "   - Click 'Save'"
        echo ""
        echo "5. Your game will be available at:"
        echo "   https://$username.github.io/atlas-geography/"
        echo ""
        echo "Would you like me to run the git commands now? (y/n)"
        read -p "Choice: " run_git
        if [ "$run_git" = "y" ] || [ "$run_git" = "Y" ]; then
            echo ""
            echo "🔗 Adding remote origin..."
            git remote add origin https://github.com/$username/atlas-geography.git
            echo "🌿 Setting main branch..."
            git branch -M main
            echo "📤 Pushing to GitHub..."
            git push -u origin main
            echo ""
            echo "✅ Successfully pushed to GitHub!"
            echo "🎮 Now enable GitHub Pages in your repository settings."
            echo "🌐 Your game will be live at: https://$username.github.io/atlas-geography/"
        fi
        ;;
    2)
        echo ""
        echo "📋 Netlify Deployment Steps:"
        echo "=============================="
        echo ""
        echo "1. Go to https://netlify.com"
        echo "2. Sign up/Login with GitHub"
        echo "3. Drag and drop your entire 'atlas' folder"
        echo "4. Wait for deployment (usually 1-2 minutes)"
        echo "5. Get your live URL instantly!"
        echo ""
        echo "✨ That's it! Netlify handles everything automatically."
        ;;
    3)
        echo ""
        echo "📋 Vercel Deployment Steps:"
        echo "============================"
        echo ""
        echo "1. Install Vercel CLI:"
        echo "   npm install -g vercel"
        echo ""
        echo "2. Deploy:"
        echo "   vercel"
        echo ""
        echo "3. Follow the prompts and get your live URL!"
        ;;
    4)
        echo ""
        echo "📋 Manual Deployment Options:"
        echo "=============================="
        echo ""
        echo "• Upload to any web hosting service"
        echo "• Use any static site hosting"
        echo "• Deploy to your own server"
        echo ""
        echo "📁 Just upload all files to your web server's public directory."
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment instructions completed!"
echo "🌍 Your Atlas Geography Games will be playable online!"
echo ""
echo "💡 Need help? Check the README.md file for detailed instructions."
