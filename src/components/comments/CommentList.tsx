import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, UserCircle, MessageSquare, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/formatDate';
import { clsx } from 'clsx';

// Base Comment type from DB
interface DbComment {
  id: number;
  content: string;
  created_at: string;
  user_id: string | null;
  category_id?: number | null; // Assuming these can be null based on schema check
  item_id?: number | null;     // Assuming these can be null based on schema check
  parent_comment_id: number | null;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null; // Profile might be null if user_id is null
}

// Enriched Comment type for UI state, including replies
interface Comment extends DbComment {
  replies: Comment[];
}

interface CommentListProps {
  categoryId?: number;
  itemId?: number;
}

// Helper function to build comment threads
const buildCommentThreads = (comments: DbComment[]): Comment[] => {
  const commentMap: { [key: number]: Comment } = {};
  const rootComments: Comment[] = [];

  // First pass: create Comment objects with empty replies arrays
  comments.forEach(comment => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  // Second pass: nest replies under their parents
  comments.forEach(comment => {
    if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
      commentMap[comment.parent_comment_id].replies.push(commentMap[comment.id]);
    } else {
      rootComments.push(commentMap[comment.id]);
    }
  });

  // Sort root comments and replies by creation date (newest first)
  const sortByDate = (a: Comment, b: Comment) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  rootComments.sort(sortByDate);
  Object.values(commentMap).forEach(comment => comment.replies.sort(sortByDate));

  return rootComments;
};

