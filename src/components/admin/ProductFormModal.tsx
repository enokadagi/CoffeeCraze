import React, { useState } from 'react';
import { Product } from '../../types';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
}

export default function ProductFormModal({ product, onClose, onSave }: ProductFormModalProps) {
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
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[3rem] w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="p-10 border-b border-espresso/10 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl">
          <h2 className="text-3xl font-display font-black uppercase italic tracking-tightest text-espresso">
            {product ? 'Modify Ritual' : 'Commit New Ritual'}
          </h2>
          <button onClick={onClose} className="p-3 bg-cream rounded-full hover:bg-caramel hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2">
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Ritual Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-cream border border-espresso/10 rounded-[2rem] px-6 py-4 italic font-black focus:border-caramel outline-none transition-colors"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Description</label>
              <textarea 
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-cream border border-espresso/10 rounded-[2rem] px-6 py-4 italic focus:border-caramel outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Price (USD)</label>
              <input 
                required
                type="number" step="0.01"
                value={formData.priceUsd}
                onChange={e => setFormData({...formData, priceUsd: Number(e.target.value)})}
                className="w-full bg-cream border border-espresso/10 rounded-[2rem] px-6 py-4 italic font-black focus:border-caramel outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Price (LBP)</label>
              <input 
                required
                type="number"
                value={formData.priceLbp || formData.price}
                onChange={e => setFormData({...formData, priceLbp: Number(e.target.value)})}
                className="w-full bg-cream border border-espresso/10 rounded-[2rem] px-6 py-4 italic font-black focus:border-caramel outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Inventory (Units)</label>
              <input 
                required
                type="number"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                className="w-full bg-cream border border-espresso/10 rounded-[2rem] px-6 py-4 italic font-black focus:border-caramel outline-none transition-colors"
              />
            </div>

            <div>
               <label className="block text-xs font-black uppercase tracking-[0.3em] text-coffee-400 mb-3 ml-4">Category</label>
               <select 
                 value={formData.category}
                 onChange={e => setFormData({...formData, category: e.target.value as any})}
                 className="w-full bg-cream border border-espresso/10 rounded-[2rem] px-6 py-4 italic font-black focus:border-caramel outline-none transition-colors"
               >
                 <option value="beans">Beans</option>
                 <option value="equipment">Equipment</option>
                 <option value="merch">Merch</option>
                 <option value="subscription">Subscription</option>
               </select>
            </div>
            
            <div className="col-span-2">
              <label className="flex items-center gap-4 cursor-pointer p-4 bg-cream rounded-[2rem] border border-espresso/10 hover:border-caramel transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.isSubscriptionEligible}
                  onChange={e => setFormData({...formData, isSubscriptionEligible: e.target.checked})}
                  className="w-6 h-6 accent-caramel"
                />
                <span className="text-sm font-black uppercase tracking-widest italic text-espresso">Eligible for Ritual Subscription Protocol</span>
              </label>
            </div>
          </div>

          <div className="pt-8 border-t border-espresso/10 flex justify-end gap-6">
             <button type="button" onClick={onClose} className="px-8 py-4 font-black uppercase tracking-widest italic text-coffee-400 hover:text-espresso transition-colors">Cancel</button>
             <button disabled={loading} type="submit" className="btn-premium px-12 py-4 italic">
               {loading ? 'Committing...' : 'Commit Protocol'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
