import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Eye, EyeOff, Image as ImageIcon, Type } from 'lucide-react';
import { collection, getDocs, doc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadImage, validateImageFile, DEFAULT_ALLOWED } from '../../services/upload';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/common/SEO';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { logAdminAction } from '../../utils/auditLog';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  order: number;
  updatedAt: string;
}

const slugify = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryItem));
      setCategories(items.sort((a, b) => a.order - b.order));
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openNew = () => {
    setEditing({
      id: '',
      name: '',
      slug: '',
      description: '',
      image: '',
      active: true,
      order: categories.length + 1,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: editing.name.trim(),
        slug: editing.slug.trim() || slugify(editing.name),
        description: editing.description.trim(),
        image: editing.image,
        active: editing.active,
        order: editing.order,
        updatedAt: new Date().toISOString(),
      };
      if (editing.id) {
        await updateDoc(doc(db, 'categories', editing.id), data);
        logAdminAction(user?.uid || '', user?.email || '', 'update_category', 'categories', editing.id, { name: data.name });
        toast.success('Category updated');
      } else {
        const ref = await addDoc(collection(db, 'categories'), data);
        logAdminAction(user?.uid || '', user?.email || '', 'create_category', 'categories', ref.id, { name: data.name });
        toast.success('Category created');
      }
      setEditing(null);
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const validationError = validateImageFile(file, 10 * 1024 * 1024, DEFAULT_ALLOWED);
      if (validationError) throw new Error(validationError);
      const result = await uploadImage(file, { folder: 'categories', compress: true, maxDimension: 1024 });
      setEditing({ ...editing, image: result.url });
      toast.success('Image uploaded. Click Save to publish.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (!editing) return;
    setEditing({ ...editing, image: '' });
    toast.info('Image cleared. Click Save to publish.');
  };

  const toggleActive = async (item: CategoryItem) => {
    try {
      await updateDoc(doc(db, 'categories', item.id), {
        active: !item.active,
        updatedAt: new Date().toISOString(),
      });
      logAdminAction(user?.uid || '', user?.email || '', 'toggle_category', 'categories', item.id, { active: !item.active });
      fetchCategories();
    } catch {
      toast.error('Update failed');
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteDoc(doc(db, 'categories', id));
      logAdminAction(user?.uid || '', user?.email || '', 'delete_category', 'categories', id, {});
      toast.success('Category deleted');
      fetchCategories();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title="Categories" description="Manage product categories" />
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-espresso/5 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Catalog</p>
            <h1 className="text-h1 font-display font-bold text-espresso">Categories</h1>
            <p className="text-sm text-text-muted mt-2">Create, reorder, deactivate and manage category images shown across the storefront</p>
          </div>
          <button onClick={openNew} className="btn btn-primary">
            <Plus size={16} /> Add Category
          </button>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-white animate-pulse rounded-2xl border border-espresso/5" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-espresso/5">
            <p className="text-text-muted">No categories yet.</p>
            <button onClick={openNew} className="btn btn-primary px-6 py-3 text-xs mt-4">Add Your First Category</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  'bg-white border rounded-2xl p-6 space-y-4 transition-all',
                  category.active ? 'border-espresso/5' : 'border-amber-200 bg-amber-50/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', category.active ? 'bg-green-500' : 'bg-amber-500')} />
                    <div className="min-w-0">
                      <h3 className="font-bold text-espresso text-sm truncate">{category.name}</h3>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">
                        /{category.slug || slugify(category.name)}  -  Order {category.order}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(category)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        category.active ? 'text-green-600 hover:bg-green-50' : 'text-text-muted hover:bg-espresso/5'
                      )}
                      title={category.active ? 'Deactivate' : 'Activate'}
                    >
                      {category.active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => setEditing(category)} className="p-2 hover:bg-espresso/5 rounded-lg transition-colors" title="Edit">
                      <Type size={16} className="text-text-muted" />
                    </button>
                    <button onClick={() => setDeleteTarget(category)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {category.image ? (
                    <ImageWithFallback src={category.image} alt={category.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                  ) : (
                    <div className="w-20 h-20 bg-cream rounded-xl flex items-center justify-center text-text-muted shrink-0">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  {category.description && (
                    <p className="text-xs text-text-muted line-clamp-2">{category.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 bg-espresso/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-premium-xl max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-espresso">{editing.id ? 'Edit Category' : 'New Category'}</h2>
                <button onClick={() => setEditing(null)} className="p-2 hover:bg-espresso/5 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Name</label>
                  <input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })}
                    className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                    placeholder="Coffee Beans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Slug (URL)</label>
                  <input
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                    placeholder="coffee-beans"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Description</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium resize-y"
                  rows={3}
                  placeholder="Short description shown in the category card"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Image</label>
                <div className="flex items-center gap-4">
                  {editing.image ? (
                    <ImageWithFallback src={editing.image} alt={editing.name || 'Category'} className="w-28 h-28 object-cover rounded-2xl shrink-0" />
                  ) : (
                    <div className="w-28 h-28 bg-cream rounded-2xl flex items-center justify-center text-text-muted shrink-0">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="btn btn-outline px-4 py-2 text-xs cursor-pointer">
                      {uploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {editing.image && (
                      <button onClick={handleRemoveImage} className="text-xs font-bold text-red-500 hover:text-red-700 text-left">
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Order</label>
                  <input
                    type="number"
                    value={editing.order}
                    onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                    className="w-32 px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                      className="w-4 h-4 accent-caramel"
                    />
                    <span className="text-sm font-semibold text-espresso">Active (visible on storefront)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-espresso/5">
                <button onClick={() => setEditing(null)} className="btn-outline flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save'} <Save size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete category?"
          message={deleteTarget ? `"${deleteTarget.name}" will be removed from the storefront. Products in this category keep their category label.` : ''}
          confirmLabel="Delete"
          onConfirm={executeDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </DashboardLayout>
  );
}