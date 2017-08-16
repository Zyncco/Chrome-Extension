import gulp from 'gulp'
import gulpif from 'gulp-if'
import { log, colors } from 'gulp-util'
import named from 'vinyl-named'
import webpack from 'webpack'
import gulpWebpack from 'webpack-stream'
import plumber from 'gulp-plumber'
import livereload from 'gulp-livereload'
import args from './lib/args'
import UglifyJSPlugin from 'uglifyjs-webpack-plugin';

const ENV = args.production ? 'production' : 'development'

gulp.task('scripts', (cb) => {
  return gulp.src(['app/scripts/*.js', 'app/scripts/**/*.js'])
    .pipe(plumber({
      errorHandler () {
        // Webpack will log the errors
      }
    }))
    .pipe(named())
    .pipe(gulpWebpack({
      devtool: args.sourcemaps ? 'inline-source-map' : false,
      watch: args.watch,
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify(ENV)
          },
          '__ENV__': JSON.stringify(ENV),
          '__VENDOR__': JSON.stringify(args.vendor)
        })
      ].concat(args.production ? [
        new UglifyJSPlugin()
      ] : []),
      module: {
        rules: [{
          test: /\.js$/,
          loader: 'eslint-loader',
          exclude: /node_modules/,
          enforce: 'pre'
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          enforce: 'post',
          query: {
            presets: ["es2015"]
          }
        }]
      }
    },
    webpack,
    (err, stats) => {
      if (err) return
      log(`Finished '${colors.cyan('scripts')}'`, stats.toString({
        chunks: false,
        colors: true,
        cached: false,
        children: false
      }))
    }))
    .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(gulpif(args.watch, livereload()))
})
