const fs = require('fs');

function checkFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('.map(')) {
       let block = '';
       for(let j=i; j<i+10 && j<lines.length; j++) {
          block += lines[j].trim() + ' ';
       }
       const match = block.match(/\.map\([^=]*=>\s*(?:\{[^{}]*(?:return\s*)?)?\s*\(*\s*(<[a-zA-Z0-9]+[^>]*>)/);
       if (match) {
          if (!match[1].includes('key={') && !match[1].includes('key=')) {
             console.log(`Missing key in ${file}:${i+1} : ${match[1]}`);
          }
       }
    }
  }
}

checkFile('pages/TeacherDashboard.tsx');
checkFile('pages/AdminDashboard.tsx');
