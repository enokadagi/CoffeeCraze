import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, MailOpen, Trash2, Clock, Inbox, CheckCircle, Eye, Send } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/common/SEO';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import ConfirmDialog from '../../components/common/ConfirmDialog';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'contact_messages'));
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage));
      // Sort desc by createdAt
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(fetched);
    } catch (err) {
      console.error('Failed to fetch contact messages:', err);
      toast.error('Failed to load contact messages.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (msg: ContactMessage) => {
    try {
      const docRef = doc(db, 'contact_messages', msg.id);
      const newStatus = msg.status === 'read' ? 'unread' : 'read';
      await updateDoc(docRef, { status: newStatus });
      
      // Update local state
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: newStatus } : m));
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
      
      toast.success(newStatus === 'read' ? 'Message marked as read' : 'Message marked as unread');
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update message status.');
    }
  };

  const deleteMessage = (id: string) => setDeleteMsgId(id);

  const executeDeleteMessage = async () => {
    const id = deleteMsgId!;
    setDeleteMsgId(null);
    try {
      await deleteDoc(doc(db, 'contact_messages', id));
      toast.success('Message deleted');
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      toast.error('Failed to delete message.');
    }
  };

  const handleViewMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      // Automatically mark as read when viewing
      try {
        const docRef = doc(db, 'contact_messages', msg.id);
        await updateDoc(docRef, { status: 'read' });
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
        setSelectedMessage({ ...msg, status: 'read' });
      } catch (err) {
        console.error('Failed to auto-mark as read:', err);
      }
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    setSendingReply(true);
    try {
      const repliesRef = collection(db, 'contact_messages', selectedMessage.id, 'replies');
      await addDoc(repliesRef, {
        body: replyText.trim(),
        adminId: profile?.uid || 'unknown',
        adminName: profile?.displayName || 'Admin',
        createdAt: serverTimestamp(),
      });
      toast.success('Reply sent');
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <SEO title="Customer Messages" description="Manage customer contact form submissions" />

        <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-espresso/5 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-caramel mb-2">Customer Relations</p>
            <h1 className="text-h1 font-display font-bold text-espresso">Inbox</h1>
            <p className="text-sm text-text-muted mt-2">View and manage messages from contact forms</p>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted bg-cream px-4 py-2 rounded-full border border-border">
            {messages.filter(m => m.status === 'unread').length} Unread Messages
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-white animate-pulse rounded-2xl border border-espresso/5" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-espresso/5 shadow-premium">
            <Inbox className="mx-auto text-coffee-200 mb-4" size={48} strokeWidth={1} />
            <p className="text-text-secondary font-serif italic">Your inbox is completely clear.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Messages List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-border-light shadow-premium overflow-hidden">
                <div className="divide-y divide-coffee-50">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => handleViewMessage(msg)}
                      className={cn(
                        "p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-cream/50 transition-colors",
                        selectedMessage?.id === msg.id ? "bg-cream/50" : "",
                        msg.status === 'unread' ? "font-bold bg-cream/20" : ""
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          msg.status === 'unread' ? "bg-espresso text-white" : "bg-cream text-text-muted"
                        )}>
                          {msg.status === 'unread' ? <Mail size={16} /> : <MailOpen size={16} />}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h3 className="text-sm text-espresso truncate">{msg.name}</h3>
                          <p className="text-xs text-text-muted truncate">{msg.email}</p>
                          <p className="text-xs text-text-muted line-clamp-1 italic font-serif">"{msg.message}"</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">
                          {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(msg); }}
                            className="p-1.5 hover:bg-espresso/5 rounded-lg text-text-muted hover:text-espresso transition-colors"
                            title={msg.status === 'unread' ? "Mark as Read" : "Mark as Unread"}
                          >
                            <CheckCircle size={14} className={msg.status === 'read' ? 'text-green-600' : ''} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-text-muted hover:text-red-500 transition-colors"
                            title="Delete Message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Message Detail View */}
            <div className="lg:col-span-5">
              {selectedMessage ? (
                <div className="bg-white rounded-3xl border border-border-light p-6 sm:p-8 shadow-premium space-y-6 sticky top-24">
                  <div className="flex items-center justify-between border-b border-border-light pb-4">
                    <div>
                      <h2 className="text-base font-bold text-espresso">{selectedMessage.name}</h2>
                      <a href={`mailto:${selectedMessage.email}`} className="text-xs text-caramel font-bold tracking-tight hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(selectedMessage.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted pl-2">Customer Message</span>
                    <div className="bg-cream/40 border border-border-light p-5 rounded-2xl text-sm text-espresso font-serif italic leading-relaxed whitespace-pre-wrap">
                      "{selectedMessage.message}"
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted pl-2">
                      Reply
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-4 py-3 bg-cream/40 border border-border-light rounded-2xl text-sm text-espresso placeholder-coffee-300 focus:outline-none focus:ring-2 focus:ring-caramel/40 resize-none"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="w-full py-3 bg-espresso text-white font-bold rounded-full hover:bg-caramel hover:text-espresso transition-colors uppercase text-xs tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border-light">
                    <button
                      onClick={() => markAsRead(selectedMessage)}
                      className="flex-1 py-3 border border-coffee-200 text-text-secondary font-bold rounded-full hover:bg-cream transition-colors uppercase text-xs tracking-wider flex items-center justify-center gap-2"
                    >
                      {selectedMessage.status === 'unread' ? <MailOpen size={14} /> : <Mail size={14} />}
                      {selectedMessage.status === 'unread' ? 'Mark Read' : 'Mark Unread'}
                    </button>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="flex-1 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors uppercase text-xs tracking-[0.1em] shadow-premium flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-border-light p-8 shadow-premium text-center space-y-4 text-text-muted sticky top-24">
                  <Eye className="mx-auto" size={32} strokeWidth={1} />
                  <p className="text-sm font-serif italic">Select a message from the list to read its content.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteMsgId !== null}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action is permanent."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDeleteMessage}
        onCancel={() => setDeleteMsgId(null)}
      />
    </DashboardLayout>
  );
}
