import { db } from './config';

// Single Doc Read
const ref = db.collection('posts').doc('postId');

// Subcollection Read
const ref = db.collection('posts').doc('postId').collection('tags');

// Bucket Read

const post = db.collection('posts').doc('postId');
const tags = db.collection('tags').doc('postId');

// Multi-document read

const post = await db.collection('posts').doc('postId').get();

const tagIds = post.data().tags;

const tagReads = tagIds.map((tag) => db.collection('tags').get(tag));

const tags = await Promise.all(tagReads);

// Helper: Reads an array of IDs from a collection concurrently
const readIds = async (collection, ids) => {
  const reads = ids.map((id) => collection.doc(id).get());
  const result = await Promise.all(reads);
  return result.map((v) => v.data());
};

// Basic Where
const rangeQuery = db.collection('users').where('age', '>=', 21);

// AND
const andQuery = db.collection('users').where('age', '==', 21).where('sex', '==', 'M');

// OR
const q1 = db.collection('users').where('age', '==', 21);
const q2 = db.collection('users').where('age', '==', 25);

// NOT
const not1 = db.collection('users').where('age', '>', 21);
const not2 = db.collection('users').where('age', '<', 21);
