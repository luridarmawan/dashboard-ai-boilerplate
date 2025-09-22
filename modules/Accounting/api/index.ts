
import { Express } from 'express';
import expensesRoute from './routes/expenses'
import webhookRoute from './routes/webhook'

export const init = (app: Express) => {
  console.log('    Initializing accounting module with app instance');

  app.use(`${process.env.VITE_API_PREFIX}/accounting/expense`, expensesRoute);
  app.use(`${process.env.VITE_API_PREFIX}/webhook/accounting`, webhookRoute);
}
