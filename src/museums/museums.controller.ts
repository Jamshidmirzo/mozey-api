import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MuseumsService } from './museums.service';
import { MuseumQueryDto } from './dto/museum-query.dto';

@ApiTags('Museums')
@Controller('museums')
export class MuseumsController {
  constructor(private readonly museumsService: MuseumsService) {}

  @Get()
  @ApiOperation({
    summary: 'List museums',
    description:
      'Returns published museums. Supports delta sync via ?since= parameter. ' +
      'When since is provided, returns only items updated after that timestamp plus deleted IDs.',
  })
  @ApiQuery({ name: 'since', required: false, description: 'ISO 8601 timestamp for delta sync' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of museums' })
  async findAll(@Query() query: MuseumQueryDto) {
    return this.museumsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single museum by ID' })
  @ApiResponse({ status: 200, description: 'Museum details' })
  @ApiResponse({ status: 404, description: 'Museum not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.museumsService.findOne(id);
  }
}
