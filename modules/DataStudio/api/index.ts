
import { Express } from 'express';
import testRoutes from './routes/test'
import explorerRoute from './routes/explorer'
import ocrRoute from './routes/ocr'

export const init = (app: Express) => {
  console.log('    Initializing data studio module with app instance');

  app.use(`${process.env.VITE_API_PREFIX}/explorer/test`, testRoutes); // Public endpoint
  app.use(`${process.env.VITE_API_PREFIX}/explorer`, explorerRoute); // Public endpoint
  app.use(`${process.env.VITE_API_PREFIX}/ocr`, ocrRoute); // Public endpoint
}
