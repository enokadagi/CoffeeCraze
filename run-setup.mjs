// Run the backend setup by importing and executing the module
import('./setup-backend-module.ts').then(() => {
  console.log('Backend setup completed!');
  process.exit(0);
}).catch((err) => {
  console.error('Error running backend setup:', err);
  process.exit(1);
});
