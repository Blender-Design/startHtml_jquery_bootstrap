const {src, dest, parallel, series, watch} = require('gulp');

const browserSync    = require('browser-sync').create();
const browserSyncSsi = require('browsersync-ssi');
const ssi            = require('ssi');
const sass           = require('gulp-sass')(require('sass'));
const sassGlob       = require('gulp-sass-glob');
const sourcemaps     = require('gulp-sourcemaps');
const postcss        = require('gulp-postcss');
const autoprefixer   = require('autoprefixer');
const cssnano        = require('cssnano');
const concat         = require('gulp-concat');
const uglify         = require('gulp-uglify');
const changed        = require('gulp-changed');
const imagemin       = require('gulp-imagemin');
const del            = require('del');

let srcDir = 'src',
    distDir = 'dist';

function taskBrowsersync() {
  browserSync.init({
    server: {
      baseDir: srcDir,
      middleware: browserSyncSsi({
        baseDir: srcDir,
        ext: '.html'
      })
    },
    ghostMode: {
      clicks: false
    },
    notify: false,
    online: true
    // tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
  });
}

function taskSass() {
  return src(srcDir + '/sass/style.{sass,scss}')
    .pipe(sourcemaps.init())
    .pipe(eval(sassGlob)())
    .pipe(eval(sass)().on("error", sass.logError))
    .pipe(postcss([
      autoprefixer({
        grid: 'autoplace'
      }),
      cssnano({
        preset: ['default', {
          discardComments: {
            removeAll: true
          }
        }]
      })
    ]))
    .pipe(concat('style.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(srcDir + '/css'))
    .pipe(browserSync.stream());
}

function taskSassApp() {
  return src(srcDir + '/sass/app.{sass,scss}')
    .pipe(sourcemaps.init())
    .pipe(eval(sassGlob)())
    .pipe(eval(sass)().on("error", sass.logError))
    .pipe(postcss([
      autoprefixer({
        grid: 'autoplace'
      }),
      cssnano({
        preset: ['default', {
          discardComments: {
            removeAll: true
          }
        }]
      })
    ]))
    .pipe(concat('app.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(srcDir + '/css'))
    .pipe(browserSync.stream());
}

function taskJs() {
  return src([srcDir + '/js/**/*.js', '!' + srcDir + '/js/*.min.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(dest(srcDir + '/js'))
    .pipe(browserSync.stream());
}

function taskJsApp() {
  return src([
      './node_modules/jquery/dist/jquery.js',
      './node_modules/bootstrap/dist/js/bootstrap.bundle.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(dest(srcDir + '/js'));
}

function taskImg() {
  return src([srcDir + '/img/src/**/*'])
    .pipe(changed(srcDir + '/img/dist'))
    .pipe(imagemin())
    .pipe(dest(srcDir + '/img/dist'))
    .pipe(browserSync.stream())
}

async function taskHtmlDist() {
  let includes = new ssi(srcDir, distDir, '/**/*.html')
  includes.compile()
  del(distDir + '/parts', { force: true })
}

function taskCopyDist() {
  return src([
    srcDir + '/css/*.min.*',
    srcDir + '/js/*.min.*',
    srcDir + '/fonts/**/*',
    srcDir + '/img/**/*.*',
    '!' + srcDir + '/img/src/**/*'
  ], { base: srcDir })
  .pipe(dest(distDir));
}

async function taskCleanDist() {
  del(distDir + '/**/*', { force: true })
}

function taskStartwatch() {
  watch([srcDir + '/sass/*.{sass,scss}', '!' + srcDir + '/sass/app.{sass,scss}'], { usePolling: true }, taskSass);
  watch([srcDir + '/sass/app.{sass,scss}', srcDir + '/sass/_variables.{sass,scss}'], { usePolling: true }, taskSassApp);
  watch([srcDir + '/js/**/*.js', '!' + srcDir +'/js/**/*.min.js'], { usePolling: true }, taskJs);
  watch(srcDir + '/img/src/**/*', { usePolling: true }, taskImg);
  watch(srcDir + '/**/*.html', { usePolling: true }).on('change', browserSync.reload);
}

exports.dist = series(taskCleanDist, taskCopyDist, taskHtmlDist);
exports.default = series(taskSass, taskSassApp, taskJs, taskJsApp, taskImg, parallel(taskBrowsersync, taskStartwatch));