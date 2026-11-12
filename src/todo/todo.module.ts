import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoEntity } from './entities/todo.entity.js';
import { TodoController } from './todo.controller.js';
import { TodoService } from './todo.service.js';
import { AuthMiddleware } from '../common/middleware/auth.middleware.js';

@Module({
  imports: [TypeOrmModule.forFeature([TodoEntity])],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'v2/todo', method: RequestMethod.POST },
        { path: 'todo/:id', method: RequestMethod.PATCH },
        { path: 'todo/:id', method: RequestMethod.DELETE },
        { path: 'todo/soft/:id', method: RequestMethod.DELETE },
        { path: 'todo/restore/:id', method: RequestMethod.PATCH },
      );
  }
}
