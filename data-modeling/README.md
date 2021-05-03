# Firebase Data Modeling

## Code Snippets

[Repository](https://gist.github.com/codediodeio/513bf77ee45be6d38d27868f5345a002)

## Cloud Firestore

[Youtube](https://www.youtube.com/playlist?list=PLl-K7zZEsYLluG5MCVEzXAQ7ACZBCuZgZ)

## Notes

RD are normalized (no data duplication), no joins in Firestore.

Table === Collection

Raw === Document

document id ---> primary key on a table. You can references other id's in that document just foreign keys in an Sql table.

Catch ---> Firestore has no JOIN. Joins are not CPU efficient at scale. But you can still efficiently make JOIN by making request from the client.

Model your data that does not require JOIN

Prerender data for read efficiency

Model data for the screens in your app. Think how is going to be consumed.

There are more than one way. Think trade-offs.

NoSql ---> No Schema (Schemaless)

NoSql ---> Add data to any document on the fly. It does not have to match the data types in the other document in that collection.

Sql ---> forces spesific data type, spesific data structures for every table in a database.

Focus on how you will access the data from the app for a specific view or screen, NOT the most efficient [normalized](https://en.wikipedia.org/wiki/Database_normalization) structure. Favor efficient reads over efficient writes.

How to structure your data

Let Firebase SDK tell you when you need an index. It will pop up when writing code.

`const andQuery = db.collection('users').where('age', '==', 21).where('sex', '==', 'M');`

Security consideration:

If you have data that you don't want to expose client side, you want to make sure isolate its own specific collection with its own specific rules. rules.json

Data Modeling ask yourself --> How many items can be in this set?

### /////////////////////////////////////////////////////////////

Cardinality

```
Consider the cardinality or maximum size of a set. A loose rule to follow is…

One-to-Few. Embed. // Embed.png
One-to-Hundreds. Bucket. // Bucketing.png
One-to-Billions. Collection. // Subcollection.png
```

## /////////////////////////////////////////////////////////////

## One-to-One

We have `authors` and `account` details of authors.

> The first thing that we want to **consider** whether or not we expose that data in frontend.

### 1. If it is exposable, go and **embed** on the parent doc.

```
// Embedded, all data contained on single document, One-to-few
// one-one-parent-embed.png

const authorWithAccount = db.collection('authors').doc(userId)
```

### 2. If it has **sensitive** data,

- **Use same doc id** ---> separate it out into its own document in a different collection

```
// Shared Document ID
// one-one-sensitive-same-id.png

const author = db.collection('authors').doc(userId)
const account = db.collection('account').doc(userId);
```

- **Use different doc id** ---> use doc id as a field on the authors document.
  less efficient. because first you need to read authors doc, get id and secondary read to the account doc. Complexity

```
// Join related documents with different IDs,
// one-one-sensitive-different-id.png

const getAccount = async (userId) => {
    const snapshot = await db.collection('authors').doc(userId).get();
    const user = snapshot.data();

    return db.collection('accounts').doc(user.accountId)
}
```

## /////////////////////////////////////////////////////////////

## One-to-Many

### 1.Embedded One-to-Many

Embed array of maps to parent doc.

```
// embedded-one-to-many.png

const authorWithBooks = db.collection('authors').doc(authorId)
```

- It is great when you have small number of items in a set.
- Don't need to query those items across some other parent documents.

> What happens when I would like to query all of the books published on specific date or published after a certain date? You cant do that efficiently. You need to query all of the author docs and do all filtering on the client side. That's not ideal.

> Do I need to query this data? if yes, consider Subcollection

### 2.Subcollection

```
// Subcollection-one-to-many.png

const books = db.collection('authors').doc(authorId).collection('books');
```

But you can only query scope to this particular author. You can query all of the books from 1971 but all the books will belong to same author(dr-seuss)

> Do I need to query across multiple parents? ( For example; Query all the books written on specific date across all authors in a db)

### 3. Root Collection,

- Requires index, **It is more flexible**

```
// root-collection-one-to-many

const booksFrom1971 = db.collection('books')
    .where('author', '==', authorId)
    .where('published', '>', 1971);
```

## /////////////////////////////////////////////////////////////

## Many-to-Many

### 1.Middle Man Collection

```
//middle-man-collection-many-to-many.png

const authorId = 'dr-seuss';
const bookId   = 'lorax';

const userReviews = db.collection('reviews').where('author', '==', authorId);
const bookReviews = db.collection('reviews').where('book', '==', bookId);

// Single read with composite key

const specificReview = db.collection('reviews').doc(`${bookId}_${authorId}`);
```

- Downside is we need execute a lot of document reads to get all reviews

### 2.Map

```
// map-many-to-many.png
// Reviews embadded on books

const bookWithReviews = db.collection('books').doc(bookId);
const userReviews = db.collection('books').orderBy('reviews.jeff-delaney');

```

### 3.Array

```
// array-many-to-many.png

const books = db.collection('books').where('categories', 'array-contains', 'fiction');

```

### 4.Bucket

```
// bucket-many-to-many.png
// Get a collection of documents with an array of IDs

const getLikedBooks = async() => {

    // Get users through book likes
    const bookLikes = await db.collection('likes').doc(bookId).get();
    const userIds = Object.keys( bookLikes.data() );
    const userReads = userIds.map(id => db.collection('authors').doc(id).get() );
    const users = await Promise.all(userReads).then(console.log);

    // Get books through user likes
    const userLikes = await db.collection('likes').orderBy('jeff-delaney').get();
    const bookIds = userLikes.docs.map(snap => snap.id);

    const bookReads = bookIds.map(id => db.collection('books').doc(id).get() );
    const books = Promise.all(bookReads).then(console.log);
}


getLikedBooks()
```

## /////////////////////////////////////////////////////////////

### Should I duplicate data?

You should avoid data duplication, If you have certain value that could change potentially change frequently. (user profile/bio)

## /////////////////////////////////////////////////////////////

### Hearts, Likes, Votes

// hearts-likes-votes.png

Votes is middle man and keep track of the relationship. It does not render any data to UI. It delegates it to users/posts collection.

We use a cloud function to aggregate that data whenever a new vote doc is created. ---> When a new vote doc is created , we are going to use cloud function to add 1 or subtract 1 from users/posts document

## /////////////////////////////////////////////////////////////

### Role based Authorization

// role-based-authorization.png

Sample Firestore rules for Role-based Authorization where the user document determines the access level.

```
// rules.json

match /posts/{document} {

    function getRoles() {
        return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
    }

    allow read;
    allow update: if getRoles().hasAny(['admin', 'editor']) == true;
    allow write: if getRoles().hasAny(['admin']) == true;
}
```
