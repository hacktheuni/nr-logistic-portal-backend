import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ApiError } from '@/utils/ApiError';
import { apiRouter } from '@/routes';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1', apiRouter);

// Global error handler
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        statusCode: err.statusCode,
        message: err.message,
        errors: err.errors,
        success: err.success,
      });
    }

    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      errors: [String(err)],
      success: false,
    });
  },
);

export { app };


