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
    gulp.src(['bower_components/bootstrap-tagsinput/dist/bootstrap-tagsinput.min.js*'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));
    gulp.src(['bower_components/bootstrap-tagsinput/dist/bootstrap-tagsinput.css',
    	'bower_components/bootstrap-tagsinput/dist/bootstrap-tagsinput-typeahead.css'])
        .pipe(gulp.dest('dist/css'))
        .pipe(debug({
            title: 'cp -> '
        }));
    gulp.src(['bower_components/bootstrap-material-design/dist/js/*'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));        
    gulp.src(['bower_components/bootstrap-material-design/dist/css/*'])
        .pipe(gulp.dest('dist/css'))
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

gulp.task('underscore', function() {
    gulp.src(['bower_components/underscore/underscore*'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));
});

gulp.task('jquery-bar-rating', function() {
    gulp.src(['bower_components/jquery-bar-rating/dist/*'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));
    gulp.src(['bower_components/jquery-bar-rating/dist/themes/bootstrap-stars.css'])
        .pipe(gulp.dest('dist/css'))
        .pipe(debug({
            title: 'cp -> '
        }));
});

gulp.task('rxjs', function() {
    gulp.src(['bower_components/rxjs/dist/rx.lite.min.js',
        'bower_components/rxjs/dist/rx.lite.js',
        'bower_components/rxjs/dist/rx.lite.map'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));
});

gulp.task('toastr', function() {
    gulp.src(['bower_components/toastr/toastr.min.js',
        'bower_components/toastr/toastr.js.map'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));
    gulp.src(['bower_components/toastr/toastr.min.css'])
        .pipe(gulp.dest('dist/css'))
        .pipe(debug({
            title: 'cp -> '
        }));        
});

gulp.task('typeahead.js', function() {
    gulp.src(['bower_components/typeahead.js/dist/typeahead.bundle.min.js'])
        .pipe(gulp.dest('dist/js'))
        .pipe(debug({
            title: 'cp -> '
        }));
});

gulp.task('serve', serve({
    root: 'dist',
    port: 3001
}));
gulp.task('copy', ['bootstrap', 'jquery', 'underscore', 'jquery-bar-rating', 'rxjs', 'toastr', 'typeahead.js']);

gulp.task('default', function() {
    console.log('gulp serve');
    console.log('gulp copy');
});
