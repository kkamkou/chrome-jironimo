// defaults
var uglify = require('uglify-js'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash');

// constants
var CONSTANTS = {
  DIR_APP: path.join(__dirname, 'src', 'app'),
  DIR_BUILD: path.join(__dirname, 'build'),
  DIR_VENDORS: path.join(__dirname, 'src', 'vendors')
};

desc('xxx');
task('default', ['pack-app', 'pack-vendors'], function (params) {
  var versionNumber = process.env['version'];
  console.log('Done. Version:', versionNumber);
});

desc('xxx');
task('pack-app', {async: true}, function () {
  var fileSet = _readDir(CONSTANTS.DIR_APP, 'js').reverse();

  ['background.js'].forEach(function (fileName) {
    _.remove(fileSet, function (filePath) {
      return (filePath.indexOf(fileName) !== -1);
    });
  });

  fs.writeFile(
    path.join(CONSTANTS.DIR_BUILD, 'app.js'),
    uglify.minify(fileSet).code,
    function () {
      console.log('Packed to "app.js":', "\n", fileSet);
      complete();
    }
  );
});

desc('xxx');
task('pack-vendors', {async: true}, function () {
  var fileSet = _readDir(CONSTANTS.DIR_VENDORS, 'js').sort();

  ['Metro-UI-CSS', 'less'].forEach(function (libName) {
    _.remove(fileSet, function (folderPath) {
      return (folderPath.indexOf(path.join('/', libName, '/')) !== -1);
    });
  });

  fs.writeFile(
    path.join(CONSTANTS.DIR_BUILD, 'vendors.js'),
    uglify.minify(fileSet).code,
    function () {
      console.log('Packed to "vendors.js":', "\n", fileSet);
      complete();
    }
  );
});

function _readDir(pathDir, ext) {
  var files = fs.readdirSync(pathDir),
    results = [];

  for (var idx in files) {
    var filePath = path.join(pathDir, files[idx]),
      stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = _.union(results, _readDir(filePath, ext));
      continue;
    }

    if (!ext || (ext && filePath.match(new RegExp('\\.' + ext + '$')))) {
      results.push(filePath);
    }
  }

  return results;
}
