## ///////////////////////////////////////////////////

### Test security rules with Node.js

// test-folder-structure.png

Create the files `test/rules.test.js` and `test/helpers.js.`

Install Jest and the Firebase Testing Package.

`npm install --save-dev jest @firebase/rules-unit-testing firebase-admin`

Add the following script.

```
// package.json

"scripts": {
    "test": "jest --env=node --forceExit",
  },

```

```
// rules.test.js

text('Jest works', () => {
  expect(2).toBe(3);
})

```

### Setup & Teardown mock Firestore data for

Create a file to manage setup and teardown for tests.

`helpers.js` and `rules.test.js`

### Write unit tests with mock data for Firestore Security Rules.

`firebase emulators:start`

```
// rules.test.js

const mockUser ={
  uid: 'Bob',
}

const mockData ={
  'users/bob': {
    roles: ['admin]
  },
  'posts/abc' : {
    content: 'Hello World',
    uid: 'alice',
    createdAt: null,
    published: false  }
}


describe('Database rules', () => {
    let db;

    // Applies only to tests in this describe block
    beforeAll(async () => {
      db = await setup(mockUser, mockData);
    });

    afterAll(async () => {
      await teardown();
    });

    test('deny when reading an unauthorized collection', async () => {
      // create random endpoint to test inc. admin not access it. all denies
      const ref = db.collection('secret-stuff');

      expect( await assertFails( ref.get() ) );

    });

    test('allow admin to read unpublished posts', async () => {
      const ref = db.doc('posts/abc');

      expect( await assertSucceeds( ref.get() ) );

    });

    test('allow admin to update posts of other users', async () => {
      const ref = db.doc('posts/abc');

      expect( await assertSucceeds( ref.update({ published: true }) ) );

    });

  });

```

### Debugging Report

Debug rules using the [Firestore code coverage report](https://firebase.google.com/docs/rules/emulator-reports#cloud-firestore_1).

In Jest put `only` keyword which test you want to inspect.

```
test.only('allow admin to update posts of other users', async () => {
      const ref = db.doc('posts/abc');

      expect( await assertSucceeds( ref.update({ published: true }) ) );

    });
```

Open this url in your browser

`http://localhost:8080/emulator/v1/projects/<database_name>:ruleCoverage.html`
