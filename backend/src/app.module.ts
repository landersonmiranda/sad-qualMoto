import { Module } from '@nestjs/common';
import { FipeModule } from './fipe/fipe.module';
import { DecisionModule } from './decision/decision.module';

@Module({
  imports: [FipeModule, DecisionModule],
})
export class AppModule {}

