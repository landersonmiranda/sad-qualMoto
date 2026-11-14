import { Module } from '@nestjs/common';
import { FipeService } from './fipe.service';
import { FipeController } from './fipe.controller';

@Module({
  controllers: [FipeController],
  providers: [FipeService],
  exports: [FipeService],
})
export class FipeModule {}

