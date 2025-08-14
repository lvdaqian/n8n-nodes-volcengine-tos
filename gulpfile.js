const path = require('path');
const { task, src, dest } = require('gulp');
const { parallel } = require('gulp');

function copyNodeIcons() {
    const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
    const nodeDestination = path.resolve('dist', 'nodes');
    return src(nodeSource, { encoding: false }).pipe(dest(nodeDestination));
}

function copyCredIcons() {
    const credSource = path.resolve('credentials', '**', '*.{png,svg}');
    const credDestination = path.resolve('dist', 'credentials');
    return src(credSource, { encoding: false }).pipe(dest(credDestination));
}

task('build:icons', parallel(copyNodeIcons, copyCredIcons));
