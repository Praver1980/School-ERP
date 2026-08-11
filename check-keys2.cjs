const fs = require('fs');

function checkFile(file) {
  if (!fs.existsSync(file)) return;
  const code = fs.readFileSync(file, 'utf8');
  let missing = [];
  const regex = /\.map\s*\(\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>\s*(?:\{\s*(?:return\s*)?)?(?:<([a-zA-Z0-9_]+)|\(|Fragment)/g;
  
  let match;
  while ((match = regex.exec(code)) !== null) {
     const startIdx = match.index;
     const segment = code.substring(startIdx, startIdx + 200); // look at the next 200 chars
     if (segment.includes('<')) {
         const firstTagMatch = segment.match(/<[a-zA-Z0-9_]+([^>]*?)>/);
         if (firstTagMatch) {
             const attributes = firstTagMatch[1];
             if (!attributes.includes('key={') && !attributes.includes('key=')) {
                 missing.push(segment.substring(0, 100));
             }
         }
     }
  }
  if (missing.length > 0) {
      console.log(`Missing keys in ${file}:`);
      missing.forEach(m => console.log(m.replace(/\n/g, ' ')));
  }
}

['App.tsx', 'components/Sidebar.tsx'].forEach(checkFile);
