// __tests__/integration/authFlow.test.js
const { Client, Account } = require('appwrite');

describe('Auth Integration Tests', () => {
  jest.setTimeout(60000);
  
  let client;
  let account;
  let testUser;

  beforeAll(async () => {
    const endpoint = process.env.APPWRITE_TEST_ENDPOINT;
    const projectId = process.env.APPWRITE_TEST_PROJECT_ID;

    client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId);

    account = new Account(client);

    testUser = {
      userId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    };
  });

  beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('should import Appwrite successfully', () => {
    expect(Client).toBeDefined();
    expect(Account).toBeDefined();
  });

  test('should create Appwrite client successfully', () => {
    expect(client).toBeDefined();
    expect(account).toBeDefined();
  });

  test('should create account successfully', async () => {
    const response = await account.create(
      testUser.userId,
      testUser.email,
      testUser.password,
      testUser.name
    );
    
    expect(response).toBeDefined();
    expect(response.$id).toBe(testUser.userId);
    expect(response.email).toBe(testUser.email);
    expect(response.name).toBe(testUser.name);
  });

  test('should login successfully and create session', async () => {
    const session = await account.createEmailPasswordSession(
      testUser.email,
      testUser.password
    );
    
    expect(session).toBeDefined();
    expect(session.userId).toBe(testUser.userId);
    expect(session.provider).toBe('email');
    expect(session.providerUid).toBe(testUser.email);
    expect(session.$id).toBeDefined();
    expect(session.current).toBe(true);
  });

  test('should fail login with wrong credentials', async () => {
    await expect(
      account.createEmailPasswordSession(testUser.email, 'wrongPassword')
    ).rejects.toThrow();
  });

  test('should fail to create account with duplicate email', async () => {
    await expect(
      account.create(
        `duplicate-${Date.now()}`,
        testUser.email,
        testUser.password,
        'Duplicate User'
      )
    ).rejects.toThrow();
  });

  test('should create multiple sessions for same user', async () => {
    const session1 = await account.createEmailPasswordSession(
      testUser.email,
      testUser.password
    );
    
    expect(session1).toBeDefined();
    expect(session1.userId).toBe(testUser.userId);
    
    const client2 = new Client()
      .setEndpoint(process.env.APPWRITE_TEST_ENDPOINT)
      .setProject(process.env.APPWRITE_TEST_PROJECT_ID);
    const account2 = new Account(client2);
    
    const session2 = await account2.createEmailPasswordSession(
      testUser.email,
      testUser.password
    );
    
    expect(session2).toBeDefined();
    expect(session2.userId).toBe(testUser.userId);
    expect(session2.$id).not.toBe(session1.$id);
  });

  test('should validate session properties', async () => {
    const session = await account.createEmailPasswordSession(
      testUser.email,
      testUser.password
    );
    
    expect(session).toHaveProperty('$id');
    expect(session).toHaveProperty('$createdAt');
    expect(session).toHaveProperty('userId');
    expect(session).toHaveProperty('expire');
    expect(session).toHaveProperty('provider');
    expect(session).toHaveProperty('providerUid');
    expect(session).toHaveProperty('current');
    
    expect(typeof session.$id).toBe('string');
    expect(session.userId).toBe(testUser.userId);
    expect(session.provider).toBe('email');
    expect(session.providerUid).toBe(testUser.email);
    expect(session.current).toBe(true);
    expect(new Date(session.expire).getTime()).toBeGreaterThan(Date.now());
  });

  test('should handle account creation edge cases', async () => {
    const timestamp = Date.now();
    
    const minimalUser = {
      userId: `min-${timestamp}`,
      email: `minimal${timestamp}@test.com`,
      password: 'MinimalPass123!'
    };
    
    const response = await account.create(
      minimalUser.userId,
      minimalUser.email,
      minimalUser.password
    );
    
    expect(response).toBeDefined();
    expect(response.$id).toBe(minimalUser.userId);
    expect(response.email).toBe(minimalUser.email);
  });
});