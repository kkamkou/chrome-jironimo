// @author Kanstantsin Kamkou <2ka.by>
// MIT license

/* eslint-env node, mocha */
/* global desc, task, complete */

'use strict';

var uglify = require('uglify-js-harmony'),
  fs = require('fs'),
  path = require('path'),
  wrench = require('wrench'),
  _ = require('lodash'),
  less = require('less'),
  csso = require('csso'),
  os = require('os');

// constants
var CONSTANTS = {
  DIR_APP: path.join(__dirname, 'src', 'app'),
  DIR_SRC: path.join(__dirname, 'src'),
  DIR_VENDORS: path.join(__dirname, 'src', 'vendors'),
  DIR_BUILD: path.join(__dirname, 'build'),
  DIR_BUILD_APP: path.join(__dirname, 'build', 'app')
};

// internal functions
function manifestRead() {
  return require(path.join(CONSTANTS.DIR_BUILD, 'manifest.json'));
}

function manifestUpdate(data) {
  console.log('- updating the "manifest.json" file');
  return fs.writeFileSync(
    path.join(CONSTANTS.DIR_BUILD, 'manifest.json'),
    JSON.stringify(data)
  );
}

function readDir(pathDir, ext) {
  var files = fs.readdirSync(pathDir),
    results = [];

  for (var idx in files) {
    var filePath = path.join(pathDir, files[idx]),
      stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = _.union(results, readDir(filePath, ext));
      continue;
    }

    if (!ext || (ext && filePath.match(new RegExp('\\.' + ext + '$')))) {
      results.push(filePath);
    }
  }

  return results;
}

function minify (fileSet) {
  let output = '';
  fileSet.forEach(f => {
    output += ~f.indexOf('/vendors/')
      ? fs.readFileSync(f)
      : uglify.minify(f, {mangle: false}).code;
    output += os.EOL;
  });
  return output;
}

// default
desc('Default build action');
task('default', ['cleanup-pre', 'layout-modify', 'cleanup-post'], function () {
  console.log('Done. Version:', process.env.version);
});

// pack-app
desc('Application scripts packing');
task('pack-app', ['copy-sources'], {async: true}, function () {
  var files = [];

  ['shared', 'lib', 'bootstrap.js', 'controllers'].forEach(function (p) {
    if (p.indexOf('.js') !== -1) {
      files.push(path.join(CONSTANTS.DIR_APP, p));
      return;
    }
    files = files.concat(readDir(path.join(CONSTANTS.DIR_APP, p), 'js').reverse());
  });

  fs.writeFile(
    path.join(CONSTANTS.DIR_BUILD_APP, 'app.js'),
    uglify.minify(files, {mangle: false}).code,
    function () {
      console.log('- Packed to "app.js":', os.EOL, files);
      complete();
    }
  );
});

// pack-vendors
desc('Vendors scripts packing');
task('pack-vendors', ['copy-sources'], {async: true}, function () {
  var templatePath = path.join(CONSTANTS.DIR_BUILD, 'views', 'default.html'),
    body = fs.readFileSync(templatePath, {encoding: 'utf-8'}),
    regex = new RegExp('<script.*src="(.+?)"><\/script>', 'g'),
    fileSet = [],
    match;

  while ((match = regex.exec(body)) !== null) {
    if (!~match[1].indexOf('less/')) {
      fileSet.push(path.join(CONSTANTS.DIR_SRC, match[1]));
    }
  }

  fs.writeFile(
    path.join(CONSTANTS.DIR_BUILD_APP, 'vendors.js'), minify(fileSet), () => {
      console.log('- Packed to "vendors.js":', os.EOL, fileSet);
      complete();
    }
  );
});

// pack-css
desc('Application styles packing');
task('pack-css', ['copy-sources'], {async: true}, function () {
  less.render(
    fs.readFileSync(path.join(CONSTANTS.DIR_APP, 'styles.less'), {encoding: 'utf-8'}),
    {paths: [CONSTANTS.DIR_SRC]}
  ).then(function (output) {
    fs.writeFileSync(
      path.join(CONSTANTS.DIR_BUILD_APP, 'app.css'),
      csso.minify(output.css).css
    );
    console.log('- Styles were packed');
    complete();
  });
});

