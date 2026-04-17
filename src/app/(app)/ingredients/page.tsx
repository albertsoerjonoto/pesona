'use client';

import { useState } from 'react';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { cn } from '@/lib/utils';

interface Ingredient {
  name: string;
  bahasa: string;
  category: string;
  description: string;
  benefits: string[];
  skinTypes: string[];
  caution?: string;
}

const INGREDIENTS: Ingredient[] = [
  {
    name: 'Niacinamide (Vitamin B3)',
    bahasa: 'Niasinamida',
    category: 'Brightening',
    description: 'Bahan multifungsi yang membantu mencerahkan kulit, mengecilkan pori, dan mengontrol minyak. Aman untuk hampir semua jenis kulit.',
    benefits: ['Mencerahkan kulit kusam', 'Mengecilkan pori', 'Mengontrol minyak', 'Membantu fade flek hitam'],
    skinTypes: ['oily', 'combination', 'normal', 'sensitive', 'dry'],
  },
  {
    name: 'Salicylic Acid (BHA)',
    bahasa: 'Asam Salisilat',
    category: 'Exfoliant',
    description: 'Exfoliant yang larut dalam minyak, bisa masuk ke dalam pori untuk membersihkan kotoran dan sel kulit mati. Bagus banget buat kulit berminyak dan berjerawat.',
    benefits: ['Membersihkan pori', 'Mengurangi breakout', 'Mengangkat sel kulit mati', 'Mengontrol minyak'],
    skinTypes: ['oily', 'combination'],
    caution: 'Mulai dari konsentrasi rendah (0.5-2%). Jangan pakai bareng AHA di waktu yang sama.',
  },
  {
    name: 'Hyaluronic Acid',
    bahasa: 'Asam Hialuronat',
    category: 'Hydration',
    description: 'Magnet kelembapan yang bisa menahan air hingga 1000x berat molekulnya. Bikin kulit plump dan terhidrasi.',
    benefits: ['Melembapkan intens', 'Bikin kulit plump', 'Mengurangi garis halus', 'Cocok untuk semua kulit'],
    skinTypes: ['oily', 'combination', 'normal', 'sensitive', 'dry'],
  },
  {
    name: 'Retinol (Vitamin A)',
    bahasa: 'Retinol',
    category: 'Anti-aging',
    description: 'Gold standard anti-aging. Membantu mempercepat regenerasi sel kulit dan meningkatkan produksi kolagen. Pakai di malam hari.',
    benefits: ['Anti-aging', 'Memperbaiki tekstur', 'Mengurangi garis halus', 'Membantu fade flek'],
    skinTypes: ['normal', 'combination', 'oily'],
    caution: 'Mulai 1-2x seminggu. WAJIB pakai sunscreen pagi. Hindari kalau hamil/menyusui.',
  },
  {
    name: 'Vitamin C (Ascorbic Acid)',
    bahasa: 'Vitamin C',
    category: 'Brightening',
    description: 'Antioksidan kuat yang melindungi kulit dari kerusakan akibat sinar UV dan polusi. Membantu mencerahkan dan meratakan warna kulit.',
    benefits: ['Mencerahkan kulit', 'Antioksidan', 'Meratakan warna kulit', 'Boost produksi kolagen'],
    skinTypes: ['normal', 'combination', 'oily', 'dry'],
    caution: 'Simpan di tempat sejuk dan gelap. Hindari pakai bareng niacinamide dalam 1 routine (kontroversial, tapi lebih aman dipisah).',
  },
  {
    name: 'Centella Asiatica',
    bahasa: 'Pegagan',
    category: 'Soothing',
    description: 'Bahan alami yang menenangkan kulit iritasi dan membantu memperbaiki skin barrier. Populer di produk CICA.',
    benefits: ['Menenangkan kulit', 'Memperbaiki skin barrier', 'Anti-inflamasi', 'Membantu penyembuhan'],
    skinTypes: ['sensitive', 'normal', 'combination', 'dry', 'oily'],
  },
  {
    name: 'Ceramide',
    bahasa: 'Seramida',
    category: 'Barrier Repair',
    description: 'Komponen alami skin barrier kamu. Membantu memperkuat lapisan pelindung kulit dan menjaga kelembapan.',
    benefits: ['Memperkuat skin barrier', 'Menjaga kelembapan', 'Mengurangi sensitivitas', 'Melindungi dari iritasi'],
    skinTypes: ['dry', 'sensitive', 'normal', 'combination', 'oily'],
  },
  {
    name: 'AHA (Glycolic/Lactic Acid)',
    bahasa: 'Asam Glikolat / Laktat',
    category: 'Exfoliant',
    description: 'Exfoliant permukaan kulit yang membantu mengangkat sel kulit mati. Glycolic acid lebih kuat, lactic acid lebih gentle.',
    benefits: ['Mengangkat sel kulit mati', 'Mencerahkan kulit kusam', 'Meratakan tekstur', 'Membantu penyerapan produk'],
    skinTypes: ['normal', 'combination', 'dry'],
    caution: 'Pakai sunscreen! Bisa bikin kulit lebih sensitif terhadap matahari. Mulai 1-2x seminggu.',
  },
  {
    name: 'Tea Tree Oil',
    bahasa: 'Minyak Tea Tree',
    category: 'Anti-breakout',
    description: 'Antibakteri alami yang membantu mengatasi breakout. Biasanya ada di produk spot treatment.',
    benefits: ['Antibakteri', 'Mengurangi breakout', 'Mengontrol minyak', 'Menenangkan kulit berjerawat'],
    skinTypes: ['oily', 'combination'],
    caution: 'Jangan pakai langsung tanpa dilute. Bisa iritasi kalau konsentrasi terlalu tinggi.',
  },
  {
    name: 'Zinc Oxide / Titanium Dioxide',
    bahasa: 'Seng Oksida / Titanium Dioksida',
    category: 'Sun Protection',
    description: 'Mineral sunscreen yang memantulkan sinar UV. Lebih gentle dari chemical sunscreen, cocok untuk kulit sensitif.',
    benefits: ['Proteksi UV fisik', 'Gentle untuk kulit sensitif', 'Tidak menyumbat pori', 'Efektif sejak diaplikasikan'],
    skinTypes: ['sensitive', 'normal', 'dry', 'combination', 'oily'],
    caution: 'Bisa meninggalkan white cast. Cari formula yang sudah micronized.',
  },
  {
    name: 'Snail Mucin',
    bahasa: 'Lendir Siput',
    category: 'Hydration',
    description: 'Bahan populer dari Korea yang kaya akan glikosaminoglikan. Membantu hidrasi dan memperbaiki tekstur kulit.',
    benefits: ['Melembapkan', 'Memperbaiki tekstur', 'Membantu penyembuhan', 'Antioksidan'],
    skinTypes: ['normal', 'combination', 'dry', 'sensitive'],
  },
  {
    name: 'Aloe Vera',
    bahasa: 'Lidah Buaya',
    category: 'Soothing',
    description: 'Bahan alami yang menenangkan dan melembapkan. Bagus untuk kulit yang habis terpapar matahari.',
    benefits: ['Menenangkan kulit', 'Melembapkan ringan', 'Mengurangi kemerahan', 'Cocok untuk after-sun'],
    skinTypes: ['sensitive', 'normal', 'combination', 'oily', 'dry'],
  },
  {
    name: 'Azelaic Acid',
    bahasa: 'Asam Azelaat',
    category: 'Brightening',
    description: 'Bahan multifungsi yang membantu mengatasi breakout dan flek hitam. Lebih gentle dari retinol.',
    benefits: ['Mengurangi breakout', 'Memudarkan flek hitam', 'Meratakan warna kulit', 'Anti-inflamasi'],
    skinTypes: ['oily', 'combination', 'sensitive', 'normal'],
  },
  {
    name: 'Panthenol (Vitamin B5)',
    bahasa: 'Panthenol',
    category: 'Soothing',
    description: 'Provitamin B5 yang membantu menjaga kelembapan dan memperbaiki skin barrier. Sangat gentle.',
    benefits: ['Melembapkan', 'Memperbaiki skin barrier', 'Menenangkan iritasi', 'Mempercepat penyembuhan'],
    skinTypes: ['sensitive', 'dry', 'normal', 'combination', 'oily'],
  },
  {
    name: 'Arbutin',
    bahasa: 'Arbutin',
    category: 'Brightening',
    description: 'Pencerah kulit yang bekerja dengan menghambat produksi melanin. Lebih aman dari hydroquinone.',
    benefits: ['Mencerahkan kulit', 'Memudarkan flek hitam', 'Meratakan warna kulit', 'Gentle untuk kulit sensitif'],
    skinTypes: ['normal', 'combination', 'dry', 'sensitive', 'oily'],
  },
];

