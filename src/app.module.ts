import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CommonModule } from './common/common.module.js';
import { TestModule } from './test/test.module.js';
import { TodoModule } from './todo/todo.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoEntity } from './todo/entities/todo.entity.js';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

// Load local settings before TypeORM reads process.env. Existing shell variables take precedence.
if (existsSync('.env')) {
  loadEnvFile();
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: 'todo_db',
      entities: [TodoEntity],
      synchronize: true,
    }),
    CommonModule,
    TestModule,
    TodoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
