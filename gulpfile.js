var gulp = require('gulp');
var serve = require('gulp-serve');
var watch = require('gulp-watch');
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');
var gulpSequence = require('gulp-sequence');
var del = require('del');
var path = require('path');
var through = require('through2');
var chalk = require('chalk');
var dateFormat = require('dateformat');
var argv = require('yargs')
    .alias('p', 'port') // serve port
    .alias('v', 'verbose') // copy verbose
    .argv;
var spawn = require('child_process').spawn;

var jsSrc = [
    'bower_components/bootstrap/dist/js/bootstrap.min.js',
    'bower_components/bootstrap-treeview/dist/*.js',
    'bower_components/bootstrap-tagsinput/dist/bootstrap-tagsinput.js',
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
    'bower_components/typeahead.js/dist/typeahead.bundle.min.js',
    'bower_components/arrive/minified/arrive.min.js'
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

var debugDefaults = {
    title: 'debug',
    verbose: false
}

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function(source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

function debug(options) {
    options = extend({}, debugDefaults, options);
    var count = 0;
    //
    return through.obj(
        function transform(file, enc, cb) {
            if (options.verbose) {
                console.log(options.title, ' ', chalk.cyan(path.relative(process.cwd(), file.path)));
            }
            count++;
            cb(null, file);
        },
        function flush(cb) {
            console.log(options.title, ' ', chalk.red(count));
            cb();
        });
}

gulp.task('copy-js', function() {
    // bower repository
    return gulp.src(jsSrc)
        .pipe(debug({
            title: 'cp js  ->',
            verbose: argv.v
        }))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('copy-css', function() {
    // bower repository
    return gulp.src(cssSrc)
        .pipe(debug({
            title: 'cp css ->',
            verbose: argv.v
        }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('copy-fonts', function() {
    // bower repository
    gulp.src(fontsSrc)
        .pipe(debug({
            title: 'cp fnt ->',
            verbose: argv.v
        }))
        .pipe(gulp.dest('dist/fonts'));
});

gulp.task('copy-src', function() {
    // local source
    return gulp.src('src/**/*')
        .pipe(debug({
            title: 'cp src ->',
            verbose: argv.v
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('minify-html', function() {
    return gulp.src('src/**/*.html')
        .pipe(debug({
            title: 'min html ->',
            verbose: argv.v
        }))
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('minify-css', function() {
    return gulp.src(['src/**/*.css', '!src/**/*min*.css'])
        .pipe(debug({
            title: 'min css  ->',
            verbose: argv.v
        }))
        .pipe(sourcemaps.init())
        .pipe(cssnano())
        // passo il percorso relativo dove verrà creato il file .map 
        // altrimenti il contenuto viene scritto direttamente nel file di origine        
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('minify-js', function() {
    return gulp.src(['src/**/*.js', '!src/**/*min*.js'])
        .pipe(debug({
            title: 'ugl js   ->',
            verbose: argv.v
        }))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        // passo il percorso relativo dove verrà creato il file .map 
        // altrimenti il contenuto viene scritto direttamente nel file di origine
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
});

gulp.task('clean', function() {
    return del('dist/*').then(function(paths) {
        console.log('dist cleaned');
    });
});

gulp.task('watch', function() {
    gulp.src('src/**/*')
        .pipe(watch('src/**/*', function(vinyl) {
            console.log('[%s] %s %s', chalk.gray(dateFormat('HH:MM:ss.l')),
                chalk.magenta(vinyl.event || 'start'), chalk.cyan(path.relative(process.cwd(), vinyl.path)));
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('serve', serve({
    root: 'dist',
    port: argv.port || 3001
}));

gulp.task('server', function() {
    // avvio il web server express
    var server = spawn('node', ['app.js', '-p', argv.port || 3001], {
        stdio: [
            0, // uso stdin del parent
            'inherit' // stdout ereditato dal parent
        ],
        env: process.env
    });
    console.log(chalk.yellow('Tip:'), 'press q or quit to stop server');
    // stdin del parent
    process.stdin.on('data', function(chunk) {
        var line = (chunk && chunk.toString());
        if (/^\s*(q|quit)\s*$/.test(line)) {
            console.log('exit...');
            server && server.kill();
            process.exit();
        }
    });
});

gulp.task('copy', gulpSequence('copy-js', 'copy-css', 'copy-fonts', 'copy-src'));
gulp.task('minify', gulpSequence('minify-html', 'minify-css', 'minify-js'));
gulp.task('dev', gulpSequence('clean', 'copy', ['watch', 'server']));
gulp.task('prod', gulpSequence('clean', 'copy', 'minify'));

gulp.task('default', function() {
    console.log('');
    console.log('gulp', chalk.magenta('watch'), '                 ', chalk.gray(': watch src/'));
    console.log('gulp', chalk.magenta('server'), '', chalk.yellow('[-p <port>]'), '   ', chalk.gray(': serve dist/'));
    console.log('gulp', chalk.magenta('copy'), '  ', chalk.yellow('[-v|--verbose]'), '', chalk.gray(': copy src and bower reps into dist/'));
    console.log('gulp', chalk.magenta('minify'), '', chalk.yellow('[-v|--verbose]'), '', chalk.gray(': minify/uglify html, scripts and css'));
    console.log('gulp', chalk.magenta('clean'), '                 ', chalk.gray(': clean dist/'));
    console.log('');
    console.log('gulp', chalk.magenta('dev'), '   ', chalk.yellow('[-v|--verbose]'), '', chalk.gray(': clean, copy, watch, server'));
    console.log('gulp', chalk.magenta('prod'), '  ', chalk.yellow('[-v|--verbose]'), '', chalk.gray(': clean, copy, minify'));
    console.log('');
});
