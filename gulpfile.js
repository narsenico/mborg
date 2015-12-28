var gulp = require('gulp');
var debug = require('gulp-debug');
var serve = require('gulp-serve');
var watch = require('gulp-watch');

var jsSrc = [
    'bower_components/bootstrap/dist/js/bootstrap.min.js',
    'bower_components/bootstrap-treeview/dist/*.js',
    'bower_components/bootstrap-tagsinput/dist/bootstrap-tagsinput.min.js*',
    'bower_components/bootstrap-material-design/dist/js/*',
    'bower_components/jquery/dist/*',
    'bower_components/underscore/underscore*',
    'bower_components/jquery-bar-rating/dist/*',
    'bower_components/rxjs/dist/rx.lite.min.js',
    'bower_components/rxjs/dist/rx.lite.js',
    'bower_components/rxjs/dist/rx.lite.map',
    'bower_components/toastr/toastr.min.js',
    'bower_components/toastr/toastr.js.map',
    'bower_components/typeahead.js/dist/typeahead.bundle.min.js'
];

var cssSrc = [
    'bower_components/bootstrap/dist/css/*',
    'bower_components/bootstrap-treeview/dist/*.css',
    'bower_components/bootstrap-tagsinput/dist/bootstrap-tagsinput.css',
    'bower_components/bootstrap-tagsinput/dist/bootstrap-tagsinput-typeahead.css',
    'bower_components/bootstrap-material-design/dist/css/*',
    'bower_components/jquery-bar-rating/dist/themes/bootstrap-stars.css',
    'bower_components/toastr/toastr.min.css'
];

var fontsSrc = [
    'bower_components/bootstrap/dist/fonts/*'
];

gulp.task('copy', function() {
    gulp.src(jsSrc)
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'js  cp -> '
        }));
    gulp.src(cssSrc)
        .pipe(gulp.dest('dist/css'))
        .pipe(debug({
            title: 'css cp -> '
        }));
    gulp.src(fontsSrc)
        .pipe(gulp.dest('dist/fonts'))
        .pipe(debug({
            title: 'fnt cp -> '
        }));
    gulp.src('src/**/*')
        .pipe(gulp.dest('dist'))
        .pipe(debug({
            title: 'src cp -> '
        }));
});

gulp.task('watch', function() {
    gulp.src('src/**/*')
        .pipe(watch('src/**/*', function(vinyl) {
            console.log('%s (%s)', vinyl.path, vinyl.event || 'start');
            }))
        .pipe(gulp.dest('dist'));
});

gulp.task('serve', ['watch'], serve({
    root: 'dist',
    port: 3001
}));

gulp.task('default', function() {
    console.log('gulp serve');
    console.log('gulp copy');
});
