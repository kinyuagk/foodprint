// ✅ Load environment variables at the start
require('dotenv').config();

const path = require('path');
const fs = require('fs');  
const express = require('express');
const algosdk = require('algosdk');
const CUSTOM_ENUMS = require('./utils/enums');

// ✅ Essential middleware & security-related modules
const logger = require('morgan');  
const cookieParser = require('cookie-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');

// ✅ API documentation with Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// ✅ Import your routes correctly
const router = require('./routes');
const blockchainRouter = require('./routes/blockchain');
const configRouter = require('./routes/config');
const authRouter = require('./routes/auth');
const harvestRouter = require('./routes/harvest');
const storageRouter = require('./routes/storage');
const produceRouter = require('./routes/produce');
const dashboardsRouter = require('./routes/dashboards');
const buyerRouter = require('./routes/buyer');
const sellerRouter = require('./routes/seller');
const orderRouter = require('./routes/order');
const emailRouter = require('./routes/email');
const searchRouter = require('./routes/search');
const qrCodeRouter = require('./routes/qrcode'); // Ensure the filename matches
const apiV1Router = require('./routes/api_v1'); // Ensure this matches the actual filename
const testRouter = require('./routes/test'); 

// ✅ Initialize Express
const app = express();

// 🏗️ Swagger Configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodPrint API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation using Swagger',
    },
  },
  apis: ['./routes/*.js'], // Ensures all route files are included in Swagger docs
};

// 🔹 Generate Swagger Specs
const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// ✅ Serve Swagger UI at `/api-docs`
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ✅ Load and Validate Environment Variables
console.log("🔍 DEBUG: Loading environment variables...");
console.log("ACCOUNT1_MNEMONIC:", process.env.ACCOUNT1_MNEMONIC ? '✅ Loaded' : '❌ Missing');
console.log("ACCOUNT2_MNEMONIC:", process.env.ACCOUNT2_MNEMONIC ? '✅ Loaded' : '❌ Missing');
console.log("ACCOUNT1_ADDRESS:", process.env.ACCOUNT1_ADDRESS || '❌ Not Set');
console.log("ACCOUNT2_ADDRESS:", process.env.ACCOUNT2_ADDRESS || '❌ Not Set');

const mnemonicPhrase1 = process.env.ACCOUNT1_MNEMONIC?.trim() || '';
const mnemonicPhrase2 = process.env.ACCOUNT2_MNEMONIC?.trim() || '';
const expectedAccount1 = process.env.ACCOUNT1_ADDRESS?.trim() || '';
const expectedAccount2 = process.env.ACCOUNT2_ADDRESS?.trim() || '';

if (!mnemonicPhrase1 || !mnemonicPhrase2) {
    console.error("🚨 Mnemonic phrases are missing. Check your .env file!");
    process.exit(1);
}

console.log('✅ .env file loaded');
console.log('Mnemonic Phrase 1:', mnemonicPhrase1 ? '✅ Loaded' : '❌ Missing');
console.log('Mnemonic Phrase 2:', mnemonicPhrase2 ? '✅ Loaded' : '❌ Missing');

if (!mnemonicPhrase1 || !mnemonicPhrase2) {
    console.error("🚨 Mnemonic phrases are missing. Check your .env file!");
    process.exit(1);
}

// ✅ Recover Algorand Accounts
try {
    const account1 = algosdk.mnemonicToSecretKey(mnemonicPhrase1);
    const account2 = algosdk.mnemonicToSecretKey(mnemonicPhrase2);

    console.log("✅ Account 1 Address:", account1.addr);
    console.log("✅ Account 2 Address:", account2.addr);
    console.log("🔍 Expected Account 1 Address:", expectedAccount1);
    console.log("🔍 Expected Account 2 Address:", expectedAccount2);

    // Validate if recovered accounts match the expected addresses
    if (account1.addr !== expectedAccount1) {
        console.error("❌ Account 1 does not match the expected address in .env!");
        process.exit(1);
    }

    if (account2.addr !== expectedAccount2) {
        console.error("❌ Account 2 does not match the expected address in .env!");
        process.exit(1);
    }

    console.log("✅ Both accounts recovered successfully and match .env!");
} catch (error) {
    console.error("🚨 Error recovering accounts:", error.message);
    process.exit(1);
}

