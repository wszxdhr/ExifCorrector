#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 定义源目录和目标目录
const srcLocalesDir = path.resolve(__dirname, '../src/locales');
const distLocalesDir = path.resolve(__dirname, '../dist/locales');

console.log('Copying locales from', srcLocalesDir, 'to', distLocalesDir);

// 确保目标目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 复制文件
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
}

// 递归复制目录
function copyDir(srcDir, destDir) {
  ensureDir(destDir);
  
  const items = fs.readdirSync(srcDir);
  
  items.forEach(item => {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (stat.isFile()) {
      copyFile(srcPath, destPath);
    }
  });
}

try {
  // 复制 locales 目录
  if (fs.existsSync(srcLocalesDir)) {
    copyDir(srcLocalesDir, distLocalesDir);
    console.log('Locales copied successfully!');
  } else {
    console.log('Source locales directory does not exist, skipping...');
  }
} catch (error) {
  console.error('Error copying locales:', error);
  process.exit(1);
}