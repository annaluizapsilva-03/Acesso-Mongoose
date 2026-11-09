import 'dotenv/config';
import app from './app.js';
import { conectarBanco } from './config/database.js';

try {
  await conectarBanco();
  const porta = Number(process.env.PORT) || 3000;
  app.listen(porta, () => console.log(`API em http://localhost:${porta}`));
} catch (e) {
  console.error('Falha ao iniciar:', e.message);
  process.exit(1);
}
