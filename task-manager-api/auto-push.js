const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log('🚀 Git Auto-Push Watcher Started... Watching for file edits.');
console.log('========================================================');

let debounceTimeout;

// Watches files recursively and pushes changes
fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
  // Ignore temp folders, git records, environment configs, and node modules
  if (
    !filename || 
    filename.startsWith('.') || 
    filename.includes('node_modules') || 
    filename.includes('package-lock.json') ||
    filename === 'auto-push.js'
  ) {
    return;
  }

  // Debounce multiple saves (wait 2 seconds after your last keystroke/save)
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n[WATCH] File changed: ${filename}. Staging and pushing...`);
    
    exec(`git add . && git commit -m "Auto-update: ${filename} at ${timestamp}" && git push`, (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Git push failed. Verify your branch is linked to a remote GitHub repo.', err.message);
        return;
      }
      console.log('✅ Successfully pushed changes to GitHub.');
    });
  }, 2000);
});
