import { NestFactory } from '@nestjs/core';
import {
  randFirstName,
  randJobTitle,
  randLastName,
  randNumber,
  seed as seedFalso,
} from '@ngneat/falso';
import { AppModule } from '../app.module.js';
import { CvService } from '../cv/cv.service.js';
import { CreateCvDto } from '../cv/dto/create-cv.dto.js';
import { SkillService } from '../skill/skill.service.js';
import { UserService } from '../user/user.service.js';

const USER_COUNT = 5;
const CV_COUNT = 12;
const SKILL_DESIGNATIONS = [
  'TypeScript',
  'NestJS',
  'Node.js',
  'MySQL',
  'Docker',
  'React',
  'Git',
  'Python',
];

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userService = app.get(UserService);
    const skillService = app.get(SkillService);
    const cvService = app.get(CvService);

    // A fixed seed makes the generated names, jobs, and ages reproducible.
    seedFalso('nestjs-tp2-cv-seed-v1');

    const userFixtures = Array.from({ length: USER_COUNT }, (_, index) => ({
      username: `seed_${randFirstName().toLowerCase()}_${index + 1}`,
      email: `seed.user.${index + 1}@example.test`,
      // This account is only test data; never use this password outside the seed.
      password: 'seed-only-not-for-login',
    }));

    const existingUsers = await userService.findAll();
    const users = [];
    for (const fixture of userFixtures) {
      const existingUser = existingUsers.find(
        (user) => user.email === fixture.email,
      );
      users.push(existingUser ?? (await userService.create(fixture)));
    }

    const existingSkills = await skillService.findAll();
    const skills = [];
    for (const designation of SKILL_DESIGNATIONS) {
      const existingSkill = existingSkills.find(
        (skill) => skill.designation === designation,
      );
      skills.push(
        existingSkill ?? (await skillService.create({ designation })),
      );
    }

    const existingCvs = await cvService.findAll();
    let createdCvCount = 0;

    for (let index = 0; index < CV_COUNT; index += 1) {
      const cin = String(90000000 + index + 1);
      if (existingCvs.some((cv) => cv.cin === cin)) continue;

      const skillIds = [
        skills[index % skills.length].id,
        skills[(index + 1) % skills.length].id,
      ];
      const cv: CreateCvDto = {
        name: randLastName(),
        firstname: randFirstName(),
        age: randNumber({ min: 21, max: 60 }),
        cin,
        job: randJobTitle(),
        path: `/seed/cvs/${cin}.pdf`,
        userId: users[index % users.length].id,
        skillIds,
      };

      await cvService.create(cv);
      createdCvCount += 1;
    }

    console.log(
      `Seed terminé : ${users.length} utilisateurs, ${skills.length} compétences, ${createdCvCount} nouveaux CV.`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error('Échec du seed des CV :', error);
  process.exitCode = 1;
});
