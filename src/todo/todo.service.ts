import { Injectable,NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,DeleteResult } from 'typeorm';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodoEntity } from './entities/todo.entity.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
  ) {}

  // VERSION 1 : pas d'enregistrement en base
  addTodoV1(createTodoDto: CreateTodoDto): CreateTodoDto {
    return createTodoDto;
  }

  // VERSION 2 : enregistrement dans MySQL avec TypeORM
  async addTodoV2(
    createTodoDto: CreateTodoDto,
  ): Promise<TodoEntity> {
    return await this.todoRepository.save(createTodoDto);
  }

  //mettre à jour un todo dans la base de données via son id.
  async updateTodo(
    id: number,
    updateTodoDto: UpdateTodoDto,
  ): Promise<TodoEntity> {

    const todo = await this.todoRepository.preload({
      id,
      ...updateTodoDto,
    });

    if (!todo) {
      throw new NotFoundException(
        `Todo avec l'id ${id} introuvable`,
      );
    }
    return await this.todoRepository.save(todo);
  }

  //supprimer un todo dans la base de données via son id.
  async deleteTodo(
    id: number,
  ): Promise<DeleteResult> {

    const result =
      await this.todoRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Todo avec l'id ${id} introuvable`,
      );
    }
    return result;
  }

  //supprimer un todo dans la base de données via son id d’une façon soft.
  async softdeleteTodo(id: number) {
    return await this.todoRepository.softDelete(id);
  }

   //restaurer le todo.
  async restoreTodo(id: number) {
    return await this.todoRepository.restore(id);
  }

    //compter les todos par statut en une seule requête.
  async getStats() {
    const results = await this.todoRepository
      .createQueryBuilder('todo')
      .select('todo.status', 'status')
      .addSelect('COUNT(todo.id)', 'count')
      .groupBy('todo.status')
      .getRawMany();

    return results;
  }
}
