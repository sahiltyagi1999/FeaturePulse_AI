import { Module, Global } from '@nestjs/common';
import { ProgressGateway } from './progress.gateway';

@Global()
@Module({
  providers: [ProgressGateway],
  exports: [ProgressGateway],
})
export class WebsocketModule {}
