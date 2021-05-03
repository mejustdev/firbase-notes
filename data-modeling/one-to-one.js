import { db } from './config';

const userId = 'ayn-rand';

// 1. Embedded, all data contained on single document, One-to-few

const authorWithAccount = db.collection('authors').doc(userId)

// 2. Shared Document ID
const author = db.collection('authors').doc(userId)
const account = db.collection('account').doc(userId);


// 3. Join related documents with different IDs, 
const getAccount = async (userId) => {
    const snapshot = await db.collection('authors').doc(userId).get();
    const user = snapshot.data();

    return db.collection('accounts').doc(user.accountId)
}




