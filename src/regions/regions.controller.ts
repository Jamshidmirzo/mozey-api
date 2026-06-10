import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { RegionQueryDto } from './dto/region-query.dto';

@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all regions',
    description: 'Returns all active regions ordered by display order.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'List of regions' })
  async findAll(@Query() query: RegionQueryDto) {
    return this.regionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single region by ID' })
  @ApiResponse({ status: 200, description: 'Region details' })
  @ApiResponse({ status: 404, description: 'Region not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.regionsService.findOne(id);
  }
}
