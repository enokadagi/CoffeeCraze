import React, { useState } from 'react';
import { Product } from '../../types';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormModalProps {
  product?: Product | null;
  plans?: { id: string; name: string }[];
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
}

export default function ProductFormModal({ product, plans = [], onClose, onSave }: ProductFormModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(product || {
    name: '',
    description: '',
    price: 0,
    priceUsd: 0,
    priceLbp: 0,
    stock: 0,
    category: 'beans',
    tags: [],
    images: ['https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80'],
    isSubscriptionEligible: false,
    sku: `PRD-${Math.floor(Math.random() * 10000)}`,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic formatting cleanup
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
      toast.error('Failed to save ritual');
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
            {product ? 'Modify Ritual' : 'Commit New Ritual'}
          </h2>
          <button aria-label="Close modal" onClick={onClose} className="p-3 bg-espresso text-cream rounded-full hover:bg-espresso/90 hover:text-caramel transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="product-name" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Ritual Name</label>
              <input 
                id="product-name"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="form-control"
              />
            </div>
            
            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="product-description" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Description</label>
              <textarea 
                id="product-description"
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="form-textarea"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="product-full-description" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Full Description</label>
              <textarea 
                id="product-full-description"
                rows={3}
                value={formData.fullDescription}
                onChange={e => setFormData({...formData, fullDescription: e.target.value})}
                className="form-textarea"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="product-images" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Image URLs (comma separated)</label>
              <input 
                id="product-images"
                type="text"
                value={(formData.images || []).join(', ')}
                onChange={e => setFormData({...formData, images: e.target.value.split(',').map(url => url.trim()).filter(Boolean)})}
                className="form-control"
                placeholder="https://... , https://..."
              />
            </div>

            <div>
              <label htmlFor="product-price-usd" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Price (USD)</label>
              <input 
                id="product-price-usd"
                required
                type="number" step="0.01"
                value={formData.priceUsd}
                onChange={e => setFormData({...formData, priceUsd: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-price-lbp" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Price (LBP)</label>
              <input 
                id="product-price-lbp"
                required
                type="number"
                value={formData.priceLbp || formData.price}
                onChange={e => setFormData({...formData, priceLbp: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-wholesale-price-usd" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Wholesale Price (USD)</label>
              <input 
                id="product-wholesale-price-usd"
                type="number" step="0.01"
                value={formData.wholesalePriceUsd}
                onChange={e => setFormData({...formData, wholesalePriceUsd: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-wholesale-price-lbp" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Wholesale Price (LBP)</label>
              <input 
                id="product-wholesale-price-lbp"
                type="number"
                value={formData.wholesalePriceLbp}
                onChange={e => setFormData({...formData, wholesalePriceLbp: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="product-stock" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Inventory (Units)</label>
              <input 
                id="product-stock"
                required
                type="number"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                className="form-control"
              />
            </div>

            <div>
               <label htmlFor="product-category" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Category</label>
               <select 
                 id="product-category"
                 value={formData.category}
                 onChange={e => setFormData({...formData, category: e.target.value as any})}
                 className="form-select"
               >
                 <option value="beans">Beans</option>
                 <option value="equipment">Equipment</option>
                 <option value="merch">Merch</option>
                 <option value="subscription">Subscription</option>
               </select>
            </div>

            <div>
              <label htmlFor="product-plan" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Assign Ritual Plan</label>
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
              <p className="text-[11px] text-coffee-400 mt-2">This ritual will be linked to the selected plan. Use Plan Management to configure plans.</p>
            </div>
            
            <div>
              <label htmlFor="product-tags" className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Tags (comma separated)</label>
              <input
                id="product-tags"
                type="text"
                value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''}
                onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                className="form-control"
                placeholder="roast, single-origin, subscription"
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
                <span className="text-sm font-black uppercase tracking-widest italic text-espresso">Eligible for Ritual Subscription Protocol</span>
              </label>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 border-t border-espresso/10 flex flex-col sm:flex-row justify-end gap-4 sm:gap-6">
             <button type="button" onClick={onClose} className="px-6 w-full sm:w-auto sm:px-8 py-3 sm:py-4 font-black uppercase tracking-widest italic text-coffee-400 hover:text-espresso transition-colors">Cancel</button>
             <button disabled={loading} type="submit" className="btn-premium w-full sm:w-auto px-8 sm:px-10 md:px-12 py-3 sm:py-4 italic">
               {loading ? 'Committing...' : 'Commit Protocol'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
