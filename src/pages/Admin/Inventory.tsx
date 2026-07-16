import { useState, useEffect, useMemo } from 'react';
import { ProductService } from '../../services/firestore';
import { Product } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import {
  Package, Plus, Search, Edit2, Trash2, Tag, FileSpreadsheet, Download,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  Star, StarOff, CheckSquare, Square, Minus, AlertTriangle, Filter, X,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import SEO from '../../components/common/SEO';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { doc, deleteDoc, updateDoc, addDoc, collection, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import ProductFormModal from '../../components/admin/ProductFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { logAdminAction } from '../../utils/auditLog';

// ─── Types ──────────────────────────────────────────────────────────────────
type SortField = 'name' | 'category' | 'stock' | 'price' | 'rating';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const CATEGORIES = ['All', 'Coffee Beans', 'Ground Coffee', 'Capsules', 'Drip Bags', 'Gift Boxes', 'Brewing Equipment', 'Espresso Machines', 'Accessories', 'Syrups', 'Merchandise'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SortIcon = ({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) => {
  if (!active) return <ChevronsUpDown size={13} className="text-text-muted/50 group-hover:text-text-muted transition-colors" />;
  return dir === 'asc'
    ? <ChevronUp size={13} className="text-gold-500" />
    : <ChevronDown size={13} className="text-gold-500" />;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminInventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toolbar state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal / dialog
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Bulk operations
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Inline stock edit
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: 'stock' | 'price'; value: string } | null>(null);

  useEffect(() => { fetchProducts(); fetchPlans(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await ProductService.getAll();
    setProducts(data);
    setLoading(false);
  };

  const fetchPlans = async () => {
    try {
      const snap = await getDocs(collection(db, 'plans'));
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { /* silent */ }
  };

  // ── Sorting ────────────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  // ── Derived list ───────────────────────────────────────────────────────────
  const filteredSorted = useMemo(() => {
    let list = [...products];

    if (categoryFilter !== 'All') list = list.filter(p => p.category === categoryFilter);
    if (stockFilter === 'low') list = list.filter(p => p.stock > 0 && p.stock < 10);
    if (stockFilter === 'out') list = list.filter(p => p.stock === 0);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let va: any, vb: any;
      switch (sortField) {
        case 'name': va = a.name?.toLowerCase(); vb = b.name?.toLowerCase(); break;
        case 'category': va = a.category?.toLowerCase(); vb = b.category?.toLowerCase(); break;
        case 'stock': va = a.stock; vb = b.stock; break;
        case 'price': va = a.price; vb = b.price; break;
        case 'rating': va = a.rating || 0; vb = b.rating || 0; break;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, searchTerm, categoryFilter, sortField, sortDir, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const paginated = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((s, p) => s + (p.price * p.stock), 0),
  }), [products]);

  // ── Bulk selection ─────────────────────────────────────────────────────────
  const allPageSelected = paginated.length > 0 && paginated.every(p => selected.has(p.id));
  const toggleSelectAll = () => {
    if (allPageSelected) {
      const next = new Set(selected);
      paginated.forEach(p => next.delete(p.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      paginated.forEach(p => next.add(p.id));
      setSelected(next);
    }
  };
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const clearSelection = () => setSelected(new Set());

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    for (const id of selected) {
      const product = products.find(p => p.id === id);
      if (product?.planId) {
        await updateDoc(doc(db, 'plans', product.planId), { productIds: arrayRemove(id) });
      }
      await deleteDoc(doc(db, 'products', id));
      logAdminAction(user?.uid || '', user?.email || '', 'bulk_delete_product', 'products', id, { name: product?.name });
    }
    toast.success(`${selected.size} products deleted`);
    clearSelection();
    fetchProducts();
  };

  const handleBulkToggleFeatured = async (featured: boolean) => {
    for (const id of selected) {
      await updateDoc(doc(db, 'products', id), { isFeatured: featured });
    }
    setProducts(prev => prev.map(p => selected.has(p.id) ? { ...p, isFeatured: featured } : p));
    toast.success(`${selected.size} products ${featured ? 'featured' : 'unfeatured'}`);
    clearSelection();
  };

  // ── Inline edit ────────────────────────────────────────────────────────────
  const commitInlineEdit = async () => {
    if (!inlineEdit) return;
    const { id, field, value } = inlineEdit;
    const num = Number(value);
    if (isNaN(num) || num < 0) { toast.error('Invalid value'); return; }
    await updateDoc(doc(db, 'products', id), { [field]: num });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: num } : p));
    toast.success(`${field} updated`);
    setInlineEdit(null);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const previousPlanId = editingProduct?.planId;
      const newPlanId = productData.planId;
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        if (previousPlanId !== newPlanId) {
          if (previousPlanId) await updateDoc(doc(db, 'plans', previousPlanId), { productIds: arrayRemove(editingProduct.id) });
          if (newPlanId) await updateDoc(doc(db, 'plans', newPlanId), { productIds: arrayUnion(editingProduct.id) });
        }
        toast.success('Product updated');
      } else {
        const ref = await addDoc(collection(db, 'products'), productData);
        if (newPlanId) await updateDoc(doc(db, 'plans', newPlanId), { productIds: arrayUnion(ref.id) });
        toast.success('Product added');
      }
      await fetchProducts();
      await fetchPlans();
    } catch { toast.error('Failed to save product'); throw new Error('save failed'); }
  };

  const executeDelete = async () => {
    const id = confirmDeleteId!;
    setConfirmDeleteId(null);
    try {
      const product = products.find(p => p.id === id);
      if (product?.planId) await updateDoc(doc(db, 'plans', product.planId), { productIds: arrayRemove(id) });
      await deleteDoc(doc(db, 'products', id));
      logAdminAction(user?.uid || '', user?.email || '', 'delete_product', 'products', id, { name: product?.name });
      toast.success('Product removed');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch { toast.error('Failed to delete product'); }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'products', id), { isFeatured: !current });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isFeatured: !current } : p));
    logAdminAction(user?.uid || '', user?.email || '', 'toggle_featured', 'products', id, { newValue: !current });
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const parseInventoryFile = async (file: File): Promise<Partial<Product>[]> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'xlsx' || extension === 'xls') {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);
      return rows.map((item: any) => ({
        name: item.name || 'Untitled',
        description: item.description || '',
        category: item.category || 'beans',
        sku: item.sku || `PRD-${Math.floor(Math.random() * 100000)}`,
        price: Number(item.priceLbp || item.price || 0),
        priceUsd: Number(item.priceUsd || 0),
        priceLbp: Number(item.priceLbp || item.price || 0),
        wholesalePriceUsd: Number(item.wholesalePriceUsd || 0),
        wholesalePriceLbp: Number(item.wholesalePriceLbp || 0),
        stock: Number(item.stock || 0),
        planId: item.planId || '',
        tags: Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        images: Array.isArray(item.images) ? item.images : typeof item.images === 'string' ? item.images.split(',').map((i: string) => i.trim()).filter(Boolean) : ['https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80'],
        isSubscriptionEligible: item.isSubscriptionEligible === true || item.isSubscriptionEligible === 'true',
        rating: Number(item.rating || 0),
        reviewCount: Number(item.reviewCount || 0),
      }));
    }
    throw new Error('Only .xlsx/.xls files are supported for import');
  };

  const handleImportFile = async (file: File) => {
    setImportError('');
    setImporting(true);
    try {
      const rows = await parseInventoryFile(file);
      if (!rows.length) throw new Error('No rows found.');
      for (const row of rows) {
        await addDoc(collection(db, 'products'), {
          ...row,
          isFeatured: false,
          createdAt: new Date().toISOString(),
        });
      }
      toast.success(`${rows.length} products imported`);
      fetchProducts();
    } catch (err) {
      const msg = (err as Error).message || 'Import failed';
      setImportError(msg);
      toast.error(msg);
    } finally { setImporting(false); }
  };

  // ── Exports ────────────────────────────────────────────────────────────────
  const exportXLSX = () => {
    const rows = filteredSorted.map(p => ({
      Name: p.name, SKU: p.sku, Category: p.category,
      Stock: p.stock, PriceLBP: p.price, PriceUSD: p.priceUsd || '',
      Rating: p.rating || 0, Reviews: p.reviewCount || 0,
      Featured: p.isFeatured ? 'Yes' : 'No',
      Plan: plans.find(pl => pl.id === p.planId)?.name || '',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Inventory');
    XLSX.writeFile(wb, `coffeecraze-inventory-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Inventory exported');
  };

  const exportCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Stock', 'PriceLBP', 'PriceUSD', 'Rating', 'Featured', 'Plan'];
    const rows = filteredSorted.map(p => [
      `"${p.name}"`, p.sku || '', p.category, p.stock, p.price, p.priceUsd || '',
      p.rating || 0, p.isFeatured ? 'Yes' : 'No',
      `"${plans.find(pl => pl.id === p.planId)?.name || ''}"`,
    ].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coffeecraze-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const downloadTemplate = () => {
    const template = [{
      name: 'Example Product', description: 'Rich dark roast', category: 'beans', sku: 'PRD-001',
      priceLbp: 250000, priceUsd: 8, wholesalePriceLbp: 180000, wholesalePriceUsd: 6,
      stock: 50, tags: 'dark roast, premium', images: 'https://example.com/img.jpg',
      isSubscriptionEligible: true, planId: '', rating: 4.5, reviewCount: 12,
    }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(template), 'Products');
    XLSX.writeFile(wb, 'coffeecraze-product-template.xlsx');
    toast.success('Template downloaded');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <SEO title="Inventory" description="Manage CoffeeCraze product inventory, stock levels, and pricing." />

      <div className="space-y-6">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-border-light pb-8">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500 italic">Inventory Intelligence</span>
            <h1 className="text-5xl font-display font-black text-text leading-none italic uppercase">
              Supply <span className="not-italic text-text-muted">Vault.</span>
            </h1>
            <p className="text-sm text-text-muted">
              {stats.total} products &bull; {stats.inStock} in stock &bull;
              <span className={cn(stats.lowStock > 0 && 'text-amber-600 font-bold')}> {stats.lowStock} low stock</span>
              {stats.outOfStock > 0 && <span className="text-red-600 font-bold"> &bull; {stats.outOfStock} out of stock</span>}
            </p>
          </div>
          <button
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            className="btn btn-primary px-8 py-4 italic text-xs uppercase group flex items-center gap-2"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
            Add Product
          </button>
        </header>

        {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: stats.total, color: 'bg-coffee-50 border-coffee-200', icon: <Package size={16} className="text-coffee-700" /> },
            { label: 'In Stock', value: stats.inStock, color: 'bg-emerald-50 border-emerald-200', icon: <BarChart3 size={16} className="text-emerald-700" /> },
            { label: 'Low Stock', value: stats.lowStock, color: 'bg-amber-50 border-amber-200', icon: <AlertTriangle size={16} className="text-amber-600" /> },
            { label: 'Out of Stock', value: stats.outOfStock, color: 'bg-red-50 border-red-200', icon: <Minus size={16} className="text-red-600" /> },
          ].map(k => (
            <div key={k.label} className={cn('border rounded-2xl p-4 flex items-center gap-3', k.color)}>
              <div className="p-2 bg-white/60 rounded-xl">{k.icon}</div>
              <div>
                <p className="text-2xl font-black text-text leading-none">{k.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mt-0.5">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Row 1: Search + actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search name, SKU, category…"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm text-text focus:border-gold-400 focus:ring-0 outline-none transition-colors"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Stock filter */}
            <div className="flex items-center gap-1 p-1 bg-white border border-border rounded-xl">
              {(['all', 'low', 'out'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setStockFilter(f); setPage(1); }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                    stockFilter === f ? 'bg-espresso text-white' : 'text-text-muted hover:text-text'
                  )}
                >
                  {f === 'all' ? 'All Stock' : f === 'low' ? '⚠ Low' : '✗ Out'}
                </button>
              ))}
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Link to="/admin/plans" className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded-xl text-xs font-bold text-text-muted hover:text-gold-600 hover:border-gold-300 transition-all">
                <Tag size={14} /> Plans
              </Link>
              <label className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded-xl text-xs font-bold text-text-muted hover:text-gold-600 hover:border-gold-300 transition-all cursor-pointer">
                <FileSpreadsheet size={14} /> {importing ? 'Importing…' : 'Import'}
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { handleImportFile(f); e.target.value = ''; } }} />
              </label>
              <button onClick={exportXLSX} className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded-xl text-xs font-bold text-text-muted hover:text-gold-600 hover:border-gold-300 transition-all">
                <Download size={14} /> XLSX
              </button>
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded-xl text-xs font-bold text-text-muted hover:text-gold-600 hover:border-gold-300 transition-all">
                <Download size={14} /> CSV
              </button>
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded-xl text-xs font-bold text-text-muted hover:text-gold-600 hover:border-gold-300 transition-all">
                Template
              </button>
            </div>
          </div>

          {/* Row 2: Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setPage(1); }}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all',
                  categoryFilter === cat
                    ? 'bg-espresso text-white border-espresso'
                    : 'bg-white border-border text-text-muted hover:border-espresso/40 hover:text-espresso'
                )}
              >
                {cat === 'All' ? `All (${products.length})` : `${cat} (${products.filter(p => p.category === cat).length})`}
              </button>
            ))}
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-espresso/5 border border-espresso/15 rounded-xl">
              <span className="text-xs font-black text-espresso uppercase tracking-widest">{selected.size} selected</span>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => handleBulkToggleFeatured(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-50 border border-gold-200 text-gold-700 rounded-lg text-xs font-bold hover:bg-gold-100 transition-colors">
                  <Star size={12} /> Feature
                </button>
                <button onClick={() => handleBulkToggleFeatured(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border text-text-muted rounded-lg text-xs font-bold hover:text-text transition-colors">
                  <StarOff size={12} /> Unfeature
                </button>
                <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                  <Trash2 size={12} /> Delete
                </button>
                <button onClick={clearSelection} className="p-1.5 text-text-muted hover:text-text transition-colors"><X size={14} /></button>
              </div>
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              <AlertTriangle size={14} /> {importError}
              <button onClick={() => setImportError('')} className="ml-auto"><X size={14} /></button>
            </div>
          )}
        </div>

        {/* ── Data Table ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-coffee-950/3 border-b border-border">
                <tr>
                  {/* Checkbox */}
                  <th className="pl-5 pr-2 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-text-muted hover:text-espresso transition-colors">
                      {allPageSelected ? <CheckSquare size={16} className="text-espresso" /> : <Square size={16} />}
                    </button>
                  </th>

                  {/* Product col */}
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-text-muted">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 group">
                      Product <SortIcon field="name" active={sortField === 'name'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-text-muted">
                    <button onClick={() => handleSort('category')} className="flex items-center gap-1.5 group">
                      Category <SortIcon field="category" active={sortField === 'category'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-text-muted">
                    <button onClick={() => handleSort('stock')} className="flex items-center gap-1.5 group">
                      Stock <SortIcon field="stock" active={sortField === 'stock'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-text-muted">
                    <button onClick={() => handleSort('price')} className="flex items-center gap-1.5 group">
                      Price <SortIcon field="price" active={sortField === 'price'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-text-muted">Plan</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-text-muted">Status</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-text-muted text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-4 py-5"><div className="h-10 bg-cream animate-pulse rounded-xl" /></td></tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-text-muted italic text-sm">
                      <Package size={40} className="mx-auto mb-3 text-coffee-200" />
                      {searchTerm || categoryFilter !== 'All' ? 'No products match your filters.' : 'No products yet. Click "Add Product" to get started.'}
                    </td>
                  </tr>
                ) : paginated.map(product => (
                  <tr
                    key={product.id}
                    className={cn(
                      'group/row hover:bg-cream/30 transition-all duration-300',
                      selected.has(product.id) && 'bg-gold-50/50'
                    )}
                  >
                    {/* Checkbox */}
                    <td className="pl-5 pr-2 py-3.5">
                      <button onClick={() => toggleSelect(product.id)} className="text-text-muted hover:text-espresso transition-colors">
                        {selected.has(product.id) ? <CheckSquare size={16} className="text-gold-500" /> : <Square size={16} />}
                      </button>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-gold-500/15 blur-md rounded-xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />
                          <ImageWithFallback
                            src={product.images?.[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-cream relative z-10 group-hover/row:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-espresso text-sm truncate max-w-[200px]">{product.name}</p>
                          <p className="text-[10px] text-text-muted font-mono mt-0.5">{product.sku || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 bg-cream text-text-muted rounded-lg text-[10px] font-black uppercase tracking-widest border border-border">
                        {product.category}
                      </span>
                    </td>

                    {/* Stock — inline editable */}
                    <td className="px-4 py-3.5">
                      {inlineEdit?.id === product.id && inlineEdit.field === 'stock' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={inlineEdit.value}
                            autoFocus
                            onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                            onBlur={commitInlineEdit}
                            onKeyDown={e => { if (e.key === 'Enter') commitInlineEdit(); if (e.key === 'Escape') setInlineEdit(null); }}
                            className="w-20 px-2 py-1 border border-espresso/30 rounded-lg text-sm font-bold text-espresso focus:outline-none focus:border-gold-400"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setInlineEdit({ id: product.id, field: 'stock', value: String(product.stock) })}
                          className={cn(
                            'flex items-center gap-1.5 text-sm font-bold hover:underline transition-colors',
                            product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-amber-600' : 'text-espresso'
                          )}
                          title="Click to edit stock"
                        >
                          {product.stock}
                          {product.stock === 0 && <AlertTriangle size={12} />}
                          {product.stock > 0 && product.stock < 10 && <AlertTriangle size={12} />}
                        </button>
                      )}
                    </td>

                    {/* Price — inline editable */}
                    <td className="px-4 py-3.5">
                      {inlineEdit?.id === product.id && inlineEdit.field === 'price' ? (
                        <input
                          type="number"
                          min="0"
                          value={inlineEdit.value}
                          autoFocus
                          onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                          onBlur={commitInlineEdit}
                          onKeyDown={e => { if (e.key === 'Enter') commitInlineEdit(); if (e.key === 'Escape') setInlineEdit(null); }}
                          className="w-28 px-2 py-1 border border-espresso/30 rounded-lg text-sm font-bold text-espresso focus:outline-none focus:border-gold-400"
                        />
                      ) : (
                        <button
                          onClick={() => setInlineEdit({ id: product.id, field: 'price', value: String(product.price) })}
                          className="text-sm font-bold text-espresso hover:underline transition-colors"
                          title="Click to edit price"
                        >
                          {(product.price || 0).toLocaleString()} LBP
                        </button>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5 text-xs font-semibold text-text-muted">
                      {plans.find(pl => pl.id === product.planId)?.name || <span className="text-text-muted/50 italic">—</span>}
                    </td>

                    {/* Status / Featured toggle */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleFeatured(product.id, product.isFeatured)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all',
                          product.isFeatured
                            ? 'bg-gold-500 text-white border-gold-400'
                            : 'bg-cream text-text-muted border-border hover:border-gold-300'
                        )}
                      >
                        {product.isFeatured ? <Star size={10} className="fill-white" /> : <StarOff size={10} />}
                        {product.isFeatured ? 'Featured' : 'Standard'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button
                          aria-label="Edit product"
                          onClick={() => { setEditingProduct(product); setShowModal(true); }}
                          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-gold-500 hover:bg-cream rounded-lg transition-all border border-transparent hover:border-border"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          aria-label="Delete product"
                          onClick={() => setConfirmDeleteId(product.id)}
                          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 p-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-36 bg-cream animate-pulse rounded-2xl" />)
            ) : paginated.length === 0 ? (
              <div className="py-12 text-center text-text-muted italic text-sm">
                <Package size={36} className="mx-auto mb-3 text-coffee-200" />
                No products found.
              </div>
            ) : paginated.map(product => (
              <div key={product.id} className={cn('bg-cream rounded-2xl p-4 border border-border space-y-3', selected.has(product.id) && 'border-gold-300 bg-gold-50/30')}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleSelect(product.id)} className="mt-1 text-text-muted hover:text-gold-500 transition-colors flex-shrink-0">
                    {selected.has(product.id) ? <CheckSquare size={16} className="text-gold-500" /> : <Square size={16} />}
                  </button>
                  <ImageWithFallback src={product.images?.[0]} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-cream flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-espresso truncate">{product.name}</p>
                    <p className="text-[10px] text-text-muted font-mono">{product.sku}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-white border border-border rounded-full text-[9px] font-black uppercase tracking-wider text-text-muted">{product.category}</span>
                      {product.stock < 10 && <span className="text-[9px] text-amber-600 font-bold flex items-center gap-1"><AlertTriangle size={9} />{product.stock === 0 ? 'Out' : 'Low'}</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-text-muted block text-[9px] uppercase tracking-wider font-bold">Stock</span><span className={cn('font-black', product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-amber-600' : 'text-espresso')}>{product.stock}</span></div>
                  <div><span className="text-text-muted block text-[9px] uppercase tracking-wider font-bold">Price</span><span className="font-black text-espresso">{(product.price || 0).toLocaleString()} LBP</span></div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => toggleFeatured(product.id, product.isFeatured)} className={cn('px-3 py-1.5 rounded-full text-[9px] font-black uppercase border', product.isFeatured ? 'bg-gold-500 text-white border-gold-400' : 'bg-cream text-text-muted border-border')}>
                    {product.isFeatured ? '★ Featured' : 'Standard'}
                  </button>
                  <div className="flex gap-2">
                    <button aria-label="Edit" onClick={() => { setEditingProduct(product); setShowModal(true); }} className="p-2 bg-white border border-border rounded-xl text-text-muted hover:text-gold-500 transition-colors"><Edit2 size={14} /></button>
                    <button aria-label="Delete" onClick={() => setConfirmDeleteId(product.id)} className="p-2 bg-white border border-border rounded-xl text-text-muted hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination Footer ───────────────────────────────────────────── */}
          {!loading && filteredSorted.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-border bg-cream/30">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="px-2 py-1 bg-white border border-border rounded-lg text-xs font-bold text-espresso focus:outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredSorted.length)} of {filteredSorted.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-text-muted hover:text-espresso hover:bg-white disabled:opacity-30 transition-all border border-transparent hover:border-border"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-bold transition-all',
                        page === p ? 'bg-espresso text-white' : 'text-text-muted hover:bg-white hover:text-espresso border border-transparent hover:border-border'
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-text-muted hover:text-espresso hover:bg-white disabled:opacity-30 transition-all border border-transparent hover:border-border"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showModal && (
        <ProductFormModal
          product={editingProduct}
          plans={plans}
          onClose={() => setShowModal(false)}
          onSave={handleSaveProduct}
        />
      )}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Remove Product"
        message="Are you sure you want to remove this product from the catalog? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </DashboardLayout>
  );
}
