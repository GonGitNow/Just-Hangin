import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Comment } from '../types';

/**
 * Add a comment to a pin
 * @param pinId Pin ID
 * @param userId User ID of the commenter
 * @param text Comment text
 * @returns ID of the created comment
 */
export const addComment = async (
  pinId: string,
  userId: string,
  text: string
): Promise<string> => {
  try {
    const commentsCollection = collection(db, 'comments');
    
    const commentDoc = {
      pinId,
      userId,
      text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(commentsCollection, commentDoc);
    
    // Update the document with its ID
    await updateDoc(docRef, { id: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Update an existing comment
 * @param commentId Comment ID
 * @param text New comment text
 */
export const updateComment = async (
  commentId: string,
  text: string
): Promise<void> => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment does not exist');
    }
    
    await updateDoc(commentRef, {
      text,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param commentId Comment ID
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Get all comments for a pin
 * @param pinId Pin ID
 * @returns Array of comments
 */
export const getCommentsByPin = async (pinId: string): Promise<Comment[]> => {
  try {
    // First try with ordering by createdAt
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('pinId', '==', pinId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
    } catch (indexError) {
      console.warn('Index not found for comments with ordering, falling back to unordered query');
      
      // Fallback to unordered query if index doesn't exist
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('pinId', '==', pinId)
      );
      
      const querySnapshot = await getDocs(q);
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      
      // Sort manually in memory
      return comments.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    }
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

/**
 * Get a single comment by ID
 * @param commentId Comment ID
 * @returns Comment data or null if not found
 */
export const getCommentById = async (commentId: string): Promise<Comment | null> => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      return null;
    }
    
    const commentData = commentDoc.data();
    
    return {
      id: commentDoc.id,
      pinId: commentData.pinId,
      userId: commentData.userId,
      text: commentData.text,
      createdAt: commentData.createdAt as Date | { toDate: () => Date },
      updatedAt: commentData.updatedAt as Date | { toDate: () => Date },
    };
  } catch (error) {
    console.error('Error getting comment:', error);
    return null;
  }
}; 