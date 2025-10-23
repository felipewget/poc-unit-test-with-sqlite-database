import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../user.service';
import { User } from '../../../entities/users.entity';
import { ILike } from 'typeorm';

describe('UserService (com SQLite real)', () => {
  let service: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Suggestion with SQLite', async () => {
    // Seeds: We are creating these records on memory
    const createdFelipe = await service.create('Felipe', 'felipe@test.com');
    const createdMario = await service.create('Mario', 'mario@test.com');

    expect(createdFelipe).toMatchObject({
      name: 'Felipe',
      email: 'felipe@test.com',
    });

    expect(createdMario).toMatchObject({
      name: 'Mario',
      email: 'mario@test.com',
    });

    // Testing the service and we are really executing the create and the service
    /**
     * async create(name: string, email: string) {
        const user = this.repo.create({ name, email });
        return this.repo.save(user);
      }
     */
    const found = await service.getUserByEmail('felipe@test.com');
    expect(found).toBeDefined();
    expect(found!.email).toBe('felipe@test.com');

    const notFound = await service.getUserByEmail('not_found@test.com');
    expect(notFound).toBeNull();

    // Native operations, we are really testing the query
    // In a real scenario we would execute our handler and we would check the
    // SQL into the handlers
    const allUsers = await service['repo'].find();
    expect(allUsers.length).toBe(2);

    const likeOrAnyOperation = await service['repo'].find({
      where: { name: ILike('%mar%') },
    });

    expect(likeOrAnyOperation.length).toBe(1);
    expect(likeOrAnyOperation[0].name).toBe('Mario');
  });

  it('Current version(I cant be specific)', async () => {
    const mockUser = {
      id: 1,
      name: 'Felipe',
      email: 'felipe@test.com',
    } as User;

    const mockRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockReturnValue(mockUser),
      save: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // Nos nao estamos validando o SQL dentro do email
    // nos estamos falando "vai retornar isso aki(felipe@test.com)"
    // e testamos a partir dai

    // Com isso nao validamos a query, os status='active' ou qualquer outra
    // validacao no SQL
    // PQ nao estamos executando um banco real
    const found = await service.getUserByEmail('DIFFERENT@test.com');
    
    expect(found).toEqual(mockUser);
  });
});
