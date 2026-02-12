// Quick script to test database connection and schema
const { execSync } = require('child_process');

console.log('🔄 Pushing schema to database...');

try {
  execSync('npx prisma db push --skip-generate', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Database schema created successfully!');
} catch (error) {
  console.error('❌ Failed to push schema:', error.message);
  process.exit(1);
}
