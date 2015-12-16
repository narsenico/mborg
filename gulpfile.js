var gulp = require('gulp');
var debug = require('gulp-debug');
var serve = require('gulp-serve');

gulp.task('bootstrap', function() {
    gulp.src(['bower_components/bootstrap/dist/**/*'])
        .pipe(gulp.dest('dist'))
        .pipe(debug({
            title: 'cp -> '
        }));
    gulp.src(['bower_components/bootstrap-treeview/dist/*.css'])
        .pipe(gulp.dest('dist/css'))
        .pipe(debug({
            title: 'cp -> '
        }));
    gulp.src(['bower_components/bootstrap-treeview/dist/*.js'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));
});

gulp.task('jquery', function() {
    gulp.src(['bower_components/jquery/dist/*'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));
});

gulp.task('serve', serve('dist'));
gulp.task('copy', ['bootstrap', 'jquery']);

gulp.task('default', function() {
    console.log('gulp serve');
    console.log('gulp copy');
});
