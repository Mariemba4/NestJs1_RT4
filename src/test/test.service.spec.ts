import { Test, TestingModule } from '@nestjs/testing';
import { TestService } from './test.service.js';

describe('TestService', () => {
  let service: TestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestService, { provide: 'UUID', useValue: () => 'uuid-test' }],
    }).compile();

    service = module.get<TestService>(TestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
