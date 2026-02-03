# FitFuel

A web application that helps users track workouts, set fitness goals, and discover recipes that match their calorie needs. FitFuel provides a simple, all-in-one platform for managing your fitness journey.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Usage](#usage)
- [Testing Basic Functionality](#testing-basic-functionality)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

## Description

FitFuel is a student project that combines fitness tracking with smart recipe recommendations. The app allows users to:

- Log workout activities with detailed metrics (distance, duration, elevation)
- Set personal fitness goals (lose, maintain, or gain weight)
- Browse and filter recipes based on calorie needs
- View a social feed of activities from friends and followers
- Track daily calorie burn and get personalized recipe suggestions

The project demonstrates full-stack web development skills using modern technologies and follows responsive design principles.

## Features

- **Activity Logging**: Manual entry of workouts with distance, duration, elevation, and sport type
- **Goal Setting**: Set daily calorie targets based on fitness objectives
- **Recipe Management**: Browse, search, and create recipes with nutritional information
- **Social Feed**: View activities from friends and followers
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Works on desktop and mobile devices
- **Privacy Controls**: Choose who can see your activities (Everyone, Followers, Only You)

## Installation

### Prerequisites

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - Either local installation or MongoDB Atlas account
- A modern web browser (Chrome, Firefox, Safari, etc.)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fitfuel.git
   cd fitfuel
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Configure environment**
   
   The server uses configuration in `server/config.js`. The defaults work for local development:
   - **Port**: 4000 (backend)
   - **MongoDB URI**: `mongodb://localhost:27017/fitfuel`
   - **Frontend Origin**: `http://localhost:8008`
   - **JWT Secret**: Default secret (change in production)

   If using MongoDB Atlas, update `MONGO_URI` in `server/config.js`:
   ```javascript
   MONGO_URI: process.env.MONGO_URI || 'your-mongodb-atlas-connection-string'
   ```

5. **Start MongoDB**
   
   **Option A: Local MongoDB**
   ```bash
   # macOS (if installed via Homebrew)
   brew services start mongodb-community
   
   # Or just run mongod
   mongod
   ```
   
   **Option B: MongoDB Atlas**
   - Make sure your connection string is set in `server/config.js`
   - No local MongoDB needed

## Database Setup

### Option 1: Start with Empty Database (Recommended for First Time)

The database is automatically created when you first run the server. No manual setup needed!

- MongoDB will create the `fitfuel` database automatically
- Collections (users, activities, goals, recipes, etc.) are created when you use the app
- Just make sure MongoDB is running before starting the server

### Option 2: Seed Database with Test Data

To populate the database with sample data for testing:

```bash
cd server
npm run seed
```

**What gets created:**
- 3 test user accounts
- Sample activities (running, gym workouts, bike rides)
- Sample goals (weight loss, maintenance goals)
- Sample recipes (chicken salad, overnight oats, pasta)
- Sample user preferences and privacy settings

**Test Account Credentials:**
- Email: `test@fitfuel.com` | Password: `testpassword123`
- Email: `jane@fitfuel.com` | Password: `testpassword123`
- Email: `john@fitfuel.com` | Password: `testpassword123`

**Important:** The seed script will **clear all existing data** before adding test data. Only use this in development!

### Export/Import Database (For Instructors)

To export the database for backup or sharing:

```bash
mongoexport --uri="mongodb://localhost:27017/fitfuel" --collection=users --out=users.json
mongoexport --uri="mongodb://localhost:27017/fitfuel" --collection=activities --out=activities.json
mongoexport --uri="mongodb://localhost:27017/fitfuel" --collection=goals --out=goals.json
mongoexport --uri="mongodb://localhost:27017/fitfuel" --collection=recipes --out=recipes.json
mongoexport --uri="mongodb://localhost:27017/fitfuel" --collection=userpreferences --out=userpreferences.json
```

To import exported data:

```bash
mongoimport --uri="mongodb://localhost:27017/fitfuel" --collection=users --file=users.json
mongoimport --uri="mongodb://localhost:27017/fitfuel" --collection=activities --file=activities.json
mongoimport --uri="mongodb://localhost:27017/fitfuel" --collection=goals --file=goals.json
mongoimport --uri="mongodb://localhost:27017/fitfuel" --collection=recipes --file=recipes.json
mongoimport --uri="mongodb://localhost:27017/fitfuel" --collection=userpreferences --file=userpreferences.json
```

## Running the Application

### Easy Way (Recommended)

```bash
./start-dev.sh
```

### Manual Way

```bash
cd server
npm run dev
# or
npm start

npm run dev:frontend
# or
npx live-server --port=8008
```

The app will open automatically at `http://localhost:8008`

## Testing Basic Functionality

### 1. Create an Account
- Click "Sign In" in the top right
- Click "Create Account"
- Enter your name, email, and password
- You should be redirected to the dashboard

**Or use test account:** `test@fitfuel.com` / `testpassword123` (if you ran the seed script)

### 2. Set a Goal
- Click "Goals" in the navigation
- Choose "Survey" or "Manual" tab
- Fill out the form and submit
- You should see a success message

### 3. Log an Activity
- Click "Data" in the navigation
- Click "Manual Entry" tab
- Fill in activity details (sport, distance, duration, etc.)
- Click "Save Activity"
- Check your dashboard to see the activity

### 4. Create a Recipe
- Click "Recipes" in the navigation
- Click "Manual Add Recipe" in the sidebar
- Fill in recipe details (name, ingredients, steps, etc.)
- Upload an image (optional)
- Click "Add Recipe"
- Your recipe should appear in the recipes page

### 5. View Your Profile
- Click your profile icon in the top right
- You should see your activities, goals, and recipe recommendations

## Project Structure

```
final-project-fitfuel/
├── css/                    # Stylesheets
│   ├── styles.css         # Global styles
│   ├── activity.css        # Activity page styles
│   ├── feed.css           # Social feed styles
│   ├── recipes.css        # Recipe page styles
│   ├── goals.css          # Goals page styles
│   └── recipe-view.css    # Recipe detail styles
├── js/                     # JavaScript files
│   ├── script.js           # Main script
│   ├── api.js              # API service
│   ├── nav.js              # Navigation management
│   ├── feed.js             # Social feed functionality
│   ├── activity.js         # Activity form handling
│   ├── forms.js            # Form management
│   ├── profile.js          # Profile page
│   ├── recipe.js           # Recipe browsing
│   ├── recipe-view.js      # Recipe detail view
│   └── manual_recipe.js    # Manual recipe creation
├── server/                 # Backend server files
│   ├── server.js           # Express server entry point
│   ├── config.js           # Server configuration
│   ├── seed-database.js    # Database seeding script
│   ├── models/             # Database models (User, Activity, Goal, Recipe, UserPreferences)
│   ├── routes/             # API routes (auth, activities, goals, recipes, feed, preferences, recommendations)
│   └── middleware/         # Custom middleware (requireAuth, optionalAuth)
├── index.html              # Main HTML file
├── logo.png               # Project logo
└── start-dev.sh           # Development startup script
```

## Technologies Used

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Styling with Flexbox and Grid layouts
- **JavaScript (ES6+)**: Modern JavaScript with classes and modules
- **Chart.js**: Data visualization for fitness metrics
- **Live Server**: Development server with auto-reload

### Backend
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: MongoDB object modeling
- **bcrypt**: Password hashing
- **JWT (jsonwebtoken)**: Token-based authentication
- **helmet**: Security middleware
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting on API endpoints
- **express-validator**: Input validation
- **mongo-sanitize**: Input sanitization to prevent injection attacks
- **nodemon**: Auto-restart server in development

### Development Tools
- **Git**: Version control
- **Concurrently**: Run multiple processes simultaneously
- **Live Server**: Frontend development server

## Security Features

- **Input Sanitization**: All user inputs are sanitized using `mongo-sanitize` to prevent MongoDB injection attacks
- **Input Validation**: All API endpoints validate required fields, data types, and acceptable values using `express-validator`
- **Schema Validation**: Mongoose schemas enforce data types, min/max values, and required fields
- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Authentication**: Token-based authentication for API requests
- **CORS Protection**: Configured to allow requests from frontend origin
- **Rate Limiting**: Applied to authentication endpoints to prevent abuse
- **Helmet**: Security headers middleware

## Contributing

We welcome contributions to improve FitFuel! Here's how you can help:

### How to Contribute

1. **Fork the repository** on GitHub
2. **Create a feature branch** for your changes
3. **Make your changes** and test them thoroughly
4. **Submit a pull request** with a clear description

### Development Guidelines

- Follow the existing code style and structure
- Test your changes before submitting
- Write clear commit messages
- Update documentation if needed
- Ensure responsive design works on different screen sizes

### Areas for Improvement

- Add more fitness tracking features
- Improve recipe parsing accuracy
- Enhance social features
- Add mobile app support
- Implement data export functionality

## Credits

**Project Author**: Johanna Fan
- **Course**: CPSC 332 - Web Development
- **Institution**: Gonzaga University
- **Semester**: Fall 2025

### Acknowledgments

- **Instructors**: For guidance and project requirements
- **Classmates**: For feedback and testing
- **Open Source Community**: For the libraries and tools used
- **Design Inspiration**: Modern fitness and recipe apps

### Third-Party Resources

- **Font Awesome**: Icons used throughout the application
- **Chart.js**: Data visualization library
- **Express.js**: Web framework
- **MongoDB**: Database system

## License

This project is created for educational purposes as part of a university course. The code is available for learning and demonstration purposes.

**Educational Use**: This project is intended for academic learning and portfolio demonstration. Please respect the educational nature of this work.

**Attribution**: If you use any part of this code for learning purposes, please provide appropriate attribution.

---

*This project was created as part of CPSC 332 Web Development course requirements. It demonstrates full-stack web development skills using modern technologies and responsive design principles.*
