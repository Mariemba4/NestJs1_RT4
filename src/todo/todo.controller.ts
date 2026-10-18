
import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodoEntity } from './entities/todo.entity.js';
import { TodoService } from './todo.service.js';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  // Version 1 : create a Todo
  @Post()
  create(@Body() createTodoDto: CreateTodoDto): Promise<TodoEntity> {
    return this.todoService.create(createTodoDto);
  }

  // Version 2 : add a Todo
  @Post('add')
  addTodo(@Body() createTodoDto: CreateTodoDto): Promise<TodoEntity> {
    return this.todoService.addTodo(createTodoDto);
  }

  // Exercice 10 : update a Todo by its ID
  @Patch(':id')
  updateTodo(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<TodoEntity> {
    return this.todoService.updateTodo(parseInt(id, 10), updateTodoDto);
  }
}
