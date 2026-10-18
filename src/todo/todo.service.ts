
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodoEntity } from './entities/todo.entity.js';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
  ) { }

  // Version 1: Create a Todo
  create(createTodoDto: CreateTodoDto): Promise<TodoEntity> {
    const todo = this.todoRepository.create(createTodoDto);
    return this.todoRepository.save(todo);
  }

  // Version 2: Add a Todo
  addTodo(createTodoDto: CreateTodoDto): Promise<TodoEntity> {
    const todo = this.todoRepository.create(createTodoDto);
    return this.todoRepository.save(todo);
  }

  // Get all Todos
  findAll(): Promise<TodoEntity[]> {
    return this.todoRepository.find();
  }

  // Get one Todo by its ID
  async findOne(id: number): Promise<TodoEntity> {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return todo;
  }

  // Exercise 10: Update a Todo by its ID
  async updateTodo(
    id: number,
    updateTodoDto: UpdateTodoDto,
  ): Promise<TodoEntity> {
    const todo = await this.findOne(id);
    Object.assign(todo, updateTodoDto);
    return this.todoRepository.save(todo);
  }

  // Delete a Todo by its ID
  async deleteTodo(id: number): Promise<void> {
    const todo = await this.findOne(id);
    await this.todoRepository.remove(todo);
  }
}
