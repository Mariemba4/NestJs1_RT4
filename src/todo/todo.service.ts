import { Injectable,NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,DeleteResult,Brackets } from 'typeorm';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodoEntity } from './entities/todo.entity.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { GetTodosDto } from './dto/get-todo.dto.js';

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
    const response = await this.todoRepository.softDelete(id);
    if (!response.affected) throw new NotFoundException("La section n'existe pas");
        return response;
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
    //équivalent sql : SELECT todo.status AS status, COUNT(todo.id) AS count 
    //FROM todo_entity todo
    //WHERE todo.deletedAt IS NULL
    //GROUP BY todo.status;
    return results;
  }
  
async getById(id: number) {
  const todo = await this.todoRepository.findOne({
    where: { id },
  });

  if (!todo) {
    throw new NotFoundException(
      `Todo ${id} introuvable`,
    );
  }

  return todo;
}


async getAll(getTodosDto: GetTodosDto) {
  const { search, status, page, limit } = getTodosDto;

  const queryBuilder = this.todoRepository.createQueryBuilder('todo');

  if (search) {
    queryBuilder.andWhere(
      new Brackets(qb => {                         // Sans brackets : A OR B AND C => A OR (B AND C)  
        qb.where('todo.name LIKE :search', {      // Avec brackets : (A OR B) AND C  
          search: `%${search}%`,
        }).orWhere('todo.description LIKE :search', {
          search: `%${search}%`,
        });     // WHERE (todo.name LIKE '%search%' OR todo.description LIKE '%search%')
      }),
    );
  }

  if (status) {
    queryBuilder.andWhere('todo.status = :status', { status });
  }
  //equivalent SQL :
  // SELECT * FROM todo_entity todo
  // WHERE (todo.name LIKE '%search%' OR todo.description LIKE '%search%')
  // AND todo.status = 'status'
  // Si search et status ne sont pas fournis, la requête sera : 
  // SELECT * FROM todo_entity todo

  const [data, total] = await queryBuilder
    .orderBy('todo.id', 'ASC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

}
