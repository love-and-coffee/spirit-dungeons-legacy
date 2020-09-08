const gulp = require('gulp');
const rollup = require('rollup-stream');
const srcmaps = require('gulp-sourcemaps');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const rename = require('gulp-rename');
const livereload = require('gulp-livereload');
const util = require('gulp-util');
const terser = require('gulp-terser');

function onError(err, pipeline) {
	util.log(util.colors.red(`Error: ${err.message}`));
	util.beep();
	pipeline.emit('end');
}

module.exports = () => {
	gulp.task('build', ['build-min']);

	gulp.task('build-full', () => {
		let pipeline;
		return pipeline = rollup({
			entry: 'src/js/main.js', sourceMap: true,
		})
			.on('error', (err) => onError(err, pipeline))
			.pipe(source('main.js', './src'))
			.pipe(buffer())
			.pipe(srcmaps.init({ loadMaps: true }))
			.pipe(srcmaps.write('./'))
			.pipe(gulp.dest('./dist'))
			.pipe(livereload({}));
	});

	gulp.task('build-min', ['build-full'], () => {
		let pipeline;
		return pipeline = gulp.src('./dist/main.js')
			.pipe(terser({
				ecma: 2020,
				keep_fnames: false,
				toplevel: true,
				compress: {
					passes: 10,
					keep_fargs: false,
					pure_getters: true,
					unsafe: true,
					unsafe_arrows: true,
					unsafe_comps: true,
					unsafe_math: true,
					unsafe_methods: true,
					unsafe_symbols: true,
				},
				mangle: {
					properties: {
						keep_quoted: true,
					},
				},
			}))
			.on('error', (err) => onError(err, pipeline))
			.pipe(rename('main.min.js'))
			.pipe(gulp.dest('./dist'));
	});
};
