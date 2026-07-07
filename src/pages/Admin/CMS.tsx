import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Image, Type, Eye, EyeOff, RefreshCw, Plus, Trash2, HelpCircle, X } from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/common/SEO';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { logAdminAction } from '../../utils/auditLog';

interface ContentSection {
  id: string;
  key: string;
  title: string;
  subtitle?: string;
  body?: string;
  image?: string;
  ctaText?: string;
  ctaLink?: string;
  visible: boolean;
  order: number;
  type: 'hero' | 'banner' | 'text' | 'feature' | 'cta';
  updatedAt: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
  updatedAt: string;
}

type Tab = 'sections' | 'faq';

export default function AdminCMS() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('sections');
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [faqSaving, setFaqSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'faq' | 'section'; id: string } | null>(null);

  useEffect(() => {
    fetchContent();
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setFaqLoading(true);
    try {
      const snap = await getDocs(collection(db, 'faqs'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FAQItem));
      setFaqs(items.sort((a, b) => a.order - b.order));
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
      toast.error('Failed to load FAQs');
    } finally {
      setFaqLoading(false);
    }
  };

  const handleFaqSave = async () => {
    if (!editingFaq) return;
    setFaqSaving(true);
    try {
      const { id, ...data } = editingFaq;
      await setDoc(doc(db, 'faqs', id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      logAdminAction(user?.uid || '', user?.email || '', 'update_faq', 'faqs', id, { question: editingFaq.question });
      toast.success('FAQ updated');
      setEditingFaq(null);
      fetchFaqs();
    } catch (err) {
      toast.error('Failed to save FAQ');
    } finally {
      setFaqSaving(false);
    }
  };

  const addNewFaq = async () => {
    try {
      const ref = await addDoc(collection(db, 'faqs'), {
        question: 'New Question',
        answer: 'New answer',
        order: faqs.length + 1,
        visible: true,
        updatedAt: new Date().toISOString(),
      });
      toast.success('FAQ created');
      fetchFaqs();
    } catch (err) {
      toast.error('Failed to create FAQ');
    }
  };

  const deleteFaq = (id: string) => setDeleteTarget({ type: 'faq', id });

  const executeDeleteFaq = async () => {
    if (!deleteTarget || deleteTarget.type !== 'faq') return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteDoc(doc(db, 'faqs', id));
      logAdminAction(user?.uid || '', user?.email || '', 'delete_faq', 'faqs', id, {});
      toast.success('FAQ deleted');
      fetchFaqs();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'cms_content'));
      const content = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentSection));
      setSections(content.sort((a, b) => a.order - b.order));
    } catch (err) {
      console.error('Failed to fetch CMS content:', err);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingSection) return;
    setSaving(true);
    try {
      const { id, ...data } = editingSection;
      await setDoc(doc(db, 'cms_content', id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      logAdminAction(user?.uid || '', user?.email || '', 'update_cms_section', 'cms_content', id, { key: editingSection.key });
      toast.success('Content updated');
      setEditingSection(null);
      fetchContent();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSection) return;

    setUploading(true);
    try {
      const path = `cms/${editingSection.id}/${Date.now()}-${file.name}`;
      const sRef = storageRef(storage, path);
      const task = uploadBytesResumable(sRef, file);
      const url = await new Promise<string>((resolve, reject) => {
        task.on('state_changed', null, reject, async () => {
          resolve(await getDownloadURL(task.snapshot.ref));
        });
      });
      setEditingSection({ ...editingSection, image: url });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addNewSection = async () => {
    try {
      const ref = await addDoc(collection(db, 'cms_content'), {
        key: `section_${Date.now()}`,
        title: 'New Section',
        subtitle: '',
        body: '',
        image: '',
        ctaText: '',
        ctaLink: '',
        visible: true,
        order: sections.length + 1,
        type: 'text',
        updatedAt: new Date().toISOString(),
      });
      toast.success('New section created');
      fetchContent();
    } catch (err) {
      toast.error('Failed to create section');
    }
  };

  const deleteSection = (id: string) => setDeleteTarget({ type: 'section', id });

  const executeDeleteSection = async () => {
    if (!deleteTarget || deleteTarget.type !== 'section') return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteDoc(doc(db, 'cms_content', id));
      logAdminAction(user?.uid || '', user?.email || '', 'delete_cms_section', 'cms_content', id, {});
      toast.success('Section deleted');
      fetchContent();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const typeOptions = [
    { value: 'hero', label: 'Hero' },
    { value: 'banner', label: 'Banner' },
    { value: 'text', label: 'Text' },
    { value: 'feature', label: 'Feature' },
    { value: 'cta', label: 'CTA' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title="Content Management" description="Manage website content" />
        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-espresso/5 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Content Management</p>
            <h1 className="text-h1 font-display font-bold text-espresso">CMS</h1>
            <p className="text-sm text-text-muted mt-2">Manage website content and sections</p>
          </div>
          <button onClick={activeTab === 'sections' ? addNewSection : addNewFaq} className="btn btn-primary">
            <Plus size={16} /> Add {activeTab === 'sections' ? 'Section' : 'FAQ'}
          </button>
        </header>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-espresso/5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('sections')}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all',
              activeTab === 'sections'
                ? 'bg-white shadow-sm text-espresso'
                : 'text-text-muted hover:text-espresso'
            )}
          >
            Sections
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2',
              activeTab === 'faq'
                ? 'bg-white shadow-sm text-espresso'
                : 'text-text-muted hover:text-espresso'
            )}
          >
            <HelpCircle size={14} /> FAQ
          </button>
        </div>

        {activeTab === 'faq' ? (
          <>
            {faqLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-white animate-pulse rounded-2xl border border-espresso/5" />
                ))}
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-espresso/5">
                <p className="text-text-muted">No FAQs yet.</p>
                <button onClick={() => { setEditingFaq({ question: '', answer: '', order: faqs.length + 1, visible: true }); }} className="btn btn-primary px-6 py-3 text-xs mt-4">Add Your First FAQ</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {faqs.map((faq) => (
                  <motion.div
                    key={faq.id}
                    layout
                    className={cn(
                      "bg-white border rounded-2xl p-6 space-y-4 transition-all",
                      faq.visible ? "border-espresso/5" : "border-amber-200 bg-amber-50/30"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          faq.visible ? "bg-green-500" : "bg-amber-500"
                        )} />
                        <div className="min-w-0">
                          <h3 className="font-bold text-espresso text-sm truncate">{faq.question}</h3>
                          <p className="text-[11px] text-text-muted uppercase tracking-wider">FAQ  -  Order {faq.order}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setEditingFaq(faq)}
                          className="p-2 hover:bg-espresso/5 rounded-lg transition-colors"
                        >
                          <Type size={16} className="text-text-muted" />
                        </button>
                        <button
                          onClick={() => deleteFaq(faq.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2">{faq.answer}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'faqs', faq.id), { visible: !faq.visible });
                            fetchFaqs();
                          } catch (err) {
                            toast.error('Update failed');
                          }
                        }}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          faq.visible ? "text-green-600 hover:bg-green-50" : "text-text-muted hover:bg-espresso/5"
                        )}
                      >
                        {faq.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* FAQ Edit Modal */}
            {editingFaq && (
              <div className="fixed inset-0 bg-espresso/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-premium-xl max-h-[90vh] overflow-y-auto space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-espresso">Edit FAQ</h2>
                    <button onClick={() => setEditingFaq(null)} className="p-2 hover:bg-espresso/5 rounded-lg">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Question</label>
                    <input
                      value={editingFaq.question}
                      onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                      className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Answer</label>
                    <textarea
                      value={editingFaq.answer}
                      onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                      className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium resize-y"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Order</label>
                      <input
                        type="number"
                        value={editingFaq.order}
                        onChange={(e) => setEditingFaq({ ...editingFaq, order: Number(e.target.value) })}
                  className="w-32 px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingFaq.visible}
                          onChange={(e) => setEditingFaq({ ...editingFaq, visible: e.target.checked })}
                          className="w-4 h-4 accent-caramel"
                        />
                        <span className="text-sm font-semibold text-espresso">Visible</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-espresso/5">
                    <button
                      onClick={() => setEditingFaq(null)}
                      className="btn-outline flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFaqSave}
                      disabled={faqSaving}
                      className="btn btn-primary flex-1"
                    >
                      {faqSaving ? 'Saving...' : 'Save'}
                      <Save size={16} />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-white animate-pulse rounded-2xl border border-espresso/5" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-espresso/5">
            <p className="text-text-muted">No content sections yet.</p>
            <button onClick={addNewSection} className="btn btn-primary px-6 py-3 text-xs mt-4">Add Your First Section</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <motion.div
                key={section.id}
                layout
                className={cn(
                  "bg-white border rounded-2xl p-6 space-y-4 transition-all",
                  section.visible ? "border-espresso/5" : "border-amber-200 bg-amber-50/30"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      section.visible ? "bg-green-500" : "bg-amber-500"
                    )} />
                    <div>
                      <h3 className="font-bold text-espresso text-sm">{section.title || 'Untitled'}</h3>
                      <p className="text-[11px] text-text-muted uppercase tracking-wider">{section.type}  -  Order {section.order}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingSection(section)}
                      className="p-2 hover:bg-espresso/5 rounded-lg transition-colors"
                    >
                      <Type size={16} className="text-text-muted" />
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
                {section.subtitle && (
                  <p className="text-xs text-text-muted line-clamp-2">{section.subtitle}</p>
                )}
                {section.image && (
                  <ImageWithFallback src={section.image} alt={section.title} className="w-full h-32 object-cover rounded-xl" />
                )}
                <div className="flex items-center gap-3 text-xs">
                  {section.ctaText && (
                    <span className="px-3 py-1 bg-espresso/10 rounded-full font-bold text-espresso">{section.ctaText}</span>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'cms_content', section.id), { visible: !section.visible });
                        fetchContent();
                      } catch (err) {
                        toast.error('Update failed');
                      }
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      section.visible ? "text-green-600 hover:bg-green-50" : "text-text-muted hover:bg-espresso/5"
                    )}
                  >
                    {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingSection && (
          <div className="fixed inset-0 bg-espresso/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-premium-xl max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-espresso">Edit Section</h2>
                <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-espresso/5 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Section Key</label>
                  <input
                    value={editingSection.key}
                    onChange={(e) => setEditingSection({ ...editingSection, key: e.target.value })}
                    className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                    placeholder="section_key"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Type</label>
                  <select
                    value={editingSection.type}
                    onChange={(e) => setEditingSection({ ...editingSection, type: e.target.value as any })}
                    className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Title</label>
                <input
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Subtitle</label>
                <input
                  value={editingSection.subtitle || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                  className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Body Content</label>
                <textarea
                  value={editingSection.body || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, body: e.target.value })}
                  className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium resize-y"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">CTA Text</label>
                  <input
                    value={editingSection.ctaText || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, ctaText: e.target.value })}
                    className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                    placeholder="Learn More"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">CTA Link</label>
                  <input
                    value={editingSection.ctaLink || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, ctaLink: e.target.value })}
                    className="w-full px-5 py-4 bg-cream border border-espresso/10 rounded-2xl focus:bg-white focus:border-caramel-gold outline-none transition-all text-sm font-medium"
                    placeholder="/shop"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Order</label>
                <input
                  type="number"
                  value={editingSection.order}
                  onChange={(e) => setEditingSection({ ...editingSection, order: Number(e.target.value) })}
                  className="form-control w-32"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm"
                  />
                  {uploading && <RefreshCw size={16} className="animate-spin text-caramel" />}
                </div>
                {editingSection.image && (
                  <ImageWithFallback src={editingSection.image} alt="Preview" className="w-full h-40 object-cover rounded-xl mt-2 border border-espresso/5" />
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSection.visible}
                    onChange={(e) => setEditingSection({ ...editingSection, visible: e.target.checked })}
                    className="w-4 h-4 accent-caramel"
                  />
                  <span className="text-sm font-semibold text-espresso">Visible</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-espresso/5">
                <button
                  onClick={() => setEditingSection(null)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Saving...' : 'Save'}
                  <Save size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget?.type === 'faq' ? 'Delete FAQ' : 'Delete Section'}
        message={deleteTarget?.type === 'faq' ? 'Delete this FAQ?' : 'Delete this content section?'}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deleteTarget?.type === 'faq' ? executeDeleteFaq : executeDeleteSection}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
