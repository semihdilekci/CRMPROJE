import { Test, TestingModule } from '@nestjs/testing';
import { StructuredLogService } from './structured-log.service';
import * as transport from './json-log.transport';

describe('StructuredLogService', () => {
  let service: StructuredLogService;

  beforeEach(async () => {
    jest.spyOn(transport, 'writeStructuredJsonLogLine').mockImplementation(() => {
      /* no-op */
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [StructuredLogService],
    }).compile();
    service = module.get(StructuredLogService);
    jest.clearAllMocks();
    jest.spyOn(transport, 'writeStructuredJsonLogLine').mockImplementation(() => {
      /* no-op */
    });
  });

  it('writeLine çağrısında transport kullanır', () => {
    service.writeLine({ level: 'info', message: 'x' });
    expect(transport.writeStructuredJsonLogLine).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'info', message: 'x' }),
    );
  });

  it('baseFields servis ve env içerir', () => {
    const b = service.baseFields();
    expect(b).toMatchObject({ service: 'api' });
    expect(b).toHaveProperty('timestamp');
    expect(b).toHaveProperty('env');
  });
});
