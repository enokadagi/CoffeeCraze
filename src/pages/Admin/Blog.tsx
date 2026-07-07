import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Plus, Trash2, Edit3, Eye, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/common/SEO';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import ConfirmDialog from '../../components/common/ConfirmDialog';

interface BlogPost {
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
  comments: any[];
  status: 'draft' | 'published';
  createdAt: string;
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'blog_posts'));
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
      // Sort desc by date
      fetched.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      setPosts(fetched);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      toast.error('Failed to load blog posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingPost) return;
    if (!editingPost.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const { id, ...data } = editingPost;
      
      // If it is a new post without a set ID, let's create a slug for it
      let targetId = id;
      if (!targetId || targetId === 'new') {
        targetId = editingPost.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        if (!targetId) targetId = 'post-' + Date.now();
      }

      await setDoc(doc(db, 'blog_posts', targetId), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      
      toast.success(id === 'new' ? 'Article created' : 'Article updated');
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPost) return;

    setUploading(true);
    try {
      const path = `blog/${editingPost.id || 'temp'}/${Date.now()}-${file.name}`;
      const sRef = storageRef(storage, path);
      const task = uploadBytesResumable(sRef, file);
      const url = await new Promise<string>((resolve, reject) => {
        task.on('state_changed', null, reject, async () => {
          resolve(await getDownloadURL(task.snapshot.ref));
        });
      });
      setEditingPost({ ...editingPost, image: url });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const triggerNewPost = () => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric'
    });

    setEditingPost({
      id: 'new',
      title: '',
      excerpt: '',
      content: '',
      category: 'Culture',
      date: formattedDate,
      image: '',
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      comments: [],
      status: 'draft',
      createdAt: new Date().toISOString()
    });
  };

  const deletePost = (id: string) => setDeletePostId(id);

  const executeDeletePost = async () => {
    const id = deletePostId!;
    setDeletePostId(null);
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
      toast.success('Article deleted');
      fetchPosts();
    } catch (err) {
      toast.error('Failed to delete article.');
    }
  };

  const categories = ['Culture', 'Guide', 'Origin', 'Recipe', 'News'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title="Blog Journal Management" description="Manage roastery journal posts" />
        
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-espresso/5 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Publications</p>
            <h1 className="text-h1 font-display font-bold text-espresso">Blog Journal</h1>
            <p className="text-sm text-text-muted mt-2">Create, edit, and publish stories and coffee masterclasses</p>
          </div>
          <button onClick={triggerNewPost} className="btn btn-primary">
            <Plus size={16} /> New Article
          </button>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white animate-pulse rounded-[2rem] border border-espresso/5" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-espresso/5 shadow-premium">
            <FileText className="mx-auto text-coffee-200 mb-4" size={48} strokeWidth={1} />
            <p className="text-text-secondary font-serif italic">No journal entries found. Share your first story!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                layout
                className={cn(
                  "bg-white border rounded-[2rem] p-6 flex flex-col justify-between shadow-premium transition-all hover:shadow-premium-lg duration-500",
                  post.status === 'published' ? "border-espresso/5" : "border-amber-200 bg-amber-50/10"
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="bg-cream px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-text-secondary">{post.category}</span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                      post.status === 'published' ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                    )}>
                      {post.status}
                    </span>
                  </div>

                  {post.image && (
                    <ImageWithFallback src={post.image} alt={post.title} className="w-full h-32 object-cover rounded-2xl" />
                  )}

                  <div className="space-y-2">
                    <h3 className="font-bold text-espresso text-base line-clamp-1">{post.title}</h3>
                    <p className="text-xs text-text-muted line-clamp-2 italic font-serif leading-relaxed">"{post.excerpt}"</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 mt-4 border-t border-border-light text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  <div className="flex gap-4">
                    <span>{post.likes} Likes</span>
                    <span>{post.comments?.length || 0} Comments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingPost(post)}
                      className="p-2 hover:bg-espresso/5 rounded-lg text-text-secondary transition-colors"
                      title="Edit article"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                      title="Delete article"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingPost && (
          <div className="fixed inset-0 bg-espresso/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-premium-xl max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <h2 className="text-xl font-bold text-espresso">
                  {editingPost.id === 'new' ? 'New Article' : 'Edit Article'}
                </h2>
                <button onClick={() => setEditingPost(null)} className="p-2 hover:bg-espresso/5 rounded-lg text-text-muted">
                  ✓
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Title</label>
                    <input
                      value={editingPost.title}
                      onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                      className="w-full px-4 py-3 bg-cream border border-border rounded-xl outline-none focus:border-coffee-500 text-sm font-semibold text-espresso"
                      placeholder="e.g. Perfecting Your V60 Technique"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Category</label>
                    <select
                      value={editingPost.category}
                      onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                      className="w-full px-4 py-3 bg-cream border border-border rounded-xl outline-none focus:border-coffee-500 text-sm font-semibold text-espresso"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Excerpt</label>
                  <input
                    value={editingPost.excerpt}
                    onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    className="w-full px-4 py-3 bg-cream border border-border rounded-xl outline-none focus:border-coffee-500 text-sm font-semibold text-espresso italic font-serif"
                    placeholder="Short description for cards..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Content (Markdown Supported)</label>
                  <textarea
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    className="w-full px-6 py-4 bg-cream border border-border rounded-2xl outline-none focus:border-coffee-500 text-sm text-espresso font-mono"
                    rows={8}
                    placeholder="# Header&#10;Write your story here in Markdown..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Publish Status</label>
                    <select
                      value={editingPost.status}
                      onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as any })}
                      className="w-full px-4 py-3 bg-cream border border-border rounded-xl outline-none focus:border-coffee-500 text-sm font-semibold text-espresso"
                    >
                      <option value="draft">Draft (Hidden)</option>
                      <option value="published">Published (Visible)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Publish Date (Display)</label>
                    <input
                      value={editingPost.date}
                      onChange={(e) => setEditingPost({ ...editingPost, date: e.target.value })}
                      className="w-full px-4 py-3 bg-cream border border-border rounded-xl outline-none focus:border-coffee-500 text-sm font-semibold text-espresso"
                      placeholder="e.g. June 09, 2026"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Image URL</label>
                  <input
                    value={editingPost.image}
                    onChange={(e) => setEditingPost({ ...editingPost, image: e.target.value })}
                    className="w-full px-4 py-3 bg-cream border border-border rounded-xl outline-none focus:border-coffee-500 text-sm font-semibold text-espresso"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Or upload image:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-text-secondary"
                    />
                    {uploading && <RefreshCw size={14} className="animate-spin text-caramel" />}
                  </div>
                  {editingPost.image && (
                    <ImageWithFallback src={editingPost.image} alt="Preview" className="w-full h-40 object-cover rounded-xl mt-2 border border-espresso/5 shadow-inner" />
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border-light">
                <button
                  onClick={() => setEditingPost(null)}
                  className="flex-1 py-3 border border-coffee-200 text-text-secondary font-bold rounded-full hover:bg-cream transition-colors uppercase text-xs tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-espresso text-white font-bold rounded-full hover:bg-coffee-600 transition-colors flex items-center justify-center gap-2 uppercase text-xs tracking-[0.2em] shadow-premium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                  <Save size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deletePostId !== null}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDeletePost}
        onCancel={() => setDeletePostId(null)}
      />
    </DashboardLayout>
  );
}
