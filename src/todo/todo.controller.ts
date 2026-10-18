import { Body, Controller, Post } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { TodoEntity } from './entities/todo.entity.js';
import { TodoService } from './todo.service.js';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoDto): Promise<TodoEntity> {
    return this.todoService.create(createTodoDto);
  }
}