// ✅ Express Configuration
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ✅ Logging Setup
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

if (app.get('env') === CUSTOM_ENUMS.PRODUCTION) {
    app.use(logger('common', {
        skip: (req, res) => res.statusCode < 400,
    }));
} else {
    app.use(logger('dev', { stream: accessLogStream }));
}

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 }, // 30 min
  })
);

// ✅ Passport Initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ✅ Global Middleware for Flash Messages
app.use((req, res, next) => {
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

// ✅ Mount Routers
app.use('/', router);                
app.use('/blockchain', blockchainRouter);
app.use('/app/config', configRouter);
app.use('/app/auth', authRouter);
app.use('/app/harvest', harvestRouter);
app.use('/app/storage', storageRouter);
app.use('/app/produce', produceRouter);
app.use('/app/dashboards', dashboardsRouter);
app.use('/app/buyer', buyerRouter);
app.use('/app/seller', sellerRouter);
app.use('/app/order', orderRouter);
app.use('/app/email', emailRouter);
app.use('/app/search', searchRouter);
app.use('/app/qrcode', qrCodeRouter);
app.use('/app/api/v1', apiV1Router);
app.use('/app/test', testRouter);

// ✅ Serve Static Files
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static(path.join(__dirname, 'build')));

// ✅ Passport Strategies
passport.use('file-local', new LocalStrategy(
    {
        usernameField: 'loginUsername',
        passwordField: 'loginPassword',
    },
    (username, password, done) => {
        db.users.findByUsername(username, (err, user) => {
            if (err) return done(err);
            if (!user || user.password !== password) {
                return done(null, false, { message: 'Invalid credentials' });
            }
            return done(null, user);
        });
    }
));

passport.use('db-local', new LocalStrategy(
    {
        usernameField: 'loginUsername',
        passwordField: 'loginPassword',
    },
    (username, password, done) => {
        db.users.findByUsername(username, (err, user) => {
            if (err) return done(err);
            if (!user || user.password !== password) {
                return done(null, false, { message: 'Invalid credentials' });
            }
            return done(null, user);
        });
    }
));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

//home page
router.get(
  '/',
  require('connect-ensure-login').ensureLoggedIn({ redirectTo: '/app/auth/login' }),
  function (req, res) {
    if (req.user.role == ROLES.Admin || req.user.role == ROLES.Superuser) {
      res.render('index', { user: req.user, page_name: 'home', admin_status: true });
    } else {
      res.render('index', { user: req.user, page_name: 'home', admin_status: false });
    }

    //res.sendFile(path.join(__dirname+'/src/index.html')); //__dirname : It will resolve to your project folder.
  }
);

// error handler
// to define an error-handling middleware, we simply define a middleware in our server.js with four arguments: err, req, res, and next.
// As long as we have these four arguments, Express will recognize the middleware as an error handling middleware
//Note that error handler must be the last middleware in chain, so it should be defined in the bottom of your application.js file after other app.use() and routes calls.
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error', { user: req.user, page_name: 'error' });
});

// alternative error handlers based on mode
// app.configure('development', () => {
//   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
// })

// app.configure('production', () => {
//   app.use(express.errorHandler())
// })

// app.listen(process.env.PORT || 3000);
//
// console.log('Running at Port 3000');

sequelise
  .authenticate()
  .then(() => {
    console.log('Database connected...');
  })
  .catch(err => {
    console.log('Error connecting to database: ' + err);
  });

const PORT = process.env.PORT || 3000;
sequelise
  .sync()
  .then(() => {
    app.listen(PORT, console.log(`Server started on port ${PORT}`));
  })
  .catch(err => console.log('Error synching models: ' + err));

module.exports = app;
