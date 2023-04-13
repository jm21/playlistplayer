let  gulp 			= require('gulp');
let sass 			= require('gulp-sass')(require('sass'));
let concat          = require('gulp-concat');
let uglify 			= require('uglify-js')
let cleanCSS        = require('gulp-clean-css');
let plumber 		= require('gulp-plumber');
let browserSync 	= require('browser-sync');

function style() {
    return gulp.src('scss/styles.scss') // Gets all files ending with .scss in app/scss and children dirs
        .pipe(sass())
        .pipe(concat('style.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest('../css/'))
        .pipe(browserSync.stream());
}
exports.style = style;

function watch(){
    browserSync.init({
        server: {
           baseDir: './'
        }
     });
     gulp.watch('./scss/**/*.scss', style);
     gulp.watch('./*.html').on('change', browserSync.reload);
}

exports.watch = watch;