import {
  Body,
  Controller,
  Get,
  Post,
  Version,
   ParseIntPipe,
  Patch,
  Param, 
  Delete,
  Query,
} from '@nestjs/common';

import { TodoService } from './todo.service.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { TodoEntity } from './entities/todo.entity.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { GetTodosDto } from './dto/get-todo.dto.js';

@Controller('todo')
export class TodoController {
  constructor(
    private readonly todoService: TodoService,
  ) {}

  // VERSION 1 : sans base de données
  @Post()
  @Version('1')
  addTodoV1(
    @Body() createTodoDto: CreateTodoDto,
  ): CreateTodoDto {
    return this.todoService.addTodoV1(createTodoDto);
  }

  // VERSION 2 : avec TypeORM
  @Post()
  @Version('2')
  addTodoV2(
    @Body() createTodoDto: CreateTodoDto,
  ): Promise<TodoEntity> {
    return this.todoService.addTodoV2(createTodoDto);
  }

  //mettre à jour un todo dans la base de données via son id.
  @Patch(':id')
  updateTodo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<TodoEntity> {

    return this.todoService.updateTodo(
      id,
      updateTodoDto,
    );
  }

  //supprimer un todo dans la base de données via son id.
  @Delete(':id')
  deleteTodo(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.todoService.deleteTodo(id);
  }

  //supprimer un todo dans la base de données via son id d’une façon soft.
  @Delete('soft/:id')
  softdeleteTodo(
  @Param('id', ParseIntPipe) id: number,
  ) {
  return this.todoService.softdeleteTodo(id);
    }

 //restaurer le todo.
  @Patch('restore/:id')
  restoreTodo(
  @Param('id', ParseIntPipe) id: number,
  ) {
  return this.todoService.restoreTodo(id);
    }
    
    // nombre de todos par statut.
  @Get('stats')
  getStats() {
    return this.todoService.getStats();
  }

 /* @Get('search')
  searchTodos(@Query() searchTodoDto: SearchTodoDto) {

    return this.todoService.searchTodos(searchTodoDto);
    
  }*/

  @Get()
getAll(@Query() getTodosDto: GetTodosDto) {

  return this.todoService.getAll(getTodosDto);

}
    

  @Get(':id')
getById(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.todoService.getById(id);
}
    
}
