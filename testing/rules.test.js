const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { setup, teardown } = require('./helpers');

describe('Database rules', () => {
  let db;

  // Applies only to tests in this describe block
  beforeAll(async () => {
    db = await setup(mockUser, mockData);
  });

  afterAll(async () => {
    await teardown();
  });
});
