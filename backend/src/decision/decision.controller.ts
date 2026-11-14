import { Controller, Post, Body, Get } from '@nestjs/common';
import { DecisionService } from './decision.service';
import { FipeService } from '../fipe/fipe.service';
import { UserUsageProfile, CriteriaWeights, Vehicle, SimulationResponse } from '../common/types';

export class SimulateDto {
  profile: UserUsageProfile;
  weights: CriteriaWeights;
  vehicles?: Vehicle[];
}

@Controller('api/decision')
export class DecisionController {
  constructor(
    private readonly decisionService: DecisionService,
    private readonly fipeService: FipeService,
  ) {}

  @Get('vehicles')
  async getVehicles(): Promise<Vehicle[]> {
    return this.fipeService.getAllVehicles();
  }

  @Post('simulate')
  async simulate(@Body() body: SimulateDto): Promise<SimulationResponse> {
    return this.decisionService.simulate(body.profile, body.weights, body.vehicles);
  }
}

