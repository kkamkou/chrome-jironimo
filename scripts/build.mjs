import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as babel from '@babel/core';
import { createEs2015LinkerPlugin } from '@angular/compiler-cli/linker/babel';
import * as csso from 'csso';
import * as esbuild from 'esbuild';
import less from 'less';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(rootDir, 'src');
const outTscDir = path.join(rootDir, '.out-tsc');
const buildDir = path.join(rootDir, 'build');
const buildAppDir = path.join(buildDir, 'app');
const version = process.env.version || '6.0.0';

const angularLinkerPlugin = {
  name: 'angular-linker',
  setup(build) {
    const linker = createEs2015LinkerPlugin({
      logger: {
        level: 1,
        debug() {},
        info() {},
        warn(msg) {
          console.warn(msg);
        },
        error(msg) {
          throw new Error(msg);
        }
      },
      fileSystem: {
        resolve: path.resolve,
        exists: fs.existsSync,
        dirname: path.dirname,
        relative: path.relative,
        readFile: filePath => fs.readFileSync(filePath, 'utf-8')
      }
    });
    build.onLoad({ filter: /node_modules\/@angular\/.*\.m?js$/ }, async args => {
      const source = await fs.promises.readFile(args.path, 'utf-8');
      if (!source.includes('ɵɵngDeclare')) {
        return { contents: source, loader: 'js' };
      }
      const transformed = await babel.transformAsync(source, {
        filename: args.path,
        plugins: [linker],
        compact: false,
        sourceMaps: false
      });
      return { contents: transformed.code, loader: 'js' };
    });
  }
};

async function run() {
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.rmSync(outTscDir, { recursive: true, force: true });
  fs.mkdirSync(buildAppDir, { recursive: true });
  fs.writeFileSync(path.join(buildDir, '.keepdir'), '');

  const ngcBin = path.join(rootDir, 'node_modules', '.bin', 'ngc');
  execFileSync(ngcBin, ['-p', path.join(rootDir, 'tsconfig.json')], { stdio: 'inherit' });

  for (const dir of ['_locales', 'icons', 'themes', 'views']) {
    fs.cpSync(path.join(srcDir, dir), path.join(buildDir, dir), {
      recursive: true,
      filter: src => !['variables.less', 'Jira.svg'].includes(path.basename(src))
    });
  }

  fs.cpSync(
    path.join(srcDir, 'vendors', 'Metro-UI-CSS', 'fonts'),
    path.join(buildDir, 'fonts'),
    { recursive: true }
  );

  const metroCss = fs.readFileSync(
    path.join(srcDir, 'vendors', 'Metro-UI-CSS', 'css', 'metro-bootstrap.css'),
    'utf-8'
  );
  fs.writeFileSync(path.join(buildAppDir, 'metro.css'), csso.minify(metroCss).css);

  const lessInput = fs.readFileSync(path.join(srcDir, 'app', 'styles.less'), 'utf-8');
  const renderedLess = await less.render(lessInput, { paths: [srcDir] });
  fs.writeFileSync(path.join(buildAppDir, 'app.css'), csso.minify(renderedLess.css).css);

  await esbuild.build({
    entryPoints: [path.join(outTscDir, 'app', 'bootstrap.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2025'],
    define: { ngDevMode: 'false', ngJitMode: 'false' },
    outfile: path.join(buildAppDir, 'app.js'),
    plugins: [angularLinkerPlugin]
  });

  await esbuild.build({
    entryPoints: [path.join(outTscDir, 'app', 'bootstrap-bg.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2025'],
    outfile: path.join(buildAppDir, 'bootstrap-bg.js')
  });

  const appJsPath = path.join(buildAppDir, 'app.js');
  fs.writeFileSync(
    appJsPath,
    fs.readFileSync(appJsPath, 'utf-8').replaceAll('##VERSION##', version)
  );

  const aboutHtmlPath = path.join(buildDir, 'views', 'options-about.html');
  fs.writeFileSync(
    aboutHtmlPath,
    fs.readFileSync(aboutHtmlPath, 'utf-8').replaceAll('##VERSION##', version)
  );

  const manifest = JSON.parse(fs.readFileSync(path.join(srcDir, 'manifest.json'), 'utf-8'));
  manifest.version = version;
  fs.writeFileSync(path.join(buildDir, 'manifest.json'), JSON.stringify(manifest));

  fs.rmSync(outTscDir, { recursive: true, force: true });
  console.log(`Done. Version: ${version}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
