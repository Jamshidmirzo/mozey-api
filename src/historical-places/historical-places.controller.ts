import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { HistoricalPlacesService } from './historical-places.service';
import { HistoricalPlaceQueryDto } from './dto/historical-place-query.dto';

@ApiTags('Historical Places')
@Controller('historical-places')
export class HistoricalPlacesController {
  constructor(
    private readonly historicalPlacesService: HistoricalPlacesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List historical places',
    description:
      'Returns published historical places. Supports delta sync via ?since= parameter.',
  })
  @ApiQuery({ name: 'since', required: false, description: 'ISO 8601 timestamp for delta sync' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of historical places' })
  async findAll(@Query() query: HistoricalPlaceQueryDto) {
    return this.historicalPlacesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single historical place by ID' })
  @ApiResponse({ status: 200, description: 'Historical place details' })
  @ApiResponse({ status: 404, description: 'Historical place not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.historicalPlacesService.findOne(id);
  }
}
