const fs = require('fs');

function checkFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('.map')) {
      // Look at the next few lines for the first tag
      let j = i;
      let foundTag = false;
      let text = '';
      while (j < Math.min(lines.length, i + 5)) {
        text += lines[j];
        if (text.includes('<')) {
          foundTag = true;
          break;
        }
        j++;
      }
      if (foundTag) {
        // Find the first <Tag ...> and check for key
        const match = text.match(/<[a-zA-Z0-9]+[^>]*>/);
        if (match && !match[0].includes('key={') && !match[0].includes('key=')) {
          if (!match[0].startsWith('</')) {
            console.log(`Potential missing key in ${file}:${i+1}: ${match[0]}`);
          }
        }
      }
    }
  }
}

checkFile('pages/TeacherDashboard.tsx');
checkFile('pages/AdminDashboard.tsx');
