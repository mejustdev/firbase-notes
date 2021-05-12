## Important Links

[Source Code]()

[Docs]()

### 1. Create a Fb Project

### 2. Create a Frontend Project

Create a frontend project or use an existing one. As a bare minimum requirement, simply initialize an NPM project using the command below

```
npm init -y

# or

npx create-react-app myapp
```

### 3. Connect your Local Code to Firebase

```
npm -g firebase-tools

firebase-login

firebase init
# choose firestore, functions, storage, and emulators

```

## ///////////////////////////////////////////////////

### Matching

```
service cloud.firestore {
  match /databases/{database}/documents {

// it matches with the root element--Boilerplate

  }
}
```

### Three types of matching

```
match /users/jeffd23 {
    // Single document
}

// if you use docId dynamically, you can define rules for whole collection.
// If you have subcollection underneath users (items), the rules defined in parent can not goes down.

match /users/{docId} {
    allow read;
    match items/{itemId}{
      // here it is not allowed to read item doc.
    }
}

// If you want the rules cascade all the way down, you can write each sub-collection your rules but you can repeat yourself. Instead you can use `wild card`

match /users/{docId=**} {
    allow read, write;

    match items/{itemId}{

    }
}

```

```
match /users/jeffd23 {
    // Single document
}
```

```
match /users/{userId} {
    // Single Collection
}

```

```
match /posts/{postId=**} {
    // Recursive wildcard, includes all subcollections
}
```

## ///////////////////////////////////////////////////

### Allow

allow `<what> ` `<under what conditions?>`

`write` is more general. You can use create,update,delete instead of that.

> if you add `allow` without any condition, it will automatically resolves `true`

> When firestore analyzes your rules at runtime, it will look at first `allow` statements that resolves to `true`.

That means if sth. is allowed, it cant unallowed somewhere else in your rules.

You should only allow sth if it should %100 be allowed all the time in that case.

```
allow create,update;

// same as

allow create, update :true;

```

match /users/{docId=\*\*} {

      allow read, write;

// read

      allow get;
      allow list;

// write

      allow create;
      allow update;
      allow delete;

    }

    // or you can combine rules

    allow create,delete;

```

```

## ///////////////////////////////////////////////////

### Conditions

See the full [Firestore Rules Operators List](https://firebase.google.com/docs/rules/rules-language#building_conditions)

`request` is incoming data in client side

`request.auth` contains jwt, auth credentials

`request.resource` is data payload, attempting to modify DB

`request.path` is path to document

`request.method` is create,update,delete etc.

`resource` represents that the data is already exist in DB. Top level.

> **`resource` != `request.resource`**

## ///////////////////////////////////////////////////

### Common Examples

```
match /users/{userId} {

    allow read: if request.auth.uid != null;
    allow write: if request.auth.uid == userId;

}

match /todos/{docId} {

    allow read: if resource.data.status == 'published';

    allow create: if request.auth.uid == request.resource.data.uid
                && request.time == request.resource.data.createdAt;


    allow update: if request.auth.uid == resource.data.uid
                && request.resource.data.keys().hasOnly(['text', 'status']);
}


```

## ///////////////////////////////////////////////////

### Functions

Code duplication simplifies.

Just like `match` keyword where you define `function` matters. Because it has access all variables in that scope.

You can not use recursive functions. You are limited to a call stack of 10 functions callas within a function.

```
 match /users/{userId} {

      allow read: if isLoggedIn();
      allow write: if belongsTo(userId);

    }

    match /todos/{docId} {

      allow read: if resource.data.status == 'published';

      allow create: if canCreateTodo();


      allow update: if belongsTo()
                    && request.resource.data.keys().hasOnly(['text', 'status']);
    }

    function isLoggedIn() {
      return request.auth.uid != null;
    }

    function belongsTo(userId) {
      return request.auth.uid == userId || request.auth.uid == resource.data.uid;
    }

    function canCreateTodo() {
      let uid = request.auth.uid;
      let hasValidTimestamp = request.time == request.resource.data.createdAt;

      return belongsTo(uid) && hasValidTimestamp;
    }

```

## ///////////////////////////////////////////////////

### Read other documents

How do we access other documents?

existsAfter()

getAfter() both is used for Atomic Operations that update multiple docs at the same time.

```

get(/databases/$(database)/documents/users/$(request.auth.uid))
// returns full document payload

exists(/databases/$(database)/documents/users/$(SOME_DOC_ID))
// whether or not that doc is already exist in db

```

```

match /todos/{docId} {

allow create: if request.auth != null
              && exists(/databases/$(database)/document/users/$(request.auth.uid))

allow delete: if request.auth != null
              && get(/databases/$(database)/document/users/$(request.auth.uid)).data.admin == true;

// refactor
allow create: isLoggedIn()
              && hasProfile(request.auth.uid)
allow delete: isLoggedIn()
              && isAdmin(request.auth.uid)
}


function isLoggedIn(){
  return request.auth.uid != null;
}

function hasProfile(uid){
  return exists(/databases/$(database)/document/users/$(uid))
}

function isAdmin(uid){
  let profile = get(/databases/$(database)/document/users/$(uid))

  return profile.data.admin == true
}

```

## ///////////////////////////////////////////////////

### Chat Example

// chatImages

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /{document=**} {
      allow read, write: if false;
    }

    match /messages/{docId} {
 			allow read: if request.auth.uid != null;
      allow create: if canCreateMessage();
    }

  	function canCreateMessage() {
      let isSignedIn = request.auth.uid != null;
      let isOwner = request.auth.uid == request.resource.data.uid;
      let isNotTooLong = request.resource.data.text.size() < 255;
      let isNow = request.time == request.resource.data.createdAt;

      let isNotBanned = exists(
      	/databases/$(database)/documents/banned/$(request.auth.uid)
      ) == false;

      return isSignedIn && isOwner && isNotTooLong && isNow && isNotBanned;
    }

  }
}

```

## ///////////////////////////////////////////////////

### Role Based Auth Example

// role-based-auth images

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {


    match /users/{userId} {

      allow read: if isSignedIn();
      allow update, delete: if hasAnyRole(['admin']);

    }

    match /posts/{postId} {
        allow read: if ( isSignedIn() && resource.data.published ) || hasAnyRole(['admin']);
        allow create: if isValidNewPost() && hasAnyRole(['author']);
        allow update: if isValidUpdatedPost() && hasAnyRole(['author', 'editor', 'admin']);
        allow delete: if hasAnyRole(['admin']);
    }


    function isSignedIn() {
      return request.auth != null;
    }

    function hasAnyRole(roles) {
      return isSignedIn()
              && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(roles)
    }

    function isValidNewPost() {
      let post = request.resource.data;
      let isOwner = post.uid == request.auth.uid;
      let isNow = request.time == request.resource.data.createdAt;
      let hasRequiredFields = post.keys().hasAll(['content', 'uid', 'createdAt', 'published']);

      return isOwner && hasRequiredFields && isNow;
    }

    function isValidUpdatedPost() {
      let post = request.resource.data;
      let hasRequiredFields = post.keys().hasAny(['content', 'updatedAt', 'published']);
      let isValidContent = post.content is string && post.content.size() < 5000;

      return hasRequiredFields && isValidContent;
    }

  }
}

```
