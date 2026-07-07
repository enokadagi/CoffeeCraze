import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash, ArrowRight, Search, Save, X, Image as ImageIcon, Star, Eye, EyeOff } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, deleteField } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/common/SEO';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import ConfirmDialog from '../../components/common/ConfirmDialog';

interface PlanForm {
  name: string;
  price: number;
  priceUsd: number;
  description: string;
  features: string;
  productIds: string[];
  frequency: string;
  isFeatured: boolean;
}

const emptyForm: PlanForm = {
  name: '',
  price: 0,
  priceUsd: 0,
  description: '',
  features: '',
  productIds: [],
  frequency: 'monthly',
  isFeatured: false,
};

export default function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [form, setForm] = useState<PlanForm>({ ...emptyForm });
  const [products, setProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansSnap, prodSnap] = await Promise.all([
        getDocs(collection(db, 'plans')),
        getDocs(collection(db, 'products')),
      ]);
      setPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = (file: File, planId: string) => {
    return new Promise<string>((resolve, reject) => {
      const storagePath = `plans/${planId}/${Date.now()}-${file.name}`;
      const sRef = storageRef(storage, storagePath);
      const uploadTask = uploadBytesResumable(sRef, file);
      setUploading(true);
      uploadTask.on('state_changed',
        (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
        (err) => { setUploading(false); setUploadProgress(0); reject(err); },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            setUploadProgress(0);
            resolve(url);
          } catch (e) { setUploading(false); setUploadProgress(0); reject(e); }
        }
      );
    });
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.price || Number(form.price) <= 0) return 'Price must be greater than zero';
    if (!form.description.trim()) return 'Description is required';
    if (!form.features.trim()) return 'At least one feature is required';
    if (selectedFile && !selectedFile.type.startsWith('image/')) return 'Please select a valid image file';
    return '';
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setSelectedFile(null);
    setImagePreview('');
    setValidationError('');
  };

  const handleCreate = async () => {
    const error = validate();
    if (error) { setValidationError(error); toast.error(error); return; }
    try {
      const payload: any = {
        name: form.name,
        price: Number(form.price),
        priceUsd: Number(form.priceUsd || 0),
        description: form.description,
        features: form.features.split(',').map(s => s.trim()),
        productIds: form.productIds || [],
        frequency: form.frequency,
        isFeatured: form.isFeatured,
        createdAt: new Date().toISOString()
      };
      const ref = await addDoc(collection(db, 'plans'), payload);
      if (selectedFile) {
        try {
          const url = await uploadImage(selectedFile, ref.id);
          await updateDoc(doc(db, 'plans', ref.id), { image: url });
        } catch (e) { toast.error('Image upload failed'); }
      }
      toast.success('Plan created');
      resetForm();
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error('Create failed'); }
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;
    const error = validate();
    if (error) { setValidationError(error); toast.error(error); return; }
    try {
      const payload: any = {
        name: form.name,
        price: Number(form.price),
        priceUsd: Number(form.priceUsd || 0),
        description: form.description,
        features: form.features.split(',').map(s => s.trim()),
        productIds: form.productIds || [],
        frequency: form.frequency,
        isFeatured: form.isFeatured,
      };
      if (selectedFile) {
        try { payload.image = await uploadImage(selectedFile, editingPlan.id); }
        catch (e) { toast.error('Image upload failed'); }
      }
      await updateDoc(doc(db, 'plans', editingPlan.id), payload);
      toast.success('Plan updated');
      resetForm();
      setShowModal(false);
      setEditingPlan(null);
      fetchData();
    } catch (err) { toast.error('Update failed'); }
  };

  const handleDelete = (id: string) => setDeletePlanId(id);

  const executeDeletePlan = async () => {
    const id = deletePlanId!;
    setDeletePlanId(null);
    try {
      await deleteDoc(doc(db, 'plans', id));
      toast.success('Plan deleted');
      fetchData();
    } catch (err) { toast.error('Delete failed'); }
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || '',
      price: plan.price || 0,
      priceUsd: plan.priceUsd || 0,
      description: plan.description || '',
      features: (plan.features || []).join(', '),
      productIds: plan.productIds || [],
      frequency: plan.frequency || 'monthly',
      isFeatured: plan.isFeatured || false,
    });
    setSelectedFile(null);
    setImagePreview('');
    setValidationError('');
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingPlan(null);
    resetForm();
    setShowModal(true);
  };

  const toggleFeatured = async (plan: any) => {
    try {
      await updateDoc(doc(db, 'plans', plan.id), { isFeatured: !plan.isFeatured });
      fetchData();
      toast.success(plan.isFeatured ? 'Unfeatured' : 'Featured');
    } catch (err) { toast.error('Failed'); }
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p: any) =>
      p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
  }, [productSearch, products]);

  return (
    <DashboardLayout>
      <SEO title="Plan Management" description="Create and manage subscription plans" />
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-espresso/5 pb-8">
          <div>
            <h1 className="text-h1 font-display font-bold text-espresso">Plan Management</h1>
            <p className="text-sm text-text-muted">Create, edit, and manage subscription plans and pricing</p>
          </div>
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> New Plan
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-white animate-pulse rounded-2xl border border-espresso/5" />
            ))
          ) : plans.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-espresso/5">
              <p className="text-text-muted">No plans yet. Create your first plan.</p>
            </div>
          ) : (
            plans.map(plan => (
              <motion.div
                key={plan.id}
                layout
                className="bg-white rounded-2xl border border-espresso/5 shadow-premium overflow-hidden group hover:shadow-premium-lg transition-all"
              >
                {plan.image && (
                  <div className="h-40 overflow-hidden">
                    <ImageWithFallback src={plan.image} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-espresso truncate">{plan.name}</h3>
                        {plan.isFeatured && <Star size={14} className="text-caramel fill-caramel shrink-0" />}
                      </div>
                      <p className="text-sm text-text-muted line-clamp-2 mt-1">{plan.description}</p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black text-espresso">
                        {plan.priceUsd ? `$${plan.priceUsd}` : `${(plan.price / 1000).toLocaleString()}K`}
                      </p>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">{plan.frequency}</p>
                    </div>
                    <span className="px-3 py-1 bg-espresso/5 rounded-full text-[11px] font-bold text-text-muted">
                      {(plan.productIds || []).length} products
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-text-muted flex-wrap">
                    <ArrowRight size={12} className="shrink-0" />
                    <span className="truncate">{(plan.features || []).join('  -  ')}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-espresso/5">
                    <button onClick={() => openEdit(plan)} className="flex-1 py-2 text-xs font-bold text-espresso bg-espresso/5 rounded-lg hover:bg-espresso/10 transition-colors">
                      <Edit size={14} className="inline mr-1" /> Edit
                    </button>
                    <button onClick={() => toggleFeatured(plan)} className="p-2 hover:bg-espresso/5 rounded-lg transition-colors">
                      {plan.isFeatured ? <EyeOff size={14} className="text-caramel" /> : <Eye size={14} className="text-text-muted" />}
                    </button>
                    <button onClick={() => handleDelete(plan.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-espresso/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-premium-xl max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-espresso">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
                <button onClick={() => { setShowModal(false); resetForm(); setEditingPlan(null); }} className="p-2 hover:bg-espresso/5 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              {validationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{validationError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Plan Name" className="form-control" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="form-select">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Price (LBP)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="form-control" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Price (USD)</label>
                  <input type="number" step="0.01" value={form.priceUsd} onChange={e => setForm(f => ({ ...f, priceUsd: Number(e.target.value) }))} className="form-control" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-textarea" rows={3} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Features (comma separated)</label>
                <input value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="Free shipping, Premium beans, etc." className="form-control" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Plan Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file) {
                      if (!file.type.startsWith('image/')) { toast.error('Invalid file type'); setSelectedFile(null); return; }
                      setImagePreview(URL.createObjectURL(file));
                    } else { setImagePreview(''); }
                  }}
                  className="text-sm"
                />
                {uploading && (
                  <div className="h-2 bg-espresso/10 rounded-full overflow-hidden">
                    <div className="h-full bg-caramel transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {(imagePreview || (editingPlan?.image)) && (
                  <ImageWithFallback src={imagePreview || editingPlan?.image} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-espresso/5" />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 accent-caramel" />
                  <span className="text-sm font-semibold text-espresso">Featured Plan</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Assign Products</label>
                <input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="form-control mb-2"
                />
                <div className="max-h-48 overflow-y-auto border border-espresso/10 rounded-2xl p-3 space-y-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">No products found</p>
                  ) : filteredProducts.map((p: any) => (
                    <label key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-espresso/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form.productIds || []).includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm(f => ({ ...f, productIds: [...(f.productIds || []), p.id] }));
                          } else {
                            setForm(f => ({ ...f, productIds: (f.productIds || []).filter(id => id !== p.id) }));
                          }
                        }}
                        className="w-4 h-4 accent-caramel"
                      />
                      <span className="text-sm font-semibold text-espresso">{p.name}</span>
                      <span className="text-xs text-text-muted ml-auto">{p.category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-espresso/5">
                <button onClick={() => { setShowModal(false); resetForm(); setEditingPlan(null); }} className="btn-outline flex-1">Cancel</button>
                <button onClick={editingPlan ? handleUpdate : handleCreate} disabled={uploading} className="btn btn-primary flex-1">
                  <Save size={16} /> {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deletePlanId !== null}
        title="Delete Plan"
        message="Delete this plan?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDeletePlan}
        onCancel={() => setDeletePlanId(null)}
      />
    </DashboardLayout>
  );
}
