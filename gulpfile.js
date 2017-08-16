var gulp = require('gulp');
var $ = require('gulp-load-plugins')(); //讓屬於gulp套件不需要重新requrie但需加入$.符號
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist')
var gulpSequence = require('gulp-sequence')

var envOptions = { /*參數 */
    string:'env',
    default:{env:'develop'}/*預設參數為:develop*/
}
var options = minimist(process.argv.slice(2),envOptions)
/*參數下法: '指令' --env production */


/* var jade = require('gulp-jade');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss'); */

gulp.task('clean', function () {/*刪除資料夾 */
    return gulp.src(['./.tmp','./public'], {read: false})
        .pipe($.clean());
});


//gulp.task('copyHTML', function() {
    //return gulp.src('./source/**/*.html')
        //.pipe(gulp.dest('./public'))
//})

gulp.task('pug', function() {
    //var YOUR_LOCALS = {};

    gulp.src('./source/**/*.pug')
        .pipe($.plumber())
        .pipe($.pug({
            //locals: YOUR_LOCALS
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream()); //編譯完後自動更新
});

gulp.task('sass', function() {
    var plugins = [
        autoprefixer({ browsers: ['last 2 version', '>5%'] }), //自動替CSS下前綴詞

    ];

    return gulp.src('./source/scss/**/*.sass')
        .pipe($.plumber()) //不因編譯錯誤而停止
        .pipe($.sourcemaps.init()) //撰寫css位置
        .pipe($.sass().on('error', $.sass.logError)) //編譯
        .pipe($.postcss(plugins)) //補上前綴詞
        .pipe($.if(options.env ==='production',$.cleanCss()))/*如果參數為production就執行壓縮 */
        .pipe($.sourcemaps.write('.')) //撰寫css位置
        .pipe(gulp.dest('./public/css')) //輸出在public底下的CSS資料夾
        .pipe(browserSync.stream()); //編譯完後自動更新
});

gulp.task('babel', () => { //編譯ES6語法
    return gulp.src('./source/js/**/*.js') //來源:source的js資料夾底下的所有js檔案
        .pipe($.sourcemaps.init()) //撰寫js位置
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe($.concat('all.js')) //組合成同一支CSS
        .pipe($.if(options.env ==='production',$.uglify({/*如果參數為production就執行壓縮 */
            compress:{
                drop_console:true
            }
        })))
        .pipe($.sourcemaps.write('.')) //撰寫js位置
        .pipe(gulp.dest('./public/js')) //輸出資料夾
        .pipe(browserSync.stream()); //編譯完後自動更新
});
/*bower下載後請先執行 gulp bower*/
gulp.task('bower', function() { //與libary管理工具bower串接 
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('./.tmp/vendors')) //抓取libary中的檔案輸出
});
/*bower下載後請先執行 gulp bower*/
gulp.task('vendorJS', ['bower'], function() {
    return gulp.src('./.tmp/vendors/**/*.js') //來源
        .pipe($.concat('vendors.js')) //合併
        .pipe($.if(options.env ==='production',$.uglify()))/*如果參數為production就執行壓縮 */
        .pipe(gulp.dest('./public/js')) //輸出
})
gulp.task('vendorCSS', ['bower'], function() {
    return gulp.src('./.tmp/vendors/**/*.css') //來源
        .pipe($.concat('vendors.css')) //合併
        .pipe($.if(options.env ==='production',$.uglify()))/*如果參數為production就執行壓縮 */
        .pipe(gulp.dest('./public/css')) //輸出
})

gulp.task('browser-sync', function() { //伺服器
    browserSync.init({
        server: {
            baseDir: "./public" //選取輸出資料夾
        }
    });
});

gulp.task('image-min', () =>/*圖片壓縮 */
    gulp.src('./source/images/*')//來源資料夾
        .pipe($.if(options.env ==='production',$.imagemin()))//執行
        .pipe(gulp.dest('./public/images'))
);



gulp.task('watch', function() {
    gulp.watch('./source/scss/**/*.sass', ['sass']);
    gulp.watch('./source/**/*.pug', ['pug']);
    gulp.watch('./source/js/**/*.js', ['babel']);
});

gulp.task('build', gulpSequence('clean','pug','sass','babel','vendorJS','image-min'))
/*gulp build --env production */
/*用來交付產品 */


gulp.task('default', ['pug', 'sass', 'babel', 'vendorJS', 'browser-sync','image-min', 'watch']);