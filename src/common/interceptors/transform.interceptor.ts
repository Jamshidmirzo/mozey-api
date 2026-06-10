import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps all successful responses in a standard envelope.
 * Sync endpoints and health check return raw responses — they set a custom
 * metadata flag to skip transformation.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // If the response already has our sync shape or is marked raw, pass through
        if (data && (data._raw === true || data.serverTime || data.server_time)) {
          const { _raw, ...rest } = data;
          return rest;
        }

        return {
          data,
        };
      }),
    );
  }
}
