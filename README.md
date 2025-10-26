# 🎬 DesterLib - Your Personal Media Server

Welcome! **DesterLib** is a system that lets you watch your movies and TV shows from anywhere. It's like Netflix, but for YOUR personal collection!

Think of it this way:
- 📚 **Library**: A place where all your movies and shows are organized
- 🎞️ **Player**: Tools to watch your media smoothly
- ⚙️ **Engine**: The behind-the-scenes magic that makes everything work

---

## 📦 What's Inside?

This project has two main parts:

1. **Backend API** (`apps/api/`) - The engine that does all the work
   - Organizes your media files
   - Streams videos to your devices
   - Remembers what you're watching
   - Talks to the database

2. **Mobile & Desktop App** (`desterlib-flutter/`) - The way you watch on your devices
   - Browse your media collection (Movies, TV Shows)
   - Play videos smoothly
   - Manage settings
   - Works on Android, iOS, macOS, Linux, Windows, and TV (coming soon!)

---

## 🚀 Quick Start (Using Docker)

### What You Need First
- **Docker** installed on your computer ([Get Docker](https://www.docker.com/products/docker-desktop))
- A folder with your movies/TV shows
- A few minutes to set up

### Step 1: Configure Your System

Create a file called `.env` in the `apps/api/` folder with your settings:

```bash
# Database settings (usually keep these as-is)
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/desterlib_prod?schema=public"
NODE_ENV="development"
PORT=3001

# TMDB (The Movie Database) - for movie information
# Get free key from: https://www.themoviedb.org/settings/api
TMDB_API_KEY="your_tmdb_key_here"

# Choose where to watch from
FRONTEND_URL="http://localhost:3001"
```

> **Not sure about TMDB?** It's a free service that gives us movie posters, descriptions, and ratings!

### Step 2: Start Everything

```bash
# Start the services (API + Database)
docker-compose up
```

That's it! Docker will:
- 🐘 Start a PostgreSQL database
- 🔧 Build and run the API
- 📁 Set up your media library

### Step 3: Access Your System

- **Web Dashboard**: Open `http://localhost:3001` in your browser
- **API Documentation**: Go to `http://localhost:3001/api-docs` to see all features
- **Mobile App**: Use the Flutter app to connect (configure the server URL)

---

## 📱 Using the Mobile App

### Install

1. Get the Flutter app source from `desterlib-flutter/`
2. Run: `flutter pub get` (downloads everything needed)
3. Build it for your phone:
   - **Android**: `flutter build apk`
   - **iOS**: `flutter build ios`

### Configure

When you open the app:
1. Enter your server address (like `http://192.168.1.100:3001`)
2. The app will connect and show your media
3. Tap any movie or show to watch!

---

## 🔧 Development Setup

Want to work on the code? Here's how:

### Backend Development

```bash
# Install dependencies
pnpm install

# Start development server (watches for code changes)
cd apps/api
pnpm dev

# Run tests
pnpm test

# Format code nicely
pnpm format
```

### Mobile App Development

```bash
# Install dependencies
flutter pub get

# Start development (interactive mode)
flutter run

# Build for your phone
flutter build apk    # Android
flutter build ios    # iOS
flutter build web    # Web browser
```

---

## 📂 How It's Organized

### Backend Structure
```
apps/api/src/
├── domains/       ← Features (movies, TV shows, streaming, etc.)
├── lib/          ← Shared tools and helpers
├── core/         ← Configuration and central services
└── routes/       ← API endpoints
```

### Mobile App Structure
```
lib/
├── features/     ← Screens and features (watch, browse, settings)
├── api/          ← Communication with the backend
├── shared/       ← Reusable widgets and helpers
└── core/         ← Configuration and global setup
```

---

## 🎯 Main Features

✅ **Scan & Index** - Automatically finds and organizes your media  
✅ **Browse Library** - Find movies and shows easily  
✅ **Smooth Streaming** - Watch without buffering  
✅ **Multi-Device** - Watch on phone, tablet, or desktop (Linux, macOS, Windows)  
✅ **Track Progress** - Remember where you stopped (coming soon)  
✅ **Settings** - Personalize your experience

---

## 🐛 Troubleshooting

### "Can't connect to the server"
- Make sure the API is running: `docker-compose up`
- Check the server address in the app settings
- Make sure you're on the same network (or use your computer's IP)

### "Movies aren't showing up"
- Go to Settings → Scan Library
- Make sure your media folder is mounted correctly
- Check that file names follow standard formats (movie name + year)

### "Video won't play"
- Check your internet connection
- Try a different video format (MP4, MKV usually work best)
- Restart the app

### Database issues
- Run: `docker-compose down` then `docker-compose up`
- This resets the database completely

---

## 🛠️ Useful Commands

### Backend (API)

```bash
# Check code for errors
pnpm lint

# Fix code automatically
pnpm lint:fix

# Build for production
pnpm build

# Start in production
pnpm start

# Database management
pnpm db:studio          # Open database viewer
pnpm db:migrate        # Create new database changes
pnpm db:push           # Apply changes to database
```

### Mobile App

```bash
# Download dependencies
flutter pub get

# Check code for issues
flutter analyze

# Format code nicely
dart format lib/

# Clean everything (use when things break)
flutter clean
```

---

## 📚 Important Paths

- **Media Files**: `/Volumes/External/Library/Media` - Your movies and shows
- **Database**: Stored automatically in PostgreSQL
- **Logs**: `logs/` folder - useful for debugging
- **API Docs**: `http://localhost:3001/api-docs` - what the API can do

---

## 🚢 Production Deployment

When you want to use this in the real world (not just locally):

```bash
# Build production version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

This:
- Uses production database
- Optimizes performance
- Secures your connection
- Removes development tools

---

## 📖 Learning More

- **API Documentation**: Visit `http://localhost:3001/api-docs` (Swagger UI) - note: some features in docs may be in development
- **Backend Architecture**: Read `apps/api/STRUCTURE.md`
- **Mobile Architecture**: Read `desterlib-flutter/CODE_STRUCTURE.md`
- **Database Schema**: Check `apps/api/prisma/schema.prisma`

---

## 💡 Tips

1. **First time?** Start with `docker-compose up` and open http://localhost:3001
2. **Need help?** Check logs: `docker logs desterlib-api`
3. **Slow video?** Check your internet speed and video bitrate
4. **Want to contribute?** Follow the commit guidelines in `.commitlintrc`

---

## ❓ FAQ

**Q: Can I watch when I'm away from home?**  
A: Yes! Set up port forwarding on your router or use a service like ngrok.

**Q: How much space do I need?**  
A: At least as much as your media collection, plus 10% extra.

**Q: Can multiple people watch at once?**  
A: Yes, but each stream uses bandwidth.

**Q: Is my data private?**  
A: Yes! Everything stays on your computer.

---

## 📝 Need Help?

Check these files:
- `.env.example` - Example configuration
- `docker-compose.yml` - Docker setup details
- `apps/api/STRUCTURE.md` - API organization
- `desterlib-flutter/CODE_STRUCTURE.md` - App organization

---

**Happy watching! 🎉**
