import { sleep } from './sleep';
import { logger } from './logger';

export async function wait(label: string, seconds = 0): Promise<void> {
  if (seconds > 0) {
    logger.info(`waiting for ${label}...`);

    for (let i = 1; i <= seconds; i++) {
      await sleep(1);

      logger.logPercents(Math.round((i * 100) / seconds));
    }
  }
}
