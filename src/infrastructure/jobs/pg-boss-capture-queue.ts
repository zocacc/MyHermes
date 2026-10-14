import type { Job, PgBoss } from "pg-boss";

import type { CaptureJobQueue } from "../../application/ports.js";
import type { CaptureJob } from "../../domain/model.js";

const captureQueueName = "interpret-text-capture";

export class PgBossCaptureQueue implements CaptureJobQueue {
  constructor(private readonly boss: PgBoss) {}

  async start(handler: (job: CaptureJob) => Promise<void>): Promise<void> {
    await this.boss.createQueue(captureQueueName, {
      retryLimit: 3,
      retryDelay: 2,
      retryBackoff: true
    });
    await this.boss.work<CaptureJob>(captureQueueName, async (jobs: Job<CaptureJob>[]) => {
      for (const job of jobs) {
        await handler(job.data);
      }
    });
  }

  async enqueue(job: CaptureJob): Promise<void> {
    const jobId = await this.boss.send(captureQueueName, job, {
      singletonKey: job.captureId
    });
    if (!jobId) {
      throw new Error(`Capture job was not queued: ${job.captureId}`);
    }
  }
}
