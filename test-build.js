// Quick TypeScript check
const { exec } = require('child_process');

console.log('Running TypeScript check...');
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  if (error) {
    console.error('TypeScript errors found:');
    console.error(stderr);
    process.exit(1);
  }
  console.log('✅ No TypeScript errors');
  console.log('Checking for dashboard-cards-showcase specifically...');
  exec('npx tsc --noEmit 2>&1 | grep dashboard-cards-showcase || echo "✅ No errors in dashboard-cards-showcase"', (err, out) => {
    console.log(out);
  });
});
