import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash, ArrowRight, Search } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, deleteField } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/common/SEO';
import { toast } from 'sonner';

export default function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, description: '', features: '', productIds: [] as string[], frequency: 'monthly', isFeatured: false });
  const [products, setProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [planImageError, setPlanImageError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'plans'));
        setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
    // fetch products for linking
    (async () => {
      try {
        const prodSnap = await getDocs(collection(db, 'products'));
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Failed to fetch products:', e);
      }
    })();
  }, []);

  const uploadImage = (file: File, planId: string) => {
    return new Promise<string>((resolve, reject) => {
      const storagePath = `plans/${planId}/${Date.now()}-${file.name}`;
      const sRef = storageRef(storage, storagePath);
      const uploadTask = uploadBytesResumable(sRef, file);
      setUploading(true);
      uploadTask.on('state_changed', (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      }, (err) => {
        setUploading(false);
        setUploadProgress(0);
        reject(err);
      }, async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploading(false);
          setUploadProgress(0);
          resolve(url);
        } catch (e) {
          setUploading(false);
          setUploadProgress(0);
          reject(e);
        }
      });
    });
  };

  const validatePlan = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.price || Number(form.price) <= 0) return 'Price must be greater than zero';
    if (!form.description.trim()) return 'Description is required';
    if (!form.features.trim()) return 'At least one feature is required';
    if (selectedFile && !selectedFile.type.startsWith('image/')) return 'Please select a valid image file';
    return '';
  };

  const handleCreate = async (file?: File | null) => {
    const error = validatePlan();
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }
    try {
      const payload: any = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        features: form.features.split(',').map(s => s.trim()),
        productIds: form.productIds || [],
        frequency: form.frequency,
        isFeatured: form.isFeatured,
        createdAt: new Date().toISOString()
      };
      const ref = await addDoc(collection(db, 'plans'), payload);
      if (file) {
        try {
          const url = await uploadImage(file, ref.id);
          await updateDoc(doc(db, 'plans', ref.id), { image: url });
          payload.image = url;
        } catch (e) {
          console.error('Image upload failed', e);
          toast.error('Image upload failed');
        }
      }
      if (payload.productIds?.length) {
        await Promise.all(
          payload.productIds.map((productId: string) =>
            updateDoc(doc(db, 'products', productId), { planId: ref.id })
          )
        );
      }
      setPlans(prev => [{ id: ref.id, ...payload }, ...prev]);
      setForm({ name: '', price: 0, description: '', features: '', productIds: [], frequency: 'monthly', isFeatured: false });
      setSelectedFile(null);
      setImagePreview('');
      setValidationError('');
      setIsCreating(false);
      toast.success('Plan created');
    } catch (err) {
      console.error(err);
      toast.error('Create failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'plans', id));
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan removed');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || '',
      price: plan.price || 0,
      description: plan.description || '',
      features: (plan.features || []).join(', '),
      productIds: plan.productIds || [],
      frequency: plan.frequency || 'monthly',
      isFeatured: plan.isFeatured || false
    });
    setSelectedFile(null);
    setImagePreview('');
    setValidationError('');
    setPlanImageError('');
    setIsEditing(true);
  };

  const handleUpdate = async (planId: string, file?: File | null) => {
    const error = validatePlan();
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }
    try {
      const payload: any = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        features: form.features.split(',').map((s:any) => s.trim()),
        productIds: form.productIds || [],
        frequency: form.frequency,
        isFeatured: form.isFeatured
      };
      if (file) {
        try {
          const url = await uploadImage(file, planId);
          payload.image = url;
        } catch (e) {
          console.error('Image upload failed', e);
          toast.error('Image upload failed');
        }
      }
      await updateDoc(doc(db, 'plans', planId), payload);

      const previousProductIds = (editingPlan?.productIds || []) as string[];
      const currentProductIds = payload.productIds || [];

      const removedProductIds = previousProductIds.filter((id: string) => !currentProductIds.includes(id));
      const addedProductIds = currentProductIds.filter((id: string) => !previousProductIds.includes(id));

      await Promise.all([
        ...addedProductIds.map((productId: string) =>
          updateDoc(doc(db, 'products', productId), { planId })
        ),
        ...removedProductIds.map((productId: string) =>
          updateDoc(doc(db, 'products', productId), { planId: deleteField() })
        ),
      ]);

      setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...payload } : p));
      setIsEditing(false);
      setEditingPlan(null);
      setSelectedFile(null);
      setImagePreview('');
      setValidationError('');
      toast.success('Plan updated');
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  const filteredProducts = useMemo(() => {
    const query = productSearch.toLowerCase().trim();
    if (!query) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    );
  }, [productSearch, products]);

  return (
    <DashboardLayout>
      <SEO title="Plan Management" description="Create and manage subscription plans." />
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-fluid-heading font-display font-bold">Plan Management</h1>
            <p className="text-fluid-body text-coffee-500">Create, edit, and manage subscription plans and pricing.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-300" />
              <input
                id="plan-product-search"
                aria-label="Search products to assign"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products to assign..."
                className="w-full sm:w-80 pl-12 pr-4 py-3 rounded-full border border-coffee-100 bg-cream text-sm text-coffee-700 focus:border-caramel focus:outline-none transition"
              />
            </div>
            <button onClick={() => { setIsCreating(true); setValidationError(''); setPlanImageError(''); setSelectedFile(null); setImagePreview(''); }} className="btn-premium inline-flex items-center gap-2"><Plus size={16} /> New Plan</button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-cream rounded-2xl animate-pulse" />
            ))
          ) : (
            plans.map(plan => (
              <div key={plan.id} className="p-6 bg-white rounded-2xl border border-coffee-50 shadow-premium">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                    <p className="text-sm text-coffee-500 mt-2">{plan.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-fluid-title font-black">{(plan.price/1000).toLocaleString()}K</div>
                    <div className="flex gap-2">
                      <button aria-label="Edit plan" onClick={() => openEdit(plan)} className="btn-outline"><Edit size={14} /></button>
                      <button aria-label="Delete plan" onClick={() => handleDelete(plan.id)} className="btn-ghost"><Trash size={14} /></button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-coffee-500">
                  <ArrowRight size={12} />
                  <span>{plan.features?.join(' • ')}</span>
                </div>
                <div className="mt-3 text-[12px] text-coffee-500">Products assigned: <span className="font-black">{(plan.productIds || []).length}</span></div>
              </div>
            ))
          )}
        </section>

        {(isCreating || isEditing) && (
          <div className="fixed inset-0 bg-espresso/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-full sm:max-w-2xl p-4 sm:p-6 bg-white rounded-2xl shadow-premium relative">
              <h2 className="text-xl font-display font-bold mb-4">{isEditing ? 'Edit Plan' : 'Create Plan'}</h2>
              <div className="space-y-4">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="form-control" />
                <input value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="Price (LBP)" className="form-control" />
                <input value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="Features (comma separated)" className="form-control" />
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="form-textarea" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="plan-frequency" className="block text-sm font-medium mb-2">Plan Frequency</label>
                    <select
                      id="plan-frequency"
                      value={form.frequency}
                      onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                      className="form-select"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-3 mt-7">
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                        className="w-5 h-5 accent-caramel"
                      />
                      <span className="text-sm font-medium text-coffee-500">Featured Plan</span>
                    </label>
                  </div>
                  <div>
                    <label htmlFor="product-search" className="block text-sm font-medium mb-2">Assign Products</label>
                    <div className="mb-3">
                      <input
                        id="product-search"
                        aria-label="Search products for plan assignment"
                        type="text"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        className="w-full px-4 py-3 rounded-full border border-coffee-100 bg-white text-sm focus:border-caramel focus:outline-none transition"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto border rounded-3xl p-3 bg-cream space-y-2">
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-coffee-400 italic">No products match your search.</p>
                      ) : filteredProducts.map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-3 rounded-3xl transition-colors hover:bg-white/80 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(form.productIds || []).includes(p.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm(f => ({
                                ...f,
                                productIds: checked
                                  ? Array.from(new Set([...(f.productIds||[]), p.id]))
                                  : (f.productIds||[]).filter(id => id !== p.id),
                              }));
                            }}
                            className="w-4 h-4 accent-caramel"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-coffee-950 truncate">{p.name}</p>
                            <p className="text-[11px] text-coffee-500 truncate">{p.category} · {p.sku}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="plan-image" className="block text-sm font-medium mb-2">Plan Image</label>
                    <input
                      id="plan-image"
                      type="file"
                      accept="image/*"
                      className="w-full text-espresso"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        setPlanImageError('');
                        if (file) {
                          if (!file.type.startsWith('image/')) {
                            setPlanImageError('Invalid file type');
                            setSelectedFile(null);
                            setImagePreview('');
                            return;
                          }
                          const url = URL.createObjectURL(file);
                          setImagePreview(url);
                        } else {
                          setImagePreview('');
                        }
                      }}
                    />
                    <p className="text-[12px] text-coffee-500 mt-2">Optional image for plan cards.</p>
                    {planImageError && <p className="text-xs text-red-500 mt-2">{planImageError}</p>}
                    {(imagePreview || (isEditing && editingPlan?.image)) && (
                      <div className="mt-4 rounded-3xl overflow-hidden border border-coffee-100 bg-white">
                        <img src={imagePreview || editingPlan?.image} alt="Plan preview" className="w-full h-40 object-cover" />
                      </div>
                    )}
                    {uploading && (
                      <div className="mt-3 bg-coffee-50 rounded-full overflow-hidden">
                        <div className="h-2 bg-caramel transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {validationError && <div className="text-sm text-red-500 italic">{validationError}</div>}
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <button onClick={() => { setIsCreating(false); setIsEditing(false); setEditingPlan(null); setSelectedFile(null); setImagePreview(''); setValidationError(''); }} className="btn-outline w-full sm:w-auto">Cancel</button>
                <button onClick={async () => {
                  if (isEditing && editingPlan) {
                    await handleUpdate(editingPlan.id, selectedFile || null);
                  } else {
                    await handleCreate(selectedFile || null);
                  }
                }} className="btn-premium w-full sm:w-auto">{isEditing ? 'Save Changes' : 'Create'}</button>
              </div>
              {uploading && <div className="absolute inset-x-6 bottom-6 text-center text-sm">Uploading image...</div>}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
