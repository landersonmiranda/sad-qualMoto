import { Controller, Get, Param } from '@nestjs/common';
import { FipeService } from './fipe.service';

@Controller('api/fipe')
export class FipeController {
  constructor(private readonly fipeService: FipeService) {}

  @Get('brands')
  async getBrands() {
    return this.fipeService.getBrands();
  }

  @Get('price/:code')
  async getPriceByCode(@Param('code') code: string) {
    return this.fipeService.getPriceByCode(code);
  }
}

