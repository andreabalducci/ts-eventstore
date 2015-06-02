var gulp = require('gulp');
var merge = require('merge2');
var exec = require('child_process').exec;

var plugins = require('gulp-load-plugins')();

var tsProject = plugins.typescript.createProject({
    module:"commonjs",
    target:"ES5",
    declarationFiles: true,
    noExternalResolve: false,
    sortOutput:true,
    typescript: require('typescript')
});

var paths = {
    scripts: 'src/**/*.ts',
    build: 'build/',
    definitions: 'typings/'
};

gulp.task('scripts', function () {
    var tsResult = gulp
            .src(paths.scripts)
            .pipe(plugins.sourcemaps.init())
            .pipe(plugins.typescript(tsProject));

    return merge([ // Merge the two output streams, so this task is finished when the IO of both operations are done. 
        tsResult.dts
                .pipe(gulp.dest(paths.definitions)),
        tsResult.js
                .pipe(plugins.concat('app.js'))  
                .pipe(plugins.sourcemaps.write())  
                .pipe(gulp.dest(paths.build))
    ]);
});

gulp.task('watch', ['scripts'], function () {
    gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('server', ['watch'], function () {
    console.log('starting node server');
    exec('node ./server.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
});