// copy-sources
desc('Copies sources to the build folder');
task('copy-sources', function () {
  wrench.copyDirSyncRecursive(
    CONSTANTS.DIR_SRC, CONSTANTS.DIR_BUILD, {
      forceDelete: true,
      exclude: function (fileName, filePath) {
        return fileName === 'variables.less'
          || filePath.indexOf(CONSTANTS.DIR_VENDORS) !== -1
          || filePath.indexOf(CONSTANTS.DIR_APP) !== -1;
      }
    }
  );
  console.log('- Sources were copied to the build folder');
});

// copy-metro
desc('Copying Metro-UI-CSS styles to the build folder');
task('copy-metro', ['copy-sources'], function () {
  var pathMetroCssOut = path.join(CONSTANTS.DIR_BUILD_APP, 'metro.css'),
    pathMetroCssIn = path.join(
      CONSTANTS.DIR_VENDORS, 'Metro-UI-CSS', 'css', 'metro-bootstrap.css'
    );

  fs.writeFileSync(
    pathMetroCssOut,
    csso.minify(fs.readFileSync(pathMetroCssIn, {encoding: 'utf-8'})).css
  );

  console.log('- Metro styles were copied');

  wrench.copyDirSyncRecursive(
    path.join(CONSTANTS.DIR_VENDORS, 'Metro-UI-CSS', 'fonts'),
    path.join(CONSTANTS.DIR_BUILD, 'fonts')
  );

  console.log('- Metro fonts were copied');
});

// copy-bootstrap-bg
desc('Copying bootstrap-bg.js to the build folder');
task('copy-bootstrap-bg', ['copy-sources'], {async: true}, function () {
  var manifest = manifestRead(),
    fileSet = [];

  manifest.background.scripts.forEach(function (p) {
    fileSet.push(CONSTANTS.DIR_SRC + p);
  });

  fs.writeFile(
    path.join(CONSTANTS.DIR_BUILD_APP, 'bootstrap-bg.js'), minify(fileSet), function () {
      console.log('- Packed to "bootstrap-bg.js":', os.EOL, fileSet);
      manifest.background.scripts = ['app/bootstrap-bg.js'];
      manifestUpdate(manifest);
      complete();
    }
  );
});

// cleanup-pre
desc('Pre cleanup process');
task('cleanup-pre', function () {
  wrench.rmdirSyncRecursive(CONSTANTS.DIR_BUILD);
  console.log('- "build" folder has been removed');
});

// cleanup-post
desc('Post cleanup process');
task('cleanup-post', {async: true}, function () {
  fs.rmdir(path.join(CONSTANTS.DIR_BUILD, 'vendors'), function (err) {
    if (err) { throw err; }
    console.log('- "vendors" folder has been removed');
    complete();
  });
});


// layout-modify
desc('Replaces headers in the dafault layout');
task(
  'layout-modify',
  ['copy-sources', 'pack-app', 'pack-vendors', 'pack-css', 'copy-metro',
  'copy-bootstrap-bg', 'version-number'],
  function () {
    var templatePath = path.join(CONSTANTS.DIR_BUILD, 'views', 'default.html'),
      body = fs.readFileSync(templatePath, {encoding: 'utf-8'});

    body = body.replace(
      /<!-- styles -->([^_]+?)<!-- \/styles -->/gm,
      '<link rel="stylesheet" type="text/css" href="/app/metro.css">' +
      '<link rel="stylesheet" type="text/css" href="/app/app.css">'
    );

    body = body.replace(
      /<!-- scripts -->([^_]+?)<!-- \/scripts -->/gm,
      '<script type="text/javascript" src="/app/vendors.js"></script>' +
      '<script type="text/javascript" src="/app/app.js"></script>'
    );

    fs.writeFileSync(templatePath, body);
    console.log('- "default.html" has been updated');
  }
);

// version-number
desc('Adds a version number to the about template');
task('version-number', ['copy-sources'], function () {
  var templatePath = path.join(CONSTANTS.DIR_BUILD, 'views', 'options-about.html');

  fs.writeFileSync(
    templatePath, fs.readFileSync(templatePath, {encoding: 'utf-8'})
      .replace('##VERSION##', process.env.version)
  );

  console.log('- "options-about.html" has been changed');

  var manifest = manifestRead();
  manifest.version = process.env.version || '0.0';

  manifestUpdate(manifest);
});
