import app from './app';
import { connectDB } from './config/database';

const getPort = (): number => {
  const rawPort = process.env.PORT;
  if (!rawPort) {
    return 5000;
  }
  const parsedPort = Number(rawPort);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(`Invalid PORT configuration: "${rawPort}". PORT must be an integer between 1 and 65535.`);
  }
  return parsedPort;
};

const validateEnv = (): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;

  if (isProduction && (!jwtSecret || jwtSecret === 'REPLACE_WITH_A_RANDOM_SECRET' || jwtSecret === 'supersecretjwtkey_change_in_production')) {
    throw new Error('JWT_SECRET must be set to a secure, unique secret in production environment.');
  }
};

const PORT = getPort();

const startServer = async () => {
  validateEnv();
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

