const fs = require('fs');
const path = require('path');

// Function to get file size in MB
function getFileSizeInMB(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size / (1024 * 1024);
}

// Function to optimize images directory
function optimizeImages() {
  const eventsDir = path.join(process.cwd(), 'public', 'images', 'events');
  
  if (!fs.existsSync(eventsDir)) {
    console.log('Events directory does not exist');
    return;
  }

  const files = fs.readdirSync(eventsDir);
  let totalSize = 0;
  const largeFiles = [];

  files.forEach(file => {
    if (file.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
      const filePath = path.join(eventsDir, file);
      const size = getFileSizeInMB(filePath);
      totalSize += size;
      
      if (size > 1) { // Files larger than 1MB
        largeFiles.push({ name: file, size: size.toFixed(2) });
      }
    }
  });

  console.log(`Total size of images: ${totalSize.toFixed(2)} MB`);
  
  if (largeFiles.length > 0) {
    console.log('\nLarge files (>1MB):');
    largeFiles.forEach(file => {
      console.log(`- ${file.name}: ${file.size} MB`);
    });
    
    console.log('\n⚠️  Warning: Large image files detected!');
    console.log('Consider compressing these images before deployment.');
    console.log('You can use tools like:');
    console.log('- https://squoosh.app/');
    console.log('- https://tinypng.com/');
    console.log('- https://imageoptim.com/');
  }
}

optimizeImages(); 