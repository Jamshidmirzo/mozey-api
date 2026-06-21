import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.logger.log('Firebase already initialized');
      return;
    }

    const saPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      join(process.cwd(), 'firebase-service-account.json');

    if (existsSync(saPath)) {
      try {
        const sa = JSON.parse(readFileSync(saPath, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(sa) });
        this.logger.log('Firebase initialized from service account file');
        return;
      } catch (e) {
        this.logger.error(`Failed to parse service account file: ${e}`);
      }
    }

    const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (saEnv) {
      try {
        const sa = JSON.parse(Buffer.from(saEnv, 'base64').toString('utf8'));
        admin.initializeApp({ credential: admin.credential.cert(sa) });
        this.logger.log('Firebase initialized from env variable');
        return;
      } catch (e) {
        this.logger.error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${e}`);
      }
    }

    this.logger.warn(
      'Firebase service account not found. Push notifications will be disabled.',
    );
  }

  get isInitialized(): boolean {
    return admin.apps.length > 0;
  }

  async sendToDevice(
    token: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    if (!this.isInitialized) return false;
    try {
      await admin.messaging().send({ token, notification: { title, body } });
      return true;
    } catch (error: any) {
      if (
        error?.code === 'messaging/registration-token-not-registered' ||
        error?.code === 'messaging/invalid-registration-token'
      ) {
        this.logger.warn(`Invalid FCM token: ${token.substring(0, 20)}...`);
        return false;
      }
      this.logger.error(`FCM send error: ${error?.message || error}`);
      return false;
    }
  }

  async sendToDevices(
    tokens: string[],
    title: string,
    body: string,
  ): Promise<{
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
  }> {
    if (!this.isInitialized || tokens.length === 0) {
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];
    const batchSize = 500;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const message: admin.messaging.MulticastMessage = {
        tokens: batch,
        notification: { title, body },
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;

        response.responses.forEach((resp, idx) => {
          if (
            !resp.success &&
            (resp.error?.code ===
              'messaging/registration-token-not-registered' ||
              resp.error?.code === 'messaging/invalid-registration-token')
          ) {
            invalidTokens.push(batch[idx]);
          }
        });
      } catch (error: any) {
        this.logger.error(`Batch send error: ${error?.message || error}`);
        failureCount += batch.length;
      }
    }

    return { successCount, failureCount, invalidTokens };
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    if (!this.isInitialized) return false;
    try {
      await admin.messaging().send({ topic, notification: { title, body } });
      return true;
    } catch (error: any) {
      this.logger.error(`Topic send error: ${error?.message || error}`);
      return false;
    }
  }
}
