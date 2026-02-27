import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { FirebaseAuthGuard } from './../src/auth/firebase-auth/firebase-auth.guard';
import { PrismaService } from './../src/prisma/prisma.service';
process.env.DATABASE_URL = "postgresql://wura_admin:wura_password_local@localhost:5432/wura_db?schema=public";

describe('Wura API End-to-End Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Create mock Firebase users
  const mockSenderUid = `test-sender-${Date.now()}`;
  const mockReceiverUid = `test-receiver-${Date.now()}`;

  // This guard will mock the Firebase admin verification
  const mockFirebaseAuthGuard = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      const authHeader = req.headers.authorization;
      if (!authHeader) return false;

      // We pass a mock token structure for testing
      // Format: Bearer sender_mock_token OR Bearer receiver_mock_token
      if (authHeader.includes('sender_mock_token')) {
        req.user = { uid: mockSenderUid, phone_number: '+22500000000' };
        return true;
      }
      if (authHeader.includes('receiver_mock_token')) {
        req.user = { uid: mockReceiverUid, email: 'receiver@wura.app' };
        return true;
      }

      return false;
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockFirebaseAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Cleanup DB dynamically (order matters due to foreign keys)
    await prisma.transaction.deleteMany();
    await prisma.sender.deleteMany();
    await prisma.receiver.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });

  it('/ (GET) Application health check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('Users Module', () => {
    it('/users/register/sender (POST) - should create a sender', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register/sender')
        .set('Authorization', 'Bearer sender_mock_token')
        .send({
          firstName: 'Amadou',
          lastName: 'Test',
          country: 'CIV'
        })
        .expect(201);

      expect(response.body.firebaseUid).toBe(mockSenderUid);
      expect(response.body.role).toBe('SENDER');
      expect(response.body.sender).toBeDefined();
    });

    it('/users/register/receiver (POST) - should create a receiver and wuraId', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register/receiver')
        .set('Authorization', 'Bearer receiver_mock_token')
        .send({
          firstName: 'Europe',
          lastName: 'Receveur'
        })
        .expect(201);

      expect(response.body.firebaseUid).toBe(mockReceiverUid);
      expect(response.body.role).toBe('RECEIVER');
      expect(response.body.receiver).toBeDefined();
      expect(response.body.receiver.wuraId).toMatch(/^WURA-/);
    });
  });

  describe('Users Module — Provisional Receiver (flux sender)', () => {
    it('/users/register/provisional-receiver (POST) - crée un receiver provisoire depuis le sender', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register/provisional-receiver')
        .set('Authorization', 'Bearer sender_mock_token')
        .send({
          firstName: 'Marie',
          lastName: 'Dubois',
          email: 'marie.dubois@example.com',
        })
        .expect(201);

      expect(response.body.role).toBe('RECEIVER');
      expect(response.body.receiver).toBeDefined();
      expect(response.body.receiver.wuraId).toMatch(/^WURA-/);
      // UID provisoire généré par le système (≠ sender UID)
      expect(response.body.firebaseUid).toMatch(/^PROV-/);
      expect(response.body.firebaseUid).not.toBe(mockSenderUid);
    });

    it('/users/register/provisional-receiver (POST) - email auto-généré si absent', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register/provisional-receiver')
        .set('Authorization', 'Bearer sender_mock_token')
        .send({ firstName: 'Paul', lastName: 'Martin' })
        .expect(201);

      expect(response.body.email).toMatch(/@wura\.provisional$/);
    });

    it('/users/register/provisional-receiver (POST) - refusé sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/users/register/provisional-receiver')
        .send({ firstName: 'Test', lastName: 'Unauthorized' })
        .expect(403);
    });
  });

  describe('Transactions Module', () => {
    let receiverWuraId: string;

    beforeAll(async () => {
      // Get the receiver created in previous test to find its WURA ID
      const user = await prisma.user.findUnique({
        where: { firebaseUid: mockReceiverUid },
        include: { receiver: true }
      });
      receiverWuraId = user.receiver.wuraId;
    });

    it('/transactions (POST) - should create a transaction initiated by sender', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', 'Bearer sender_mock_token')
        .send({
          receiverWuraId: receiverWuraId,
          amountFiatIn: 10000,
          amountUsdtBridged: 15.5,
          amountFiatOutExpected: 15
        })
        .expect(201);

      expect(response.body.referenceId).toMatch(/^TX-/);
      expect(response.body.status).toBe('INITIATED');
      expect(response.body.amountFiatIn).toBe(10000);
    });

    it('/transactions (GET) - sender should be able to view their transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', 'Bearer sender_mock_token')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].referenceId).toBeDefined();
    });
  });
});
