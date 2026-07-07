import React, { useState, useRef } from 'react';
import { Product } from '../../types';
import { X, Upload, ImageIcon, Loader2 } from 'lucide-react';
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
    images: ['https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80'],
    isSubscriptionEligible: false,
    sku: `PRD-${Math.floor(Math.random() * 10000)}`,
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

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

      // Replace or prepend to images list
      setFormData(prev => ({
        ...prev,
        images: [downloadUrl, ...(prev.images?.slice(1) ?? [])]
      }));
      toast.success('Image uploaded successfully.');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Image upload failed. You can paste a URL below instead.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalData = {
         ...formData,
         price: Number(formData.priceLbp || formData.price || 0),
         priceUsd: Number(formData.priceUsd || 0),
         priceLbp: Number(formData.priceLbp || 0),
         stock: Number(formData.stock || 0),
      };
      await onSave(finalData);
      onClose();
    } catch (err) {
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const currentImage = uploadPreview || formData.images?.[0] || '';

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

          {/* Image Upload Section */}
          <div className="col-span-2">
            <label className="block text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-3 ml-4">Product Image</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Preview */}
              <div
                className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-espresso/20 bg-cream flex items-center justify-center cursor-pointer hover:border-caramel transition-colors flex-shrink-0 group"
                onClick={() => fileInputRef.current?.click()}
              >
                {currentImage ? (
                  <img src={currentImage} alt="Preview" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <ImageIcon size={32} className="text-text-muted group-hover:text-caramel transition-colors" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-cream border border-espresso/20 rounded-2xl text-xs font-black uppercase tracking-widest text-espresso hover:bg-espresso hover:text-white transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 ml-2">Or paste image URL</label>
                  <input
                    type="text"
                    value={(formData.images || []).join(', ')}
                    onChange={e => setFormData({...formData, images: e.target.value.split(',').map(url => url.trim()).filter(Boolean)})}
                    className="form-control text-xs"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
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
