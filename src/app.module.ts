import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CommonModule } from './common/common.module.js';
import { TestModule } from './test/test.module.js';
import { TodoModule } from './todo/todo.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoEntity } from './todo/entities/todo.entity.js';
import { UserModule } from './user/user.module.js';
import { UserEntity } from './user/entities/user.entity.js';
import { CvModule } from './cv/cv.module.js';
import { CvEntity } from './cv/entities/cv.entity.js';
import { SkillModule } from './skill/skill.module.js';
import { SkillEntity } from './skill/entities/skill.entity.js';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { AuthModule } from './auth/auth.module.js';

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
      entities: [TodoEntity, UserEntity, CvEntity, SkillEntity],
      synchronize: true,
    }),
    CommonModule,
    TestModule,
    TodoModule,
    UserModule,
    CvModule,
    SkillModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
