// @author Kanstantsin Kamkou <2ka.by>
// MIT license

// defaults
var uglify = require('uglify-js'),
  fs = require('fs'),
  path = require('path'),
  wrench = require('wrench'),
  _ = require('lodash');

// constants
var CONSTANTS = {
  DIR_APP: path.join(__dirname, 'src', 'app'),
  DIR_SRC: path.join(__dirname, 'src'),
  DIR_VENDORS: path.join(__dirname, 'src', 'vendors'),
  DIR_BUILD: path.join(__dirname, 'build'),
  DIR_BUILD_APP: path.join(__dirname, 'build', 'app'),
  DIR_BUILD_VENDORS: path.join(__dirname, 'build', 'vendors')
};

// default
desc('Default build action');
task('default', ['copy-sources', 'pack-app', 'pack-vendors'], function (params) {
  var versionNumber = process.env['version'];
  console.log('Done. Version:', versionNumber);
});

// pack-app
desc('Application scripts packing');
task('pack-app', {async: true}, function () {
  var fileSet = _readDir(CONSTANTS.DIR_APP, 'js').reverse();

  ['background.js'].forEach(function (fileName) {
    _.remove(fileSet, function (filePath) {
      return (filePath.indexOf(fileName) !== -1);
    });
  });

  fs.writeFile(
    path.join(CONSTANTS.DIR_BUILD_APP, 'app.js'),
    uglify.minify(fileSet).code,
    function () {
      console.log('Packed to "app.js":', "\n", fileSet);
      complete();
    }
  );
});

// pack-vendors
desc('Vendors scripts packing');
task('pack-vendors', {async: true}, function () {
  var fileSet = _readDir(CONSTANTS.DIR_VENDORS, 'js').sort();

  ['Metro-UI-CSS', 'less'].forEach(function (libName) {
    _.remove(fileSet, function (folderPath) {
      return (folderPath.indexOf(path.join('/', libName, '/')) !== -1);
    });
  });

  fs.writeFile(
    path.join(CONSTANTS.DIR_BUILD_VENDORS, 'vendors.js'),
    uglify.minify(fileSet).code,
    function () {
      console.log('Packed to "vendors.js":', "\n", fileSet);
      complete();
    }
  );
});

// copy distr
desc('Copying sources to the build folder');
task('copy-sources', function () {
  wrench.copyDirSyncRecursive(
    CONSTANTS.DIR_SRC, CONSTANTS.DIR_BUILD, {
      forceDelete: true,
      exclude: function (fileName, filePath) {
        return filePath.indexOf(CONSTANTS.DIR_VENDORS) !== -1
          || filePath.indexOf(CONSTANTS.DIR_APP) !== -1;
      }
    }
  );
  console.log('Copying sources to the build folder is complete');
});

// internal functions
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
