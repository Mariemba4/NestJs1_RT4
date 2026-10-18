import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { TodoEntity } from './entities/todo.entity.js';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
  ) {}

  create(createTodoDto: CreateTodoDto): Promise<TodoEntity> {
    const todo = this.todoRepository.create(createTodoDto);
    return this.todoRepository.save(todo);
  }
}
