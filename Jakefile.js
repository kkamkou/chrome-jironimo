// defaults
var uglify = require('uglify-js'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash');

// constants
var CONSTANTS = {
  DIR_APP: path.join(__dirname, 'src', 'app'),
  DIR_BUILD: path.join(__dirname, 'build'),
};

desc('xxx');
task('pack-application', function (params) {
  var fileSet = _readDir(CONSTANTS.DIR_APP, 'js');

  fs.writeFileSync(
    path.join(CONSTANTS.DIR_BUILD, 'app.js'),
    uglify.minify(fileSet).code
  );

  console.info('Done');
});

function _readDir(pathDir, ext) {
  var files = fs.readdirSync(pathDir),
    results = [];

  for (var idx in files) {
    var filePath = path.join(pathDir, files[idx]),
      stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = _.union(results, _readDir(filePath));
      continue;
    }

    if (!ext || (ext && filePath.match(new RegExp('/\\.' + ext + '$/')))) {
      results.push(filePath);
    }
  }

  return results;
}
