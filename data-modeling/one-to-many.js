import { db } from './config';

const authorId = 'dr-seuss';


// 4. Embedded One-to-Many
const authorWithBooks = db.collection('authors').doc(authorId)


// 5. Subcollection
const books = db.collection('authors').doc(authorId).collection('books');



// 6. Root Collection, requires index
const booksFrom1971 = db.collection('books')
    .where('author', '==', authorId)
    .where('published', '>', 1971);