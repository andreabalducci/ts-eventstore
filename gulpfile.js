var gulp = require('gulp');
var merge = require('merge2');
var exec = require('child_process').exec;
var mainBowerFiles = require('main-bower-files');
var plugins = require('gulp-load-plugins')();
var del = require('del');

var tsProject = plugins.typescript.createProject({
    module:"amd",
    target:"ES5",
    declarationFiles: true,
    noExternalResolve: false,
    sortOutput:true,
    typescript: require('typescript')
});

var paths = {
    source : 'src/',
    scripts: 'src/**/*.ts',
    build: 'build/',
    definitions: 'typings/'
};

gulp.task('scripts', ['clean-scripts'],function () {
    var tsResult = gulp
            .src(paths.scripts)
            .pipe(plugins.sourcemaps.init())
            .pipe(plugins.typescript(tsProject));

    return merge([ // Merge the two output streams, so this task is finished when the IO of both operations are done. 
        tsResult.dts
                .pipe(gulp.dest(paths.definitions)),
        tsResult.js
   //             .pipe(plugins.concat('app.js'))  
   //             .pipe(plugins.flatten())
                .pipe(plugins.sourcemaps.write())  
                .pipe(gulp.dest(paths.build+"app"))
    ]);
});

gulp.task('clean-scripts', function(cb) {
    del(paths.build+"/**/*.js",cb);
});

gulp.task('watch', ['scripts'], function () {
    gulp.watch(paths.scripts, ['scripts']);
});

gulp.task("bower-files", function(){
   return gulp.src(mainBowerFiles(/* options */), { base: 'bower_components' })
        .pipe(plugins.flatten())
        .pipe(gulp.dest(paths.build+"libs/"));
});

gulp.task('clean-html',function(cb){
   del(paths.build+"*.html", cb); 
});

gulp.task("html", ['clean-html'],function(){
   return gulp.src(paths.source+"/index.html")
              .pipe(gulp.dest(paths.build)); 
});

gulp.task('build', ["scripts","bower-files","html"], function(){
    console.log("build done");
});

gulp.task('default', function(){
    console.log("tasks:");
    console.log("  build");
    console.log("  scripts");
    console.log("  watch");
    console.log("  server");
});

gulp.task('server', ["bower-files",'watch'], function () {
    console.log('starting node server');
    exec('node ./server.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
});

