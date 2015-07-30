var gulp = require('gulp')
var babel = require('gulp-babel')

gulp.task("js", function() {
	return gulp.src("src/js/*.*")
		.pipe(babel())
		.pipe(gulp.dest("dest/js"))
})

gulp.task("lib", function() {
	gulp.src("node_modules/bootstrap/fonts/*.*")
		.pipe(gulp.dest("dest/fonts"))
	gulp.src("node_modules/react/dist/react.min.js")
		.pipe(gulp.dest("dest/js/lib"))
	gulp.src("node_modules/react-bootstrap/dist/react-bootstrap.min.js")
		.pipe(gulp.dest("dest/js/lib"))
	gulp.src("node_modules/react-cookie/dist/react-cookie.min.js")
		.pipe(gulp.dest("dest/js/lib"))

})

gulp.task("css", function() {
	// TODO less化
	return gulp.src("src/css/*.css")
		.pipe(gulp.dest("dest/css"))
})

gulp.task("html", function() {
	return gulp.src("src/*.html")
		.pipe(gulp.dest("dest"))
})

gulp.task("watch", function() {
	gulp.watch("src/js/*.*", ["js"])
	gulp.watch("src/*.html", ["html"])
})

gulp.task("all", ["js", "lib", "css", "html"]) // 並列処理される
