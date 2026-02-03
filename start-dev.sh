echo "🚀 Starting FitFuel Development Environment with Live Reload..."

if ! brew services list | grep -q "mongodb-community.*started"; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    brew services start mongodb-community
    sleep 3
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

echo "🔧 Starting backend (with nodemon) and frontend (with live-server)..."
echo "✨ Changes will automatically reload in your browser!"
echo ""

npm run dev
