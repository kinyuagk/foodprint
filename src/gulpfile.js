/* Needed gulp config */
var gulp = require('gulp');  
var sass = require('gulp-sass')(require('sass'));
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var notify = require('gulp-notify');
var cleanCSS = require('gulp-clean-css'); // Replacing gulp-minify-css
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');

/* Setup scss path */
var paths = {
    scss: './sass/*.scss'
};

/* Scripts task */
function scripts() {
  return gulp.src([
    'js/vendor/jquery.min.js',
    'js/vendor/jquery.easing.1.3.js',
    'js/vendor/jquery.stellar.min.js',
    'js/vendor/jquery.flexslider-min.js',
    'js/vendor/jquery.countTo.js',
    'js/vendor/jquery.appear.min.js',
    'js/vendor/jquery.magnific-popup.min.js',
    'js/vendor/owl.carousel.min.js',
    'js/vendor/bootstrap.min.js',
    'js/vendor/jquery.waypoints.min.js'
  ])
  .pipe(concat('scripts.js'))
  .pipe(gulp.dest('js'))
  .pipe(rename({ suffix: '.min' }))
  .pipe(uglify())
  .pipe(gulp.dest('js'))
  .pipe(browserSync.stream());
}

/* Minify main.js */
function minifyMain() {
  return gulp.src('js/main.js')
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('js'))
    .pipe(browserSync.stream());
}

/* Sass task */
function sassTask() {
  return gulp.src('scss/style.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      precision: 10
    }).on('error', sass.logError))
    .pipe(autoprefixer({
        overrideBrowserslist: ['last 2 versions'], // Fixing autoprefixer syntax
        cascade: false
    }))
    .pipe(gulp.dest('css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('css'))
    .pipe(browserSync.stream());
}

/* Merge and minify styles */
function mergeStyles() {
  return gulp.src([
      'css/vendor/bootstrap.min.css',
      'css/vendor/animate.css',
      'css/vendor/icomoon.css',
      'css/vendor/flexslider.css',
      'css/vendor/owl.carousel.min.css',
      'css/vendor/owl.theme.default.min.css',
      'css/vendor/magnific-popup.css',
      'css/vendor/photoswipe.css',
      'css/vendor/default-skin.css',
      'fonts/icomoon/style.css'
  ])
  .pipe(concat('styles-merged.css'))
  .pipe(gulp.dest('css'))
  .pipe(rename({ suffix: '.min' }))
  .pipe(cleanCSS())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('css'))
  .pipe(browserSync.stream());
}

/* Reload Browser */
function bsReload(done) {
    browserSync.reload();
    done();
}

/* Browser-sync */
function browserSyncInit() {
    browserSync.init({
        proxy: 'localhost/probootstrap/green'
    });
}

/* Watch task */
function watchFiles() {
    gulp.watch(['scss/*.scss', 'scss/**/*.scss'], sassTask);
    gulp.watch(['js/main.js'], minifyMain);
    gulp.watch(['*.html'], bsReload);
}

/* Define complex tasks */
const build = gulp.series(gulp.parallel(scripts, minifyMain, sassTask, mergeStyles));
const watch = gulp.parallel(watchFiles, browserSyncInit);

/* Export tasks */
exports.scripts = scripts;
exports.minifyMain = minifyMain;
exports.sassTask = sassTask;
exports.mergeStyles = mergeStyles;
exports.browserSyncInit = browserSyncInit;
exports.watch = watch;
exports.default = build;