const CATEGORIES = ['Semua', 'Brightening', 'Hydration', 'Exfoliant', 'Anti-aging', 'Soothing', 'Barrier Repair', 'Anti-breakout', 'Sun Protection'];

export default function IngredientsPage() {
  const { isExpanded } = useDesktopLayout();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const filtered = INGREDIENTS.filter(ing => {
    const matchesSearch = !search ||
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      ing.bahasa.toLowerCase().includes(search.toLowerCase()) ||
      ing.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || ing.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Brightening: 'bg-amber-500/10 text-amber-400',
      Hydration: 'bg-blue-500/10 text-blue-400',
      Exfoliant: 'bg-purple-500/10 text-purple-400',
      'Anti-aging': 'bg-rose-500/10 text-rose-400',
      Soothing: 'bg-emerald-500/10 text-emerald-400',
      'Barrier Repair': 'bg-teal-500/10 text-teal-400',
      'Anti-breakout': 'bg-orange-500/10 text-orange-400',
      'Sun Protection': 'bg-yellow-500/10 text-yellow-400',
    };
    return colors[cat] || 'bg-surface-secondary text-text-secondary';
  };

  return (
    <div className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg pb-4 -mx-4 px-4 pt-6">
        <h1 className="text-xl font-bold text-text-primary mb-3">Kamus Bahan Skincare</h1>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari bahan..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                activeCategory === cat
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface border border-border text-text-secondary'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-tertiary mb-4">{filtered.length} bahan ditemukan</p>

      {/* Ingredient list */}
      <div className="space-y-3">
        {filtered.map(ing => {
          const isOpen = expandedItem === ing.name;
          return (
            <button
              key={ing.name}
              onClick={() => setExpandedItem(isOpen ? null : ing.name)}
              className="w-full text-left bg-surface rounded-xl border border-border p-4 transition-all hover:border-accent-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{ing.name}</p>
                  <p className="text-xs text-text-tertiary">{ing.bahasa}</p>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', categoryColor(ing.category))}>
                  {ing.category}
                </span>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  <p className="text-xs text-text-secondary">{ing.description}</p>

                  <div>
                    <p className="text-xs font-medium text-text-primary mb-1">Manfaat:</p>
                    <div className="flex flex-wrap gap-1">
                      {ing.benefits.map((b, i) => (
                        <span key={i} className="text-[10px] bg-positive-surface text-positive-text px-2 py-0.5 rounded-full">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-text-primary mb-1">Cocok untuk:</p>
                    <div className="flex flex-wrap gap-1">
                      {ing.skinTypes.map(t => (
                        <span key={t} className="text-[10px] bg-info-surface text-info-text px-2 py-0.5 rounded-full capitalize">
                          {t === 'oily' ? 'Berminyak' : t === 'dry' ? 'Kering' : t === 'combination' ? 'Kombinasi' : t === 'sensitive' ? 'Sensitif' : 'Normal'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {ing.caution && (
                    <div className="bg-warning-surface rounded-lg p-2">
                      <p className="text-[10px] text-warning-text">
                        <span className="font-bold">Perhatian:</span> {ing.caution}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-text-muted text-center mt-6">
        Informasi ini untuk edukasi wellness. Konsultasikan ke dermatologist untuk saran spesifik.
      </p>
    </div>
  );
}
