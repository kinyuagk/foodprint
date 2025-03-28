require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const morgan = require('morgan');

class AppServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.host = process.env.HOST || '0.0.0.0';
    this.env = process.env.NODE_ENV || 'development';

    this.initializeMiddlewares();
    this.initializeStaticAssets();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use(limiter);

    // Standard middleware
    this.app.use(morgan('dev'));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    this.app.use(cookieParser());

    // Favicon handling
    this.app.get('/favicon.ico', (req, res) => res.status(204).end());
  }

  initializeStaticAssets() {
    // Priority 1: Serve compiled frontend assets from src directory
    this.app.use(express.static(path.join(__dirname, 'src')));
    
    // Priority 2: Serve bundled JS files
    this.app.use('/js', express.static(path.join(__dirname, 'src/js')));
    
    // Priority 3: Serve CSS assets
    this.app.use('/css', express.static(path.join(__dirname, 'src/css')));
    
    // Priority 4: Serve images
    this.app.use('/img', express.static(path.join(__dirname, 'src/img')));

    // Handle root route - serve your main EJS template
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'views/index.html')); // Update path if using EJS
    });
  }

  async initializeRoutes() {
    try {
      const routesPath = path.join(__dirname, 'routes');
      const routeFiles = (await fs.readdir(routesPath)).filter(file => 
        file.endsWith('.js') && file !== 'index.js'
      );

      // Load all route files dynamically
      await Promise.all(routeFiles.map(async (file) => {
        const routeName = file.replace('.js', '');
        const routePath = `/${routeName.replace(/_/g, '/')}`; // Convert api_v1 to /api/v1
        const router = require(path.join(routesPath, file));
        
        this.app.use(routePath, router);
        console.log(`✓ Route mounted: ${routePath}`);
      }));

      // Load index route if exists
      const indexPath = path.join(routesPath, 'index.js');
      try {
        await fs.access(indexPath);
        const indexRouter = require(indexPath);
        this.app.use('/', indexRouter);
        console.log('✓ Index route mounted');
      } catch {
        console.log('ℹ️ No index route found');
      }
    } catch (err) {
      console.error('Route initialization error:', err);
      process.exit(1);
    }
  }

  initializeSwagger() {
    try {
      const swaggerDocument = YAML.load('./swagger.yaml');
      this.app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
          explorer: true,
          customSiteTitle: 'FoodPrint API Docs'
        })
      );
      console.log('✓ Swagger documentation loaded');
    } catch (err) {
      console.warn('⚠️ Swagger documentation not loaded');
    }
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
        path: req.originalUrl
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Server Error:', err.stack);
      res.status(err.status || 500).json({
        success: false,
        message: err.message,
        ...(this.env === 'development' && { stack: err.stack })
      });
    });
  }

  start() {
    this.server = this.app.listen(this.port, this.host, () => {
      console.log(`🚀 Server running on http://${this.host}:${this.port}`);
      console.log(`📚 API Docs: http://${this.host}:${this.port}/api-docs`);
      console.log(`Environment: ${this.env}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    this.server?.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
}

// Start the server
const server = new AppServer();
server.start();

module.exports = server.app;