'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJukeboxStore, Feedback } from '@/store/useJukeboxStore';

interface FeedbackModalProps {
  songId: string;
  songTitle: string;
  songArtist: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ songId, songTitle, songArtist, isOpen, onClose }: FeedbackModalProps) {
  const { feedback, addFeedback, getFeedback, updateFeedback, deleteFeedback } = useJukeboxStore();
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const songFeedback = feedback[songId] || [];

  useEffect(() => {
    if (isOpen && songId) {
      getFeedback(songId);
    }
  }, [isOpen, songId, getFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addFeedback(songId, comment.trim());
      setComment('');
    } catch (error) {
      console.error('Error adding feedback:', error);
      alert('Failed to add feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (feedbackItem: Feedback) => {
    setEditingId(feedbackItem.id);
    setEditComment(feedbackItem.comment);
  };

  const handleUpdate = async (id: string) => {
    if (!editComment.trim()) return;

    try {
      await updateFeedback(id, editComment.trim());
      setEditingId(null);
      setEditComment('');
      await getFeedback(songId);
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to update feedback');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await deleteFeedback(id);
      await getFeedback(songId);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                    Song Feedback
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {songTitle} by {songArtist}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-midnight-700/50 text-gray-400 hover:text-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Add Feedback Form */}
              <form onSubmit={handleSubmit} className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this song (e.g., 'too upbeat, doesn't fit the atmosphere')"
                  className="w-full p-4 rounded-xl bg-midnight-800/50 border border-midnight-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 resize-none"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{comment.length}/1000</span>
                  <button
                    type="submit"
                    disabled={!comment.trim() || isSubmitting}
                    className="px-4 py-2 rounded-xl bg-gold-400 text-midnight-900 font-semibold hover:bg-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>

              {/* Existing Feedback */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  All Feedback ({songFeedback.length})
                </h3>
                {songFeedback.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No feedback yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {songFeedback.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-midnight-800/50 border border-midnight-700"
                      >
                        {editingId === item.id ? (
                          <div>
                            <textarea
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className="w-full p-3 rounded-lg bg-midnight-900/50 border border-midnight-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400/50 resize-none mb-2"
                              rows={2}
                              maxLength={1000}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdate(item.id)}
                                className="px-3 py-1.5 rounded-lg bg-gold-400 text-midnight-900 text-sm font-semibold hover:bg-gold-500 transition-all"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditComment('');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-midnight-700 text-gray-300 text-sm font-semibold hover:bg-midnight-600 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-white mb-2">{item.comment}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatDate(item.created_at)}
                                {item.updated_at && item.updated_at !== item.created_at && ' (edited)'}
                              </span>
                              {item.is_own && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



