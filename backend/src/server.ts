import { buildApp } from './app.js';
import { env } from './config/env.js';
import { ContestTransitionService } from './services/contest-transition.service.js';

const start = async () => {
  try {
    const app = await buildApp();
    const port = env.PORT;
    await app.listen({ port, host: '0.0.0.0' });

    console.log(`\n🚀 Server listening atu http://localhost:${port}`);
    console.log(`📖 Swagger API Documentation at http://localhost:${port}/docs\n`);

    // Start background scheduler for due contest transitions (e.g. 3-day judging transition)
    const stopScheduler = ContestTransitionService.startScheduler();

    // Graceful Shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
        try {
          stopScheduler();
          await app.close();
          console.log('✅ Server closed cleanly.');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during graceful shutdown:', err);
          process.exit(1);
        }
      });
    }
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
};

start();