export const CommentList: React.FC<CommentListProps> = ({ categoryId, itemId }) => {
  const [comments, setComments] = useState<Comment[]>([]); // State now holds nested comments
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const commentsRef = useRef(comments);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null); // State for active reply form
  const [isAdmin, setIsAdmin] = useState(false); // <-- Re-add admin state

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  // --- Add useEffect to check admin status ---
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsAdmin(false); // Default to false
      try {
        // 1. Get the current session and user ID
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        const userId = session?.user?.id;
        if (!userId) {
          console.log('[Admin Check] No user session found.');
          return; // Exit if no user is logged in
        }

        // 2. Query the profiles table for the user's role
        console.log(`[Admin Check] Checking role for user ID: ${userId}`);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles') // Query the profiles table
          .select('role')     // Select the role column
          .eq('id', userId) // Match the profile ID with the authenticated user ID
          .single();         // Expect only one profile per user

        if (profileError) {
          // Handle potential errors like profile not found (if RLS prevents access or profile doesn't exist)
          if (profileError.code === 'PGRST116') { // code for "Searched for item does not exist"
             console.warn(`[Admin Check] Profile not found for user ID: ${userId}`);
          } else {
             console.error('[Admin Check] Error fetching profile:', profileError);
          }
          return; // Cannot determine role if profile fetch fails
        }

        // 3. Check the role and set state
        if (profileData) {
          const userRole = profileData.role;
          const isAdminUser = userRole === 'admin';
          setIsAdmin(isAdminUser);
          console.log(`[Admin Check] Fetched Role: ${userRole}, Is Admin: ${isAdminUser}`);
        } else {
           console.log('[Admin Check] No profile data returned, assuming not admin.');
        }

      } catch (error) {
        console.error("[Admin Check] Error checking admin status:", error);
        // Ensure isAdmin is false in case of any unexpected error
        setIsAdmin(false); 
      }
    }
    checkAdminStatus();
  }, [user]); // Re-run if user changes
  // --- End admin status check ---

  // Simplified fetchComment - just adds a new comment to the flat list before restructuring
  const fetchAndAddComment = useCallback(async (commentId: number) => {
    console.log(`fetchAndAddComment: Fetching details for comment ${commentId}`);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        parent_comment_id,
        profiles:profiles(username, avatar_url)
      `)
      .eq('id', commentId)
      .returns<DbComment | null>() // Ensure DbComment is correctly typed
      .single();

    if (error) {
        console.error(`fetchAndAddComment: Error fetching comment ${commentId}:`, error);
        return;
    }

    // Get current state from ref
    let updatedThreads = commentsRef.current; 

    if (data) { 
        // Assign data to a new const with explicit type to help TS inference
        const commentData: DbComment = data;
        
        // Find all existing comments in a flat list from the current state
        const flatExistingComments: DbComment[] = [];
        const flatten = (thread: Comment) => {
            const { replies, ...dbComment } = thread;
            flatExistingComments.push(dbComment);
            thread.replies.forEach(flatten);
        };
        updatedThreads.forEach(flatten); // Flatten the current state

        // Check if the fetched comment already exists using the new const
        if (!flatExistingComments.some(c => c.id === commentData.id)) {
            // Use the new const here
            console.log(`fetchAndAddComment: Adding new comment ${commentData.id} and rebuilding threads.`);
            // If it doesn't exist, calculate the new state including the fetched comment
            // Use the new const here
            updatedThreads = buildCommentThreads([...flatExistingComments, commentData]); 
        } else {
            // Use the new const here
            console.log(`fetchAndAddComment: Comment ${commentData.id} already exists, skipping update.`);
            // If it exists, updatedThreads remains the current state
        }
    } else {
        console.log(`fetchAndAddComment: Comment ${commentId} not found (returned null).`);
    }

    // Set the state with the determined updated threads
    setComments(updatedThreads);

  }, []); // Keep dependencies minimal

  useEffect(() => {
    console.log('CommentList: Real-time useEffect running.');
    loadInitialComments(); // Renamed initial load function
    
    const channel = supabase
      .channel('comments_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: categoryId 
            ? `category_id=eq.${categoryId}` 
            : (itemId ? `item_id=eq.${itemId}` : undefined)
        },
        (payload) => {
          console.log('Real-time INSERT received:', payload);
          const newCommentData = payload.new as DbComment;
          
          // Temporarily comment out to prevent auto-fetching on insert
          // fetchAndAddComment(newCommentData.id);
          console.log('[Debug] Real-time insert detected, auto-fetch disabled for now.');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      console.log('CommentList: Real-time useEffect cleanup - removing channel.');
    };
  }, [categoryId, itemId, user?.id, fetchAndAddComment]);

  // Function to load initial comments and build threads
  const loadInitialComments = async () => {
    console.log(`loadInitialComments called`);
    setIsLoading(true);
    
    // Fetch ALL comments for the category/item for simplicity
    // In a real app, implement proper pagination for threads
    let query = supabase
      .from('comments')
      .select(`
        *,
        parent_comment_id,
        profiles:profiles(username, avatar_url)
      `)
      .order('created_at', { ascending: true }); // Fetch oldest first for easier structuring? Or sort after?

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    } else if (itemId) {
      query = query.eq('item_id', itemId);
    }

    // Add a reasonable limit for now
    query = query.limit(100); 

    const { data, error } = await query;

    if (error) {
      console.error('Error loading comments:', error);
      setComments([]); // Reset comments on error
    } else {
      console.log(`loadInitialComments received ${data?.length || 0} comments.`);
      if (data) {
          setComments(buildCommentThreads(data));
      } else {
          setComments([]);
      }
    }
    setIsLoading(false);
    console.log(`loadInitialComments finished.`);
  };

  const handleSubmitComment = async (e: React.FormEvent, parentId: number | null = null) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    const commentText = parentId ? (document.getElementById(`reply-input-${parentId}`) as HTMLTextAreaElement)?.value : newComment;
    
    if (!commentText || !commentText.trim()) return; 
    
    setIsSubmitting(true);
    
    const postAnonymously = !user || (parentId ? false : isAnonymous); // Replies usually aren't anonymous? Assume false for replies for now.
    const userIdToSend = postAnonymously ? null : user?.id;

    const commentData: Partial<DbComment> = { // Use Partial as ID/created_at are generated
      content: commentText.trim(),
      user_id: userIdToSend,
      parent_comment_id: parentId,
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(itemId ? { item_id: itemId } : {}),
    };
    
    console.log("Submitting comment data:", commentData);

    const { data: insertedData, error } = await supabase
      .from('comments')
      .insert(commentData as any) // Cast to any to avoid TS complaining about missing fields
      .select(`
        *,
        parent_comment_id,
        profiles:profiles(username, avatar_url)
      `)
      .single();

    setIsSubmitting(false);

    if (!error && insertedData) {
      console.log('Comment submission successful:', insertedData.id, 'Parent:', parentId);
      // OPTIMISTIC UPDATE REWORK NEEDED HERE FOR THREADS
      // For now, rely on real-time update via fetchAndAddComment
      
      if (parentId) {
        // Clear reply input and close form
        const replyInput = document.getElementById(`reply-input-${parentId}`) as HTMLTextAreaElement;
        if (replyInput) replyInput.value = '';
        setReplyingToCommentId(null);
      } else {
        // Clear main input form
        setNewComment('');
        setIsAnonymous(false);
      }

      // Manually trigger fetch/rebuild if real-time is slow/unreliable
      // fetchAndAddComment(insertedData.id); 

    } else if (error) {
      console.error('Error submitting comment:', error);
      // TODO: Show error to user
    }
  };

  // --- Add Delete Comment Handler ---
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment and all its replies? This action cannot be undone.')) {
      return;
    }

    console.log(`[Delete] Attempting to delete comment ID: ${commentId}`);
    setIsLoading(true); // Show loading indicator during deletion

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('[Delete] Supabase error:', error);
        // Check for potential RLS errors
        if (error.message.includes('security policy')) {
          alert('Error: You do not have permission to delete this comment.');
        } else {
          alert(`Failed to delete comment: ${error.message}`);
        }
        throw error; // Re-throw to be caught in the outer catch block
      }

      console.log(`[Delete] Successfully deleted comment ID: ${commentId} from DB.`);
      // Reload the comments list to reflect the deletion
      await loadInitialComments();
      console.log('[Delete] Reloaded comments after deletion.');

    } catch (err) {
      console.error('[Delete] General error:', err);
      // Error is already alerted, maybe set a general error state if needed
    } finally {
      // Ensure loading is always turned off, even if loadInitialComments fails
      setIsLoading(false); 
    }
  };

  // --- End Delete Comment Handler ---

  // --- Helper Component for Admin Actions ---
  const CommentAdminActions: React.FC<{commentId: number; onDelete: (id: number) => void}> = ({ commentId, onDelete }) => {
    // Using a basic HTML button with simple, visible styles for testing
    return (
      <button
        type="button" // Important for HTML buttons in forms
        onClick={() => onDelete(commentId)}
        className={clsx(
          'inline-flex items-center justify-center', // Basic flex alignment
          'p-1', // Padding
          'rounded', // Rounded corners
          'bg-red-500', // Solid red background
          'text-white', // White icon color
          'hover:bg-red-700', // Darker red on hover
          'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2' // Focus state
        )}
        aria-label="Delete comment"
      >
        {/* Use the icon, it should inherit text-white */}
        <Trash2 className="w-4 h-4" /> 
      </button>
    );
  };
  // --- End Helper Component ---

  // --- Rendering Logic ---

  // Modify CommentNode props to accept isAdmin and onDelete
  const CommentNode: React.FC<{ comment: Comment; level: number; isAdmin: boolean; onDelete: (id: number) => void; }> = ({ comment, level, isAdmin, onDelete }) => {
    const isReplying = replyingToCommentId === comment.id;
    
    return (
      <motion.div
        key={comment.id}
        className={`bg-white p-4 rounded-lg border border-gray-200 ${level > 0 ? 'ml-8 md:ml-12 mt-3' : 'mt-4'}`}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
            {comment.profiles?.avatar_url ? (
              <img src={comment.profiles.avatar_url} alt={comment.profiles.username || 'User'} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <UserCircle className="h-10 w-10 text-gray-400" />
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-800">
                {comment.profiles?.username || 'Anonymous'}
              </h4>
              {/* Container for actions (timestamp, delete button) */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {formatDate(comment.created_at)}
                </span>
                {/* --- Render Admin Actions Component Conditionally --- */}
                {isAdmin && <CommentAdminActions commentId={comment.id} onDelete={onDelete} />}
                {/* --- End Conditional Render --- */}
              </div>
            </div>
            <div className="mt-1 text-gray-700 whitespace-pre-wrap"> {/* Reduced margin top */} 
              {comment.content}
            </div>

            {/* Action Buttons */}
            <div className="mt-2 flex items-center space-x-4">
                {user && level < 3 && ( // Only show reply if logged in and depth is reasonable
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingToCommentId(isReplying ? null : comment.id)}
                        className="text-xs text-gray-500 hover:text-primary-600 flex items-center"
                    >
                        <MessageSquare className="w-3 h-3 mr-1"/>
                        {isReplying ? 'Cancel Reply' : 'Reply'}
                    </Button>
                 )}
            </div>
          </div>
        </div>

        {/* Reply Form (conditional) */}
        {isReplying && (
            <div className="mt-3 ml-12 pl-1 border-l-2 border-primary-200">
                 <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="space-y-3">
                    <textarea
                        id={`reply-input-${comment.id}`}
                        placeholder={`Replying to ${comment.profiles?.username || 'Anonymous'}...`}
                        className="w-full min-h-[60px] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                        disabled={isSubmitting}
                        rows={2}
                        autoFocus
                    />
                    <div className="flex justify-end">
                        <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        >
                        Post Reply
                        </Button>
                    </div>
                </form>
            </div>
        )}

        {/* Render Replies Recursively */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-0">
            {comment.replies.map(reply => (
              // Pass isAdmin and onDelete down to replies
              <CommentNode key={reply.id} comment={reply} level={level + 1} isAdmin={isAdmin} onDelete={onDelete} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Comments</h3>
      
      {/* --- Main Comment Input Form --- */}
      <form onSubmit={(e) => handleSubmitComment(e, null)} className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            {( !user || isAnonymous) ? (
                <UserCircle className="h-6 w-6 text-gray-500" />
            ) : (
                <User className="h-6 w-6 text-primary-500" />
            )}
          </div>
          <div className="flex-grow">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Add a public comment..." : "Add a public comment (posting as Anonymous)"}
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSubmitting}
              rows={3}
            />
            <div className="mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                {user && (
                    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <input 
                            type="checkbox" 
                            id="anonymous-comment" 
                            checked={isAnonymous} 
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="anonymous-comment" className="text-sm text-gray-600">Post as Anonymous</label>
                    </div>
                )}
                {!user && <div className="flex-grow"></div>}
                
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Post Comment
                </Button>
            </div>
          </div>
        </div>
      </form>
      
      {/* --- Display Comments (with scroll container) --- */}
      <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2">
        <motion.div 
          className="space-y-0"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {isLoading ? (
              <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
              </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white p-4 rounded-lg border border-gray-200">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            comments.map((comment) => (
              // Pass isAdmin and onDelete down to top-level comments
              <CommentNode key={comment.id} comment={comment} level={0} isAdmin={isAdmin} onDelete={handleDeleteComment} />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}; // End of CommentList component