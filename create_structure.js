const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\nilel\\project\\sudan\\CoffeeCraze.worktrees\\agents-coffee-craze-production-system-setup';

const directories = [
    'src\\config',
    'src\\api\\middleware',
    'src\\api\\routes',
    'src\\api\\services',
    'src\\api\\utils',
    'scripts'
];

// Create directories
directories.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created: ${dir}`);
    }
});

// Create .gitkeep files
directories.forEach(dir => {
    const gitkeepPath = path.join(baseDir, dir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '', 'utf8');
        console.log(`Created: ${dir}/.gitkeep`);
    }
});

console.log('\nSUCCESS');
