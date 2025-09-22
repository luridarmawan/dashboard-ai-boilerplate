
import { Express } from 'express';
import testRoutes from './routes/test'
import exampleRoute from './routes/example'

export const init = (app: Express) => {
  console.log('    Initializing example module with app instance');

  app.use(`${process.env.VITE_API_PREFIX}/example/test`, testRoutes); // Public endpoint
  app.use(`${process.env.VITE_API_PREFIX}/example`, exampleRoute); // Public endpoint

}
