import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown, MessageSquare, Clock, CornerDownRight, ArrowLeft, Send } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import SEO from '../components/common/SEO';
import { toast } from 'sonner';

type Reply = {
  id: string;
  userName: string;
  content: string;
  createdAt: string;
};

type Comment = {
  id: string;
  userName: string;
  content: string;
  createdAt: string;
  replies: Reply[];
};

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  image: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  comments: Comment[];
  createdAt: string;
  status: string;
};

// Simple guest ID helper for localStorage so guest interactions still write to Firestore
function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem('coffeecraze_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('coffeecraze_guest_id', guestId);
  }
  return guestId;
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [commentName, setCommentName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyName, setReplyName] = useState('');
  const [replyContent, setReplyContent] = useState('');

  // Fetch post details
  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      try {
        const docRef = doc(db, 'blog_posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({
            id: docSnap.id,
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            category: data.category || 'Culture',
            date: data.date || '',
            image: data.image || '',
            likes: data.likes ?? 0,
            dislikes: data.dislikes ?? 0,
            likedBy: data.likedBy || [],
            dislikedBy: data.dislikedBy || [],
            comments: data.comments || [],
            createdAt: data.createdAt || '',
            status: data.status || 'published',
          });
        } else {
          toast.error('Post not found.');
          navigate('/blog');
        }
      } catch (err) {
        console.error('Error loading blog post:', err);
        toast.error('Failed to load blog post.');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-text-secondary font-medium">Pouring your article...</p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const currentUserId = user?.uid || getOrCreateGuestId();
  const isLiked = post.likedBy.includes(currentUserId);
  const isDisliked = post.dislikedBy.includes(currentUserId);

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!id) return;
    let newLikes = post.likes;
    let newDislikes = post.dislikes;
    let newLikedBy = [...post.likedBy];
    let newDislikedBy = [...post.dislikedBy];

    if (type === 'like') {
      if (isLiked) {
        // Toggle off
        newLikedBy = newLikedBy.filter(uid => uid !== currentUserId);
        newLikes = Math.max(0, newLikes - 1);
      } else {
        // Vote like
        newLikedBy.push(currentUserId);
        newLikes += 1;
        if (isDisliked) {
          newDislikedBy = newDislikedBy.filter(uid => uid !== currentUserId);
          newDislikes = Math.max(0, newDislikes - 1);
        }
      }
    } else {
      if (isDisliked) {
        // Toggle off
        newDislikedBy = newDislikedBy.filter(uid => uid !== currentUserId);
        newDislikes = Math.max(0, newDislikes - 1);
      } else {
        // Vote dislike
        newDislikedBy.push(currentUserId);
        newDislikes += 1;
        if (isLiked) {
          newLikedBy = newLikedBy.filter(uid => uid !== currentUserId);
          newLikes = Math.max(0, newLikes - 1);
        }
      }
    }

    const updatedPost = {
      ...post,
      likes: newLikes,
      dislikes: newDislikes,
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy
    };

    // Optimistic UI update
    setPost(updatedPost);

    try {
      const docRef = doc(db, 'blog_posts', id);
      await updateDoc(docRef, {
        likes: newLikes,
        dislikes: newDislikes,
        likedBy: newLikedBy,
        dislikedBy: newDislikedBy
      });
    } catch (err) {
      console.error('Error updating vote:', err);
      toast.error('Failed to register vote.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    const authorName = user ? (profile?.displayName || user.displayName || user.email || 'Member') : (commentName.trim() || 'Anonymous Coffee Lover');
    
    const newComment: Comment = {
      id: 'comment_' + Date.now(),
      userName: authorName,
      content: commentContent.trim(),
      createdAt: new Date().toISOString(),
      replies: []
    };

    const updatedComments = [...post.comments, newComment];
    setPost(prev => prev ? { ...prev, comments: updatedComments } : null);
    setCommentContent('');
    if (!user) setCommentName('');

    try {
      const docRef = doc(db, 'blog_posts', post.id);
      await updateDoc(docRef, { comments: updatedComments });
      toast.success('Comment added successfully.');
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to save comment.');
    }
  };

  const handleAddReply = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const authorName = user ? (profile?.displayName || user.displayName || user.email || 'Member') : (replyName.trim() || 'Anonymous Coffee Lover');

    const newReply: Reply = {
      id: 'reply_' + Date.now(),
      userName: authorName,
      content: replyContent.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = post.comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...c.replies, newReply]
        };
      }
      return c;
    });

    setPost(prev => prev ? { ...prev, comments: updatedComments } : null);
    setReplyContent('');
    setReplyTargetId(null);
    if (!user) setReplyName('');

    try {
      const docRef = doc(db, 'blog_posts', post.id);
      await updateDoc(docRef, { comments: updatedComments });
      toast.success('Reply posted successfully.');
    } catch (err) {
      console.error('Error adding reply:', err);
      toast.error('Failed to save reply.');
    }
  };

  return (
    <div className="pt-16 sm:pt-24 md:pt-32 pb-20 min-h-screen bg-cream relative overflow-hidden">
      <SEO title={post.title} description={post.excerpt} />
      <div className="mesh-gradient absolute inset-0 opacity-20 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-12">
        {/* Back Link */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-espresso transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Journal
        </Link>

        {/* Article Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-xs sm:text-sm font-bold uppercase tracking-widest text-text-muted">
            <span className="bg-cream px-3 py-1 rounded-full text-coffee-800">{post.category}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {post.date}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-espresso tracking-tightest leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-text-secondary font-serif italic leading-relaxed border-l-4 border-caramel pl-4 py-1">
            "{post.excerpt}"
          </p>
        </div>

        {/* Hero Image */}
        {post.image && (
          <div className="aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden shadow-premium-lg border border-border bg-cream">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content Body */}
        <article className="prose prose-coffee max-w-none text-espresso leading-relaxed space-y-6 font-medium text-sm sm:text-base">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        {/* Like/Dislike Interactions */}
        <div className="flex items-center justify-between border-t border-b border-border py-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleVote('like')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-bold text-xs sm:text-sm ${
                isLiked
                  ? 'bg-espresso text-white border-espresso'
                  : 'bg-white text-text-secondary border-coffee-200 hover:border-espresso hover:text-espresso'
              }`}
            >
              <ThumbsUp size={16} />
              <span>{post.likes} Likes</span>
            </button>
            <button
              onClick={() => handleVote('dislike')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-bold text-xs sm:text-sm ${
                isDisliked
                  ? 'bg-[#C78A47] text-white border-[#C78A47]'
                  : 'bg-white text-text-secondary border-coffee-200 hover:border-[#C78A47] hover:text-[#C78A47]'
              }`}
            >
              <ThumbsDown size={16} />
              <span>{post.dislikes} Dislikes</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-text-muted font-bold text-xs sm:text-sm">
            <MessageSquare size={16} />
            <span>{post.comments.length} Comments</span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-8">
          <h3 className="text-xl sm:text-2xl font-display font-black text-espresso tracking-tight">
            Discussion
          </h3>

          {/* Comment List */}
          <div className="space-y-6">
            {post.comments.length === 0 ? (
              <p className="text-sm text-text-muted italic">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              post.comments.map(comment => (
                <div key={comment.id} className="bg-white border border-border-light p-6 rounded-[2rem] shadow-premium space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-espresso text-sm">{comment.userName}</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed italic">
                    "{comment.content}"
                  </p>
                  
                  {/* Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-6 border-l-2 border-border space-y-3 pt-2">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <CornerDownRight size={12} className="text-text-muted" />
                            <span className="font-bold text-espresso">{reply.userName}</span>
                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider ml-auto">
                              {new Date(reply.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary pl-4 italic">
                            "{reply.content}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Button / Toggle Input */}
                  <div className="pt-2">
                    {replyTargetId === comment.id ? (
                      <form onSubmit={(e) => handleAddReply(e, comment.id)} className="space-y-3 mt-3">
                        {!user && (
                          <input
                            type="text"
                            required
                            placeholder="Your Name"
                            value={replyName}
                            onChange={(e) => setReplyName(e.target.value)}
                            className="w-full max-w-xs px-4 py-2 bg-cream border border-border rounded-xl outline-none focus:border-coffee-500 text-xs font-semibold uppercase tracking-wider"
                          />
                        )}
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full pl-4 pr-12 py-3 bg-cream border border-border rounded-xl text-xs text-espresso outline-none focus:border-coffee-500 focus:ring-2 focus:ring-coffee-500/5"
                          />
                          <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-espresso text-white rounded-lg hover:bg-coffee-600 transition-colors"
                          >
                            <Send size={12} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setReplyTargetId(null); setReplyContent(''); }}
                          className="text-[10px] text-text-muted font-bold uppercase tracking-wider hover:underline"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setReplyTargetId(comment.id)}
                        className="text-xs font-bold text-caramel hover:text-espresso transition-colors uppercase tracking-wider"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New Comment Form */}
          <form onSubmit={handleAddComment} className="bg-white border border-border p-6 sm:p-8 rounded-[2.5rem] shadow-premium-lg space-y-6">
            <h4 className="text-lg font-bold text-espresso uppercase tracking-wider">Leave a Comment</h4>
            
            <div className="space-y-4">
              {!user && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-espresso uppercase tracking-widest pl-2">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full max-w-md px-6 py-4 bg-cream border border-border rounded-2xl outline-none focus:border-coffee-500 text-xs font-bold uppercase tracking-widest text-espresso placeholder:text-text-muted"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-espresso uppercase tracking-widest pl-2">Comment</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share your thoughts or questions..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="w-full px-6 py-4 bg-cream border border-border rounded-2xl outline-none focus:border-coffee-500 text-sm text-coffee-800 placeholder:text-text-muted resize-none font-medium italic"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-8 py-4 bg-espresso text-white rounded-full text-xs font-black uppercase tracking-[0.3em] hover:bg-coffee-600 transition-colors shadow-premium active:scale-95 duration-300"
            >
              Post Comment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
