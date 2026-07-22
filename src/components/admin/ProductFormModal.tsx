import React, { useState, useRef } from 'react';
import { Product } from '../../types';
import { X, Upload, ImageIcon, Loader2, GripVertical, Star, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProductFormModalProps {
  product?: Product | null;
  plans?: { id: string; name: string }[];
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
}

const CATEGORIES = [
  'Coffee Beans',
  'Ground Coffee',
  'Capsules',
  'Drip Bags',
  'Gift Boxes',
  'Brewing Equipment',
  'Accessories',
  'Espresso Machines',
  'Syrups',
  'Merchandise'
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80';

export default function ProductFormModal({ product, plans = [], onClose, onSave }: ProductFormModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(product || {
    name: '',
    description: '',
    price: 0,
    priceUsd: 0,
    priceLbp: 0,
    stock: 0,
    category: 'Coffee Beans',
    tags: [],
    images: [FALLBACK_IMAGE],
    isSubscriptionEligible: false,
    sku: `PRD-${Math.floor(Math.random() * 10000)}`,
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images: string[] = Array.isArray(formData.images) ? formData.images : [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }

    if (!storage) {
      toast.error('Storage not initialized. Using URL field instead.');
      return;
    }

    setUploading(true);
    try {
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `products/${filename}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), downloadUrl],
      }));
      toast.success('Image uploaded successfully.');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Image upload failed. You can paste a URL below instead.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    const url = window.prompt('Enter image URL:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), url.trim()],
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
    toast.success('Image removed');
  };

  const handleSetPrimary = (index: number) => {
    const newImages = [...images];
    const primary = newImages.splice(index, 1)[0];
    newImages.unshift(primary);
    setFormData(prev => ({ ...prev, images: newImages }));
    toast.success('Primary image updated');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleMoveDown = (index: number) => {
    if (index >= images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!images.length) {
      toast.error('At least one product image is required');
      return;
    }
    setLoading(true);
    try {
      const finalData = {
         ...formData,
         price: Number(formData.priceLbp || formData.price || 0),
         priceUsd: Number(formData.priceUsd || 0),
         priceLbp: Number(formData.priceLbp || 0),
         stock: Number(formData.stock || 0),
         images,
      };
      await onSave(finalData);
      onClose();
    } catch (err) {
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/90 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] w-full max-w-full sm:max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto border border-espresso/10 shadow-premium">
        <div className="p-4 sm:p-6 md:p-8 border-b border-espresso/10 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl">
          <h2 className="text-2xl sm:text-3xl font-display font-black uppercase italic tracking-tightest text-espresso">
            {product ? 'Edit Product' : 'New Product'}
          </h2>
          <button aria-label="Close modal" onClick={onClose} className="p-3 bg-espresso text-cream rounded-full hover:bg-espresso/90 hover:text-caramel transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">

          {/* Multi-Image Gallery */}
          <div className="col-span-2">
            <label className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">
              Product Images <span className="text-caramel">({images.length})</span>
            </label>

            <div className="flex flex-wrap gap-3 mb-4">
              {images.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative group w-28 h-28 rounded-xl overflow-hidden border-2 border-espresso/10 bg-cream flex-shrink-0"
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex === null || dragIndex === index) return;
                    const newImages = [...images];
                    const [moved] = newImages.splice(dragIndex, 1);
                    newImages.splice(index, 0, moved);
                    setFormData(prev => ({ ...prev, images: newImages }));
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  {/* Primary badge */}
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-caramel text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow">
                      Primary
                    </div>
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-espresso/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                    {index > 0 && (
                      <button type="button" onClick={() => handleSetPrimary(index)}
                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors" title="Set as primary">
                        <Star size={12} />
                      </button>
                    )}
                    {images.length > 1 && (
                      <>
                        {index > 0 && (
                          <button type="button" onClick={() => handleMoveUp(index)}
                            className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors" title="Move up">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 15l-6-6-6 6"/></svg>
                          </button>
                        )}
                        {index < images.length - 1 && (
                          <button type="button" onClick={() => handleMoveDown(index)}
                            className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors" title="Move down">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                          </button>
                        )}
                      </>
                    )}
                    <button type="button" onClick={() => handleRemoveImage(index)}
                      className="p-1.5 bg-red-500/70 hover:bg-red-500 rounded-lg text-white transition-colors" title="Remove">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add image button */}
              <div
                className="w-28 h-28 rounded-xl border-2 border-dashed border-espresso/20 bg-cream flex flex-col items-center justify-center cursor-pointer hover:border-caramel hover:bg-caramel/5 transition-all flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin text-caramel" />
                ) : (
                  <>
                    <Plus size={20} className="text-text-muted mb-1" />
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Add Image</span>
                  </>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <button type="button" onClick={handleAddUrl}
                className="px-4 py-2 bg-cream border border-espresso/20 rounded-xl text-[10px] font-black uppercase tracking-wider text-espresso hover:bg-espresso hover:text-white transition-all">
                + Add URL
              </button>
              <span className="text-[10px] text-text-muted">or drop images or paste URLs</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="product-name" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Product Name</label>
              <input
                id="product-name"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="form-control"
                placeholder="e.g. Ethiopia Yirgacheffe"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="product-description" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Short Description</label>
              <textarea
                id="product-description"
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="form-textarea"
                placeholder="Brief description shown on product cards"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="product-full-description" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Full Description</label>
              <textarea
                id="product-full-description"
                rows={4}
                value={formData.fullDescription}
                onChange={e => setFormData({...formData, fullDescription: e.target.value})}
                className="form-textarea"
                placeholder="Detailed description shown on product detail page"
              />
            </div>

            <div>
              <label htmlFor="product-price-usd" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Price (USD)</label>
              <input
                id="product-price-usd"
                required
                type="number" step="0.01" min="0"
                value={formData.priceUsd}
                onChange={e => setFormData({...formData, priceUsd: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-price-lbp" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Price (LBP)</label>
              <input
                id="product-price-lbp"
                required
                type="number" min="0"
                value={formData.priceLbp || formData.price}
                onChange={e => setFormData({...formData, priceLbp: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-wholesale-price-usd" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Wholesale Price (USD)</label>
              <input
                id="product-wholesale-price-usd"
                type="number" step="0.01" min="0"
                value={formData.wholesalePriceUsd}
                onChange={e => setFormData({...formData, wholesalePriceUsd: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-wholesale-price-lbp" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Wholesale Price (LBP)</label>
              <input
                id="product-wholesale-price-lbp"
                type="number" min="0"
                value={formData.wholesalePriceLbp}
                onChange={e => setFormData({...formData, wholesalePriceLbp: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-stock" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Stock (Units)</label>
              <input
                id="product-stock"
                required
                type="number" min="0"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-category" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Category</label>
              <select
                id="product-category"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
                className="form-select"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-plan" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Assign Plan</label>
              <select
                id="product-plan"
                value={formData.planId || ''}
                onChange={e => setFormData({...formData, planId: e.target.value || undefined})}
                className="form-select"
              >
                <option value="">None</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-sku" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">SKU</label>
              <input
                id="product-sku"
                type="text"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                className="form-control"
                placeholder="e.g. BEANS-ETH-250"
              />
            </div>

            <div>
              <label htmlFor="product-tags" className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Tags (comma separated)</label>
              <input
                id="product-tags"
                type="text"
                value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''}
                onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                className="form-control"
                placeholder="single-origin, light-roast"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="flex items-center gap-4 cursor-pointer p-4 bg-cream rounded-[2rem] border border-espresso/10 hover:border-caramel transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isSubscriptionEligible}
                  onChange={e => setFormData({...formData, isSubscriptionEligible: e.target.checked})}
                  className="w-5 h-5 sm:w-6 sm:h-6 accent-caramel"
                />
                <span className="text-sm font-black uppercase tracking-widest italic text-espresso">Eligible for Subscription</span>
              </label>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 border-t border-espresso/10 flex flex-col sm:flex-row justify-end gap-4 sm:gap-6">
             <button type="button" onClick={onClose} className="px-6 w-full sm:w-auto sm:px-8 py-3 sm:py-4 font-black uppercase tracking-widest italic text-espresso border border-espresso/20 rounded-full hover:bg-espresso/5 transition-colors">Cancel</button>
             <button disabled={loading || uploading} type="submit" className="btn btn-primary w-full sm:w-auto px-8 sm:px-10 md:px-12 py-3 sm:py-4 italic">
               {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
