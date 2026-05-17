import { useState, useEffect } from 'react';
import { ProductService } from '../../services/firestore';
import { Product } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { Package, Plus, Search, Edit2, Trash2, Tag, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { doc, deleteDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ProductFormModal from '../../components/admin/ProductFormModal';

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await ProductService.getAll();
    setProducts(data);
    setLoading(false);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success("Ritual updated");
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success("New Ritual committed");
      }
      fetchProducts();
    } catch (err) {
      toast.error("Failed to save Ritual");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this ritual?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success("Ritual removed from catalog");
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { isFeatured: !current });
      setProducts(products.map(p => p.id === id ? { ...p, isFeatured: !current } : p));
      toast.success("Featured status updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-16 relative">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-coffee-50 pb-16">
          <div className="space-y-4">
            <span className="stat-label text-gold-500 italic">Inventory Intelligence</span>
            <h1 className="text-7xl font-display font-black text-coffee-950 tracking-tightest leading-none italic uppercase">Supply <br/><span className="not-italic text-coffee-400">Vault.</span></h1>
            <p className="text-xl text-coffee-400 font-serif italic">Management of cellular sensory units and <span className="text-coffee-950 font-black not-italic uppercase">harvest</span> reserves.</p>
          </div>

          <button 
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="btn-premium px-12 py-6 italic text-xs uppercase shadow-gold-500/20 group animate-pulse hover:animate-none"
          >
            <Plus size={20} className="mr-4 group-hover:rotate-90 transition-transform duration-700" /> Commit New Ritual
          </button>
        </header>

        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="relative w-full max-w-xl group">
            <div className="absolute inset-0 bg-gold-500/5 blur-xl group-hover:bg-gold-500/10 transition-colors duration-1000 rounded-full" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input 
              type="text" 
              placeholder="Query by name or unit_SKU..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white border border-coffee-50 rounded-full focus:border-gold-500 focus:ring-0 outline-none transition-all duration-700 shadow-premium italic text-sm placeholder:text-coffee-200 relative z-10 uppercase font-black tracking-widest"
            />
          </div>

          <div className="flex items-center gap-6 relative z-10">
             <div className="px-6 py-3 bg-coffee-50 rounded-2xl flex items-center gap-4 border border-coffee-100 italic">
               <Package size={16} className="text-coffee-400" />
               <span className="text-[11px] font-black uppercase text-coffee-400 tracking-[0.3em]">Total_Units: {products.reduce((acc, p) => acc + p.stock, 0)}</span>
             </div>
          </div>
        </div>

        <div className="bg-white border border-coffee-50 rounded-[4rem] overflow-hidden shadow-premium-lg relative group">
          <div className="mesh-gradient absolute inset-0 opacity-[0.02] pointer-events-none transition-opacity duration-1000 group-hover:opacity-[0.05]" />
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-coffee-950/5 border-b border-coffee-50 font-display italic">
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Sensory_Ritual</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Vector_Class</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Node_Reserves</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Transfer_Value</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em]">Status_Node</th>
                  <th className="px-10 py-8 text-[11px] font-black text-coffee-400 uppercase tracking-[0.4em] text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-10 py-12 h-24 bg-white/50" />
                    </tr>
                  ))
                ) : filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-coffee-50/30 transition-all duration-700 group/row">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-8">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gold-500/20 blur-lg rounded-2xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-700" />
                          <img src={product.images[0]} className="w-16 h-16 rounded-2xl object-cover bg-coffee-50 shadow-premium relative z-10 transition-transform duration-700 group-hover/row:scale-110" />
                        </div>
                        <div>
                          <p className="font-display font-black text-coffee-950 italic text-xl leading-none uppercase tracking-tight">{product.name}</p>
                          <p className="text-[10px] font-black text-coffee-300 tracking-[0.4em] uppercase mt-2">UNIT_SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="px-4 py-2 bg-coffee-50 text-coffee-400 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] border border-coffee-100 italic transition-colors duration-700 group-hover/row:bg-coffee-950 group-hover/row:text-white group-hover/row:border-coffee-950">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className={cn("space-y-2", product.stock < 10 ? "text-red-500" : "text-coffee-600 group-hover/row:text-coffee-950")}>
                        <p className="font-display font-black italic text-2xl leading-none">{product.stock} <span className="text-xs uppercase font-black tracking-widest not-italic">Units</span></p>
                        {product.stock < 10 && (
                          <p className="text-[10px] items-center gap-2 flex uppercase font-black tracking-[0.3em] italic animate-pulse">
                            <Package size={12} className="fill-current" /> Critical_Depletion
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-display font-black text-coffee-950 italic text-2xl tracking-tighter uppercase whitespace-nowrap">
                        {formatPrice(product.price).split('LBP')[1]} <span className="text-[10px] font-black tracking-widest not-italic italic text-coffee-300">LBP_VAL</span>
                      </p>
                    </td>
                    <td className="px-10 py-8">
                      <button 
                        onClick={() => toggleFeatured(product.id, product.isFeatured)}
                        className={cn(
                          "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 italic border shadow-sm",
                          product.isFeatured ? 'bg-gold-500 text-white border-gold-400 shadow-gold-500/20' : 'bg-coffee-50 text-coffee-300 border-coffee-100 hover:border-coffee-300'
                        )}
                      >
                        {product.isFeatured ? 'Featured_NODE' : 'Standard_NODE'}
                      </button>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setShowModal(true);
                          }}
                          className="w-12 h-12 flex items-center justify-center text-coffee-400 hover:text-gold-500 hover:bg-white rounded-2xl transition-all duration-700 shadow-sm border border-transparent hover:border-coffee-100"
                        >
                          <Edit2 size={18} strokeWidth={1.5} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="w-12 h-12 flex items-center justify-center text-coffee-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-700 border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {showModal && (
        <ProductFormModal 
          product={editingProduct} 
          onClose={() => setShowModal(false)}
          onSave={handleSaveProduct}
        />
      )}
    </DashboardLayout>
  );
}
