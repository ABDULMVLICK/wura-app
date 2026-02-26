import { Test, TestingModule } from '@nestjs/testing';
import { KkiapayController } from './kkiapay.controller';

describe('KkiapayController', () => {
  let controller: KkiapayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KkiapayController],
    }).compile();

    controller = module.get<KkiapayController>(KkiapayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
