import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Public } from 'src/decorator/public.decorator';
import { Roles } from 'src/decorator/role.decorator';
// import { Role } from 'src/enum/role.enum';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // @Roles(Role.ADMIN, Role.CREATOR)
  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventService.create(createEventDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.eventService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  // @Roles(Role.ADMIN, Role.CREATOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(id, updateEventDto);
  }

  // @Roles(Role.ADMIN, Role.CREATOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}
