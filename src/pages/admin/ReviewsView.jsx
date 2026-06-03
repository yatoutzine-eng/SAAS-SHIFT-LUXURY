import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, User, RefreshCw, Trash2, MessageCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

const StarDisplay = ({ value, size = 14 }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size} fill={i <= value ? GOLD : 'transparent'} stroke={i <= value ? GOLD : '#555'} />
    ))}
  </div>
);

export default function ReviewsView() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('reviews').select('*')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });
      setReviews(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet avis ?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    await loadReviews();
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingCounts = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0
  }));

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.rating === parseInt(filter));

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">
            Avis <span style={{ color: GOLD }}>Clients</span>
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {reviews.length} avis · {avgRating ? `Moyenne : ${avgRating}/5` : 'Aucune note'}
          </p>
        </div>
        <button onClick={loadReviews} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 border border-white/5 rounded-[2.5rem]">
          <MessageCircle size={40} className="text-zinc-700 mb-4" />
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Aucun avis</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase">Les avis apparaîtront ici dès que vos clients en laisseront</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Note moyenne */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3">Note moyenne</p>
              <span className="text-6xl font-black tracking-tighter mb-3" style={{ color: GOLD }}>{avgRating}</span>
              <StarDisplay value={Math.round(parseFloat(avgRating))} size={20} />
              <p className="text-zinc-600 text-[10px] font-bold uppercase mt-2">{reviews.length} avis</p>
            </div>

            {/* Répartition */}
            <div className="md:col-span-2 bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-5">Répartition</p>
              <div className="space-y-3">
                {ratingCounts.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 flex-shrink-0">
                      <span className="text-[11px] font-black text-zinc-400">{star}</span>
                      <Star size={11} fill={GOLD} stroke={GOLD} />
                    </div>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="h-full rounded-full" style={{ background: GOLD }} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 w-12 text-right">{count} ({pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-1 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 w-fit overflow-x-auto">
            {[['all', 'Tous'], ['5', '⭐⭐⭐⭐⭐'], ['4', '⭐⭐⭐⭐'], ['3', '⭐⭐⭐'], ['2', '⭐⭐'], ['1', '⭐']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === val ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(review => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 hover:border-[#D4AF37]/20 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={18} style={{ color: GOLD }} />
                    </div>
                    <div>
                      <p className="text-sm font-black">{review.client_name || 'Client'}</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase">
                        {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarDisplay value={review.rating} />
                    <button onClick={() => handleDelete(review.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-zinc-400 text-sm leading-relaxed">{review.comment}</p>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

