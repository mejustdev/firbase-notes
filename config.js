import * as firebase from 'firebase/app';
import 'firebase/firestore';

var firebaseConfig = {
  // your firebase credentials
};


  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();