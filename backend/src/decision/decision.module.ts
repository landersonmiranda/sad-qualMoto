import { Module } from '@nestjs/common';
import { DecisionController } from './decision.controller';
import { DecisionService } from './decision.service';
import { TcoService } from './tco.service';
import { TopsisService } from './topsis.service';
import { ClusteringService } from './clustering.service';
import { RegressionService } from './regression.service';
import { FipeModule } from '../fipe/fipe.module';

@Module({
  imports: [FipeModule],
  controllers: [DecisionController],
  providers: [
    DecisionService,
    TcoService,
    TopsisService,
    ClusteringService,
    RegressionService,
  ],
  exports: [DecisionService],
})
export class DecisionModule {}

