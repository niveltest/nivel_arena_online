const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../data');
const destDir = path.join(__dirname, '../dist/server/data');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    if (fs.existsSync(srcDir)) {
        console.log(`Copying assets from ${srcDir} to ${destDir}...`);
        copyDir(srcDir, destDir);
        console.log('Assets copied successfully.');
    } else {
        console.warn(`Source directory ${srcDir} does not exist. Skipping copy.`);
    }
} catch (err) {
    console.error('Error copying assets:', err);
    process.exit(1);
}
