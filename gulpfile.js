const gulp = require("gulp");
const browserSync = require("browser-sync");
const plugins = require("gulp-load-plugins")();
const pug = require("gulp-pug");

const reload = browserSync.reload;
const source = "./src";
const dist = "./dist";

// Tâche "pug", transformer les fichiers pug en html
function pugToHtml() {
  return gulp
    .src(source + "/views/**/*.pug")
    .pipe(
      pug({
        pretty: true,
      })
    )
    .pipe(gulp.dest(dist + "/html"))
    .pipe(browserSync.stream())
    .on("error", function (error) {
      // Would like to catch the error here
      console.error(error);
      //this.emit("end");
    });
}

// Tâche "css" pour transformer les sass en css
function css() {
  return (
    gulp
      .src(source + "/scss/style.scss")
      //.pipe(plugins.sass({errLogToConsole: true}))
      .pipe(
        plugins.compass({
          config_file: "./config.rb",
          css: "dist/css",
          sass: "src",
        })
      )
      .pipe(plugins.csscomb())
      .pipe(plugins.cssbeautify({ indent: "  " }))
      .pipe(
        plugins.autoprefixer(
          "last 2 version",
          "safari 5",
          "ie 7",
          "ie 8",
          "ie 9",
          "opera 12.1",
          "ios 6",
          "android 4"
        )
      )
      .pipe(gulp.dest(dist + "/css/"))
      .pipe(plugins.size())
      .pipe(reload({ stream: true }))
      .on("error", function (error) {
        // Would like to catch the error here
        console.error(error);
        //this.emit("end");
      })
  );
}

// Tâche "copyNotRetina"
function copyNotRetina() {
  const dest = dist + "img/icons";

  return gulp
    .src(dist + "/img/@2x/*.png")
    .pipe(plugins.changed(dest))
    .pipe(
      plugins
        .imageResize({
          width: "50%",
          height: "50%",
          imageMagick: true,
        })
        .pipe(gulp.dest(dest))
    );
}

// Tâche "sprite" = spriter les icones (series avec retina)
function sprite() {
  const options = {
    optimizationLevel: 5,
    progressive: true,
    interlaced: true,
  };

  gulp
    .src(dist + "/img/icons/@2x/*.png")
    .pipe(
      plugins.spritesmith({
        imgName: "sprite@2x.png",
        cssName: "_sprite.scss",
      })
    )
    .pipe(plugins.imagemin(options))
    .pipe(gulp.dest(dist + "/img"));

  sprite = gulp.src(dist + "/img/icons/*.png").pipe(
    plugins.spritesmith({
      imgName: "sprite.png",
      cssName: "_sprite.scss",
      cssSpritesheetName: "sprite",
      cssVarMap: function (sprite) {
        sprite.spritename = sprite.image.replace(".png", "");
        return sprite;
      },
      cssTemplate: source + "helpers/_sprite.scss.mustache",
    })
  );

  sprite.img.pipe(plugins.imagemin(options)).pipe(gulp.dest(dist + "/img"));
  sprite.css.pipe(gulp.dest(source + "/helpers/"));
}

// Tâche "minify" = minification CSS (dist -> dist)
function minify(){
  return gulp
    .src(dist + "/css/*.css")
    .pipe(plugins.csso())
    .pipe(
      plugins.rename({
        suffix: ".min",
      })
    )
    .pipe(gulp.dest(dist + "/css/"));
}

//  Tâche Watch
function watch(){
  browserSync.init({
    notify: false,
    server: { baseDir: dist + '/html' },
  });

  gulp.watch(dist + "/html/*.html").on('change', reload);
  gulp.watch(dist + "/js/*.js").on('change', reload); 
  gulp.watch([source + "/scss/**/*.scss", source + "/views/**/*.pug"], build);    
}

exports.sprite = gulp.series(copyNotRetina, sprite);
exports.minify = minify;
exports.watch = watch;
exports.prod = gulp.series(css, pugToHtml, minify);
exports.build = gulp.series(css, pugToHtml);
exports.css = css;
