import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();

const directories = [
  'src/config',
  'src/api/middleware',
  'src/api/routes',
  'src/api/services',
  'src/utils',
  'scripts'
];

const files = [
  'src/config/constants.ts',
  'src/config/schemas.ts',
  'src/config/types.ts',
  'src/api/middleware/validation.ts',
  'src/api/middleware/auth.ts',
  'src/api/middleware/errorHandler.ts',
  'src/api/middleware/cors.ts',
  'src/api/routes/products.ts',
  'src/api/routes/orders.ts',
  'src/api/routes/subscriptions.ts',
  'src/api/routes/admin.ts',
  'src/api/routes/inventory.ts',
  'src/api/services/productService.ts',
  'src/api/services/orderService.ts',
  'src/api/services/subscriptionService.ts',
  'src/api/services/emailService.ts',
  'src/utils/validators.ts',
  'src/utils/priceConverter.ts',
  'src/utils/emailTemplates.ts',
  'src/utils/errorFormatter.ts',
  'scripts/generateProducts.ts'
];

// Create directories
directories.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

// Create placeholder files
files.forEach(file => {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, `// Placeholder for ${file}\n`, 'utf8');
    console.log(`✓ Created file: ${file}`);
  } else {
    console.log(`⊘ File exists: ${file}`);
  }
});

console.log('\n✓ SUCCESS\n');
