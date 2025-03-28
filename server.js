require('dotenv').config({ debug: true });
const path = require('path');
const fs = require('fs');
const express = require('express');
const algosdk = require('algosdk');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const createError = require('http-errors');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const CUSTOM_ENUMS = require('./utils/enums');

// Initialize Express
const app = express();

// =============================================
// ENHANCED ACCOUNT RECOVERY
// =============================================
console.log("\n🔍 Initializing Blockchain Account Recovery...");

const recoverAccounts = () => {
  try {
    const validateMnemonic = (mnemonic) => {
      if (!mnemonic) throw new Error("Mnemonic is undefined");
      const words = mnemonic.trim().split(' ');
      if (words.length !== 25) throw new Error("Must be 25 words");
      return mnemonic.trim();
    };

    const mnemonic1 = validateMnemonic(process.env.ACCOUNT1_MNEMONIC);
    const mnemonic2 = validateMnemonic(process.env.ACCOUNT2_MNEMONIC);

    const account1 = algosdk.mnemonicToSecretKey(mnemonic1);
    const account2 = algosdk.mnemonicToSecretKey(mnemonic2);

    const getAddress = (addr) => {
      if (!addr) throw new Error("Address not found in .env");
      return String(addr).trim().replace(/[^A-Z2-7]/g, '').substring(0, 58);
    };

    const expectedAddr1 = getAddress(process.env.ACCOUNT1_ADDRESS);
    const expectedAddr2 = getAddress(process.env.ACCOUNT2_ADDRESS);

    if (account1.addr !== expectedAddr1 || account2.addr !== expectedAddr2) {
      throw new Error(`Address mismatch!`);
    }

    console.log("\n✅ Account Recovery Successful!");
    return { account1, account2 };

  } catch (error) {
    console.error("\n🚨 Account Recovery Failed:", error.message);
    process.exit(1);
  }
};

const accounts = recoverAccounts();

// =============================================
// MIDDLEWARE CONFIGURATION
// =============================================

// 1. Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 3. Core Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 4. Logging
if (process.env.NODE_ENV === 'production') {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'), 
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  app.use(morgan('dev'));
}

// 5. Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 6. Authentication
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passport Configuration
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await db.users.findOne({ where: { email } });
      if (!user) return done(null, false, { message: 'Incorrect email.' });
      if (!(await user.validPassword(password))) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.users.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// =============================================
// ROUTES CONFIGURATION
// =============================================

// 1. API Documentation
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodPrint API',
      version: '1.0.0',
    },
  },
  apis: ['./routes/*.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 2. Application Routes
const routes = [
  require('./routes'),
  require('./routes/blockchain'),
  require('./routes/auth'),
  require('./routes/harvest'),
  require('./routes/storage'),
  // Add other route files here
];

routes.forEach(route => {
  app.use(route.basePath || '/', route.router);
});

// =============================================
// ERROR HANDLING
// =============================================

// 404 Handler
app.use((req, res, next) => {
  next(createError(404));
});

// Global Error Handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error', { 
    title: 'Error',
    user: req.user 
  });
});

// =============================================
// SERVER STARTUP
// =============================================

const PORT = process.env.PORT || 3000;
const sequelize = require('./config/db/db_sequelise');

sequelize.authenticate()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🔗 Account 1: ${accounts.account1.addr}`);
      console.log(`🔗 Account 2: ${accounts.account2.addr}`);
      console.log(`📚 API Docs: http://0.0.0.0:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

module.exports = app;