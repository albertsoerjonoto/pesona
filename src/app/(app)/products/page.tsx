'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { cn } from '@/lib/utils';
import type { Product, ProductCategory, SkinType } from '@/lib/types';

const CATEGORIES: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'cleanser', label: 'Cleanser' },
  { value: 'toner', label: 'Toner' },
  { value: 'serum', label: 'Serum' },
  { value: 'moisturizer', label: 'Moisturizer' },
  { value: 'sunscreen', label: 'Sunscreen' },
  { value: 'exfoliator', label: 'Exfoliator' },
  { value: 'mask', label: 'Mask' },
  { value: 'spot_treatment', label: 'Spot Treatment' },
  { value: 'eye_cream', label: 'Eye Cream' },
  { value: 'lip_care', label: 'Lip Care' },
];

const SKIN_FILTERS: { value: SkinType | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Kulit' },
  { value: 'oily', label: 'Berminyak' },
  { value: 'dry', label: 'Kering' },
  { value: 'combination', label: 'Kombinasi' },
  { value: 'sensitive', label: 'Sensitif' },
  { value: 'normal', label: 'Normal' },
];

function formatPrice(price: number | null) {
  if (!price) return '';
  return 'Rp ' + price.toLocaleString('id-ID');
}

export default function ProductsPage() {
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [skinFilter, setSkinFilter] = useState<SkinType | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('brand', { ascending: true })
        .order('name', { ascending: true });

      if (data) setProducts(data as unknown as Product[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = products.filter(p => {
    if (category !== 'all' && p.category !== category) return false;
    if (skinFilter !== 'all' && !p.suitable_skin_types.includes(skinFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q) && !p.key_ingredients.some(i => i.toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg pb-3 -mx-4 px-4 pt-6">
        <h1 className="text-xl font-bold text-text-primary mb-3">{t('product.title')}</h1>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('product.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-border-strong text-sm focus:outline-none focus:ring-1 focus:ring-input-ring"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                category === c.value
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface border border-border-strong text-text-secondary'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skin type filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4 mt-2">
        {SKIN_FILTERS.map(s => (
          <button
            key={s.value}
            onClick={() => setSkinFilter(s.value)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
              skinFilter === s.value
                ? 'bg-accent-surface text-accent-text border border-accent-border'
                : 'text-text-tertiary border border-border'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-text-tertiary mb-3">{filtered.length} {t('product.resultsCount')}</p>

      {/* Product grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-text-secondary">{t('product.noMatch')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(product => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="w-full bg-surface rounded-xl p-3 border border-border hover:border-accent-border transition-all text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{product.name}</p>
                  <p className="text-xs text-text-secondary">{product.brand}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-accent-text">{formatPrice(product.price_idr)}</span>
                    {product.halal_certified && <span className="text-[10px] bg-positive-surface text-positive-text px-1.5 py-0.5 rounded">Halal</span>}
                    {product.bpom_registered && <span className="text-[10px] bg-accent-surface text-accent-text px-1.5 py-0.5 rounded">BPOM</span>}
                  </div>
                </div>
                <span className="text-xs text-text-tertiary capitalize bg-surface-secondary px-2 py-1 rounded-lg shrink-0">
                  {product.category.replace('_', ' ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-overlay-dialog flex items-end sm:items-center justify-center"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-bg rounded-t-2xl sm:rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto animate-slide-up safe-area-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{selectedProduct.name}</h2>
                  <p className="text-sm text-text-secondary">{selectedProduct.brand}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-text-tertiary p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Price + badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-accent-text">{formatPrice(selectedProduct.price_idr)}</span>
                {selectedProduct.halal_certified && <span className="text-xs bg-positive-surface text-positive-text px-2 py-0.5 rounded-full font-medium">☪️ {t('product.halal')}</span>}
                {selectedProduct.bpom_registered && <span className="text-xs bg-accent-surface text-accent-text px-2 py-0.5 rounded-full font-medium">✓ {t('product.bpom')}</span>}
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{selectedProduct.description}</p>
              )}

              {/* How to use */}
              {selectedProduct.how_to_use && (
                <div className="bg-surface rounded-xl p-3 mb-4">
                  <p className="text-xs font-semibold text-text-label mb-1">{t('product.howToUse')}</p>
                  <p className="text-xs text-text-secondary">{selectedProduct.how_to_use}</p>
                </div>
              )}

              {/* Key ingredients */}
              {selectedProduct.key_ingredients.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-text-label mb-2">{t('product.ingredients')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.key_ingredients.map((ing, i) => (
                      <span key={i} className="px-2 py-1 bg-surface-secondary rounded-lg text-xs text-text-secondary">{ing}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suitable skin types */}
              {selectedProduct.suitable_skin_types.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-text-label mb-2">{t('product.suitableFor')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.suitable_skin_types.map((st, i) => (
                      <span key={i} className="px-2 py-1 bg-accent-surface text-accent-text rounded-lg text-xs capitalize">{t(`skin.type.${st}`)}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Concerns addressed */}
              {selectedProduct.addresses_concerns.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-text-label mb-2">{t('product.helpsFor')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.addresses_concerns.map((c, i) => (
                      <span key={i} className="px-2 py-1 bg-positive-surface text-positive-text rounded-lg text-xs">{t(`skin.concern.${c}`)}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Buy button */}
              {selectedProduct.shopee_url && (
                <a
                  href={selectedProduct.shopee_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-accent text-accent-fg font-semibold rounded-xl text-center text-sm hover:bg-accent-hover transition-all active:scale-[0.98]"
                >
                  🛒 {t('product.buyShopee')}
                </a>
              )}

              <button
                onClick={() => setSelectedProduct(null)}
                className="block w-full mt-2 py-2.5 text-text-secondary font-medium rounded-xl text-center text-sm"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
