-- Second batch of Indonesian skincare products (45 additions)
-- Extends the 155 seeded in migration 106 — brings total to ~200

INSERT INTO public.products (name, brand, category, suitable_skin_types, addresses_concerns, key_ingredients, price_idr, shopee_url, tiktok_shop_url, image_url, bpom_registered, halal_certified, description, how_to_use, rating_avg) VALUES
-- Skintific expansion
('Mugwort Acne Clay Stick', 'Skintific', 'mask', ARRAY['oily','combination','sensitive'], ARRAY['acne','redness','large_pores'], ARRAY['mugwort','kaolin','centella'], 89000, 'https://shopee.co.id/skintific-mugwort-stick', NULL, NULL, true, true, 'Clay mask stick praktis, langsung dioles ke spot breakout. Mugwort bantu tenangin kulit.', 'Oles tipis di area bermasalah, diamkan 10 menit, bilas dengan air dingin.', 4.6),
('Ceramide Sleeping Mask', 'Skintific', 'mask', ARRAY['dry','normal','sensitive'], ARRAY['dullness','aging'], ARRAY['ceramide','hyaluronic_acid','peptide'], 109000, 'https://shopee.co.id/skintific-sleeping-mask', NULL, NULL, true, true, 'Sleeping mask yang bikin kulit bangun lebih plump dan glowing.', 'Pakai sebagai step terakhir malam hari. Tidak perlu dibilas.', 4.7),
('Vitamin C Brightening Toner', 'Skintific', 'toner', ARRAY['normal','combination','oily'], ARRAY['dullness','dark_spots'], ARRAY['vitamin_c','niacinamide'], 79000, 'https://shopee.co.id/skintific-vitc-toner', NULL, NULL, true, true, 'Toner vitamin C gentle buat daily use. Mencerahkan pelan-pelan.', 'Pagi atau malam, setelah cleansing. Tepuk-tepuk lembut sampai meresap.', 4.5),

-- Somethinc expansion
('Bakuchiol Anti-Aging Serum', 'Somethinc', 'serum', ARRAY['normal','dry','sensitive'], ARRAY['aging','dullness'], ARRAY['bakuchiol','squalane'], 169000, 'https://shopee.co.id/somethinc-bakuchiol', NULL, NULL, true, true, 'Alternative retinol yang gentler — cocok buat yang sensitif atau pemula.', 'Malam hari setelah toner. 2-3 tetes, pijat lembut.', 4.6),
('Green Tea Calming Essence', 'Somethinc', 'serum', ARRAY['sensitive','oily','combination'], ARRAY['redness','acne'], ARRAY['green_tea','panthenol'], 109000, 'https://shopee.co.id/somethinc-greentea', NULL, NULL, true, true, 'Essence ringan yang bantu tenangin kulit lagi iritasi atau breakout.', 'Pagi dan malam setelah cleansing. Tepuk lembut.', 4.7),
('Copper Peptide Repair Cream', 'Somethinc', 'moisturizer', ARRAY['dry','normal','sensitive'], ARRAY['aging','dullness'], ARRAY['copper_peptide','ceramide','hyaluronic_acid'], 189000, 'https://shopee.co.id/somethinc-copper', NULL, NULL, true, true, 'Night cream dengan copper peptide untuk anti-aging dan firm skin.', 'Malam hari sebagai moisturizer terakhir.', 4.5),

-- Wardah expansion
('Acnederm Liquid Soap', 'Wardah', 'cleanser', ARRAY['oily','combination'], ARRAY['acne','large_pores'], ARRAY['salicylic_acid','tea_tree'], 29000, 'https://shopee.co.id/wardah-acnederm', NULL, NULL, true, true, 'Sabun muka untuk kulit berjerawat. Affordable dan halal.', 'Pagi dan malam. Busakan di telapak tangan, aplikasikan ke wajah basah.', 4.4),
('Lightening Day Cream SPF 30', 'Wardah', 'sunscreen', ARRAY['normal','combination'], ARRAY['dark_spots','dullness'], ARRAY['niacinamide','vitamin_b3'], 39000, 'https://shopee.co.id/wardah-lightening', NULL, NULL, true, true, 'Day cream dengan SPF — praktis 2-in-1. Halal certified.', 'Pagi sebagai moisturizer + sunscreen.', 4.3),
('Crystal Secret Renewing Serum', 'Wardah', 'serum', ARRAY['dry','normal'], ARRAY['aging','dullness'], ARRAY['retinol','vitamin_e'], 79000, 'https://shopee.co.id/wardah-crystal', NULL, NULL, true, true, 'Serum anti-aging wallet-friendly dengan retinol ringan.', 'Malam hari 2-3x seminggu. Wajib pakai sunscreen keesokan harinya.', 4.4),

-- Glad2Glow expansion
('Centella Soothing Toner', 'Glad2Glow', 'toner', ARRAY['sensitive','combination','normal'], ARRAY['redness','acne'], ARRAY['centella','madecassoside'], 65000, 'https://shopee.co.id/g2g-centella', NULL, NULL, true, true, 'Toner ringan untuk kulit sensitif atau lagi breakout.', 'Setelah cleansing, tepuk-tepuk lembut ke wajah.', 4.6),
('Glow Berries Vitamin C Serum', 'Glad2Glow', 'serum', ARRAY['normal','combination','oily'], ARRAY['dullness','dark_spots'], ARRAY['vitamin_c','blueberry_extract'], 89000, 'https://shopee.co.id/g2g-berries', NULL, NULL, true, true, 'Serum Vit C ringan yang cocok buat pemula. Aroma berry segar.', 'Pagi setelah toner, sebelum moisturizer + sunscreen.', 4.5),
('Niacinamide Pore Minimizer', 'Glad2Glow', 'serum', ARRAY['oily','combination'], ARRAY['large_pores','acne'], ARRAY['niacinamide','zinc'], 79000, 'https://shopee.co.id/g2g-niacinamide', NULL, NULL, true, true, '10% niacinamide untuk ngecilin pori dan kontrol minyak.', 'Pagi atau malam, 3-4 tetes di seluruh wajah.', 4.6),

-- NPURE expansion
('Marigold Gentle Toner', 'NPURE', 'toner', ARRAY['sensitive','dry','normal'], ARRAY['redness'], ARRAY['marigold_extract','panthenol'], 79000, 'https://shopee.co.id/npure-marigold', NULL, NULL, true, true, 'Toner paling gentle buat kulit super sensitif. Alcohol-free.', 'Setelah cleansing, bisa pakai cotton pad atau langsung tepuk.', 4.7),
('Cica Barrier Cream', 'NPURE', 'moisturizer', ARRAY['sensitive','dry'], ARRAY['redness'], ARRAY['centella','panthenol','ceramide'], 99000, 'https://shopee.co.id/npure-cica-cream', NULL, NULL, true, true, 'Cream intensif buat repair skin barrier yang rusak.', 'Pagi dan malam sebagai moisturizer. Bisa juga spot treatment.', 4.8),

-- Kahf (men's line)
('Energizing Facial Wash', 'Kahf', 'cleanser', ARRAY['oily','combination','normal'], ARRAY['acne','dullness'], ARRAY['lemon_extract','menthol'], 39000, 'https://shopee.co.id/kahf-energizing', NULL, NULL, true, true, 'Facial wash cowok dengan sensasi segar. Angkat minyak tanpa bikin ketarik.', 'Pagi dan malam. Busakan, aplikasikan, bilas dengan air hangat.', 4.5),
('Revitalizing Facial Serum', 'Kahf', 'serum', ARRAY['oily','combination'], ARRAY['acne','dullness'], ARRAY['niacinamide','centella'], 79000, 'https://shopee.co.id/kahf-serum', NULL, NULL, true, true, 'Serum all-in-one untuk cowok. Kontrol minyak + cerahkan.', 'Setelah cleansing, 2-3 tetes, pijat lembut.', 4.4),
('Oil-Free Moisturizer', 'Kahf', 'moisturizer', ARRAY['oily'], ARRAY['acne','large_pores'], ARRAY['hyaluronic_acid','zinc'], 59000, 'https://shopee.co.id/kahf-moisturizer', NULL, NULL, true, true, 'Moisturizer oil-free yang nggak bikin greasy. Pas buat kulit cowok berminyak.', 'Pagi dan malam setelah serum.', 4.5),

-- Avoskin expansion
('Miraculous Retinol Toner', 'Avoskin', 'toner', ARRAY['normal','combination','oily'], ARRAY['aging','dullness','dark_spots'], ARRAY['retinol','niacinamide','centella'], 149000, 'https://shopee.co.id/avoskin-retinol-toner', NULL, NULL, true, true, 'Toner retinol — entry point ke dunia retinol tanpa iritasi berat.', 'Malam hari 2-3x seminggu. Mulai pelan-pelan.', 4.7),
('Your Skin Bae Peptide 5% Serum', 'Avoskin', 'serum', ARRAY['normal','dry','sensitive'], ARRAY['aging','dullness'], ARRAY['peptide','ceramide'], 149000, 'https://shopee.co.id/avoskin-peptide', NULL, NULL, true, true, 'Serum peptide untuk firm skin dan kurangi fine lines.', 'Pagi dan malam, setelah toner.', 4.6),
('Perfect Hydrating Treatment Essence', 'Avoskin', 'toner', ARRAY['dry','normal','sensitive'], ARRAY['dullness'], ARRAY['galactomyces','niacinamide'], 169000, 'https://shopee.co.id/avoskin-essence', NULL, NULL, true, true, 'Essence fermentasi yang bikin kulit plump dan glass skin.', 'Setelah toner, tepuk-tepuk sampai meresap.', 4.7),

-- Emina expansion
('Ms Pimple Acne Solution Serum', 'Emina', 'spot_treatment', ARRAY['oily','combination'], ARRAY['acne'], ARRAY['salicylic_acid','tea_tree'], 35000, 'https://shopee.co.id/emina-mspimple', NULL, NULL, true, true, 'Spot treatment terjangkau buat jerawat yang tiba-tiba muncul.', 'Oles langsung di jerawat, 1-2x sehari.', 4.4),
('Bright Stuff Moisturizer', 'Emina', 'moisturizer', ARRAY['normal','combination'], ARRAY['dullness'], ARRAY['niacinamide','vitamin_c'], 29000, 'https://shopee.co.id/emina-brightstuff', NULL, NULL, true, true, 'Moisturizer affordable yang bikin kulit lebih cerah gradually.', 'Pagi dan malam setelah serum.', 4.3),
('Sun Battle SPF 45', 'Emina', 'sunscreen', ARRAY['normal','combination','oily'], ARRAY['dark_spots','aging'], ARRAY['zinc_oxide','niacinamide'], 35000, 'https://shopee.co.id/emina-sunbattle', NULL, NULL, true, true, 'Sunscreen SPF tinggi dengan harga terjangkau. Ringan dan nggak greasy.', 'Pagi sebagai step terakhir skincare. Re-apply kalau outdoor.', 4.5),

-- Scarlett
('Acne Cleanser', 'Scarlett', 'cleanser', ARRAY['oily','combination'], ARRAY['acne'], ARRAY['tea_tree','centella'], 65000, 'https://shopee.co.id/scarlett-acne', NULL, NULL, true, true, 'Cleanser untuk kulit berjerawat dengan ekstrak tea tree.', 'Pagi dan malam. Busakan, pijat lembut, bilas.', 4.4),
('Brightly Ever After Serum', 'Scarlett', 'serum', ARRAY['normal','combination'], ARRAY['dullness','dark_spots'], ARRAY['niacinamide','phyto_whitening'], 75000, 'https://shopee.co.id/scarlett-brightly', NULL, NULL, true, true, 'Serum pencerah best-seller. Hasil bertahap tapi konsisten.', 'Pagi dan malam, 2-3 tetes.', 4.6),

-- MS Glow
('Acne Serum', 'MS Glow', 'serum', ARRAY['oily','combination'], ARRAY['acne'], ARRAY['salicylic_acid','niacinamide'], 79000, 'https://shopee.co.id/msglow-acne-serum', NULL, NULL, true, true, 'Serum anti-jerawat dari local fav brand.', 'Malam hari, hindari area mata.', 4.3),
('Whitening Cream Day', 'MS Glow', 'moisturizer', ARRAY['normal','combination'], ARRAY['dullness','dark_spots'], ARRAY['niacinamide','vitamin_e'], 89000, 'https://shopee.co.id/msglow-whitening-day', NULL, NULL, true, true, 'Day cream pencerah dengan proteksi ringan.', 'Pagi sebagai moisturizer, wajib tambah sunscreen.', 4.2),

-- The Originote expansion
('Hyalucera Serum', 'The Originote', 'serum', ARRAY['dry','sensitive','normal'], ARRAY['dullness','aging'], ARRAY['hyaluronic_acid','ceramide'], 45000, 'https://shopee.co.id/originote-hyalucera', NULL, NULL, true, true, 'Serum hidrasi budget-friendly. Barrier boost harian.', 'Pagi dan malam setelah toner.', 4.6),
('Ceramidin Moisturizer', 'The Originote', 'moisturizer', ARRAY['dry','sensitive','normal'], ARRAY['dullness'], ARRAY['ceramide','panthenol'], 55000, 'https://shopee.co.id/originote-ceramidin', NULL, NULL, true, true, 'Moisturizer ceramide wallet-friendly. Barrier repair harian.', 'Pagi dan malam sebagai moisturizer.', 4.7),

-- Y.O.U
('Radiance White Serum', 'Y.O.U', 'serum', ARRAY['normal','combination','dry'], ARRAY['dullness','dark_spots'], ARRAY['niacinamide','alpha_arbutin'], 69000, 'https://shopee.co.id/you-radiance', NULL, NULL, true, true, 'Serum pencerah dengan alpha arbutin. Lembut di kulit.', 'Pagi dan malam.', 4.5),
('Triple Action Spot Treatment', 'Y.O.U', 'spot_treatment', ARRAY['oily','combination'], ARRAY['acne','dark_spots'], ARRAY['salicylic_acid','niacinamide','centella'], 49000, 'https://shopee.co.id/you-spot', NULL, NULL, true, true, 'Spot treatment 3-in-1 untuk jerawat, bekasnya, dan kemerahan.', 'Oles pada jerawat, malam hari.', 4.4),

-- Azarine
('Tone Up Sunscreen SPF 50', 'Azarine', 'sunscreen', ARRAY['normal','combination','oily'], ARRAY['dullness','dark_spots'], ARRAY['niacinamide','zinc_oxide'], 45000, 'https://shopee.co.id/azarine-toneup', NULL, NULL, true, true, 'Sunscreen dengan sedikit tone-up effect. Ringan, nggak white cast parah.', 'Pagi sebagai step terakhir.', 4.6),
('Centella Soothing Moisturizer', 'Azarine', 'moisturizer', ARRAY['sensitive','combination'], ARRAY['redness'], ARRAY['centella','panthenol'], 55000, 'https://shopee.co.id/azarine-centella', NULL, NULL, true, true, 'Moisturizer ringan untuk kulit sensitif. Non-comedogenic.', 'Pagi dan malam.', 4.5),

-- COSRX (popular import, BPOM'd)
('Advanced Snail 96 Mucin Power Essence', 'COSRX', 'serum', ARRAY['dry','sensitive','normal'], ARRAY['dullness','aging'], ARRAY['snail_mucin'], 189000, 'https://shopee.co.id/cosrx-snail', NULL, NULL, true, false, 'Essence legendary dengan 96% snail mucin. Glass skin in a bottle.', 'Pagi dan malam setelah toner.', 4.8),
('Salicylic Acid Daily Gentle Cleanser', 'COSRX', 'cleanser', ARRAY['oily','combination'], ARRAY['acne','large_pores'], ARRAY['salicylic_acid','tea_tree'], 139000, 'https://shopee.co.id/cosrx-bha-cleanser', NULL, NULL, true, false, 'Cleanser BHA daily untuk kulit berjerawat.', 'Pagi dan malam.', 4.6),

-- Erha
('Acne Face Wash', 'Erha', 'cleanser', ARRAY['oily','combination'], ARRAY['acne'], ARRAY['salicylic_acid'], 55000, 'https://shopee.co.id/erha-acne-wash', NULL, NULL, true, true, 'Face wash anti-jerawat dari brand dermatologist lokal.', 'Pagi dan malam.', 4.5),
('Erha Truwhite Advanced Serum', 'Erha', 'serum', ARRAY['normal','combination'], ARRAY['dark_spots','dullness'], ARRAY['tranexamic_acid','niacinamide'], 249000, 'https://shopee.co.id/erha-truwhite', NULL, NULL, true, true, 'Serum pencerah dengan tranexamic acid untuk flek membandel.', 'Malam hari.', 4.6),

-- Hanasui
('Yutie Facial Wash Berry', 'Hanasui', 'cleanser', ARRAY['normal','combination'], ARRAY['dullness'], ARRAY['berry_extract','niacinamide'], 15000, 'https://shopee.co.id/hanasui-yutie', NULL, NULL, true, true, 'Face wash super affordable dengan aroma berry.', 'Pagi dan malam.', 4.2),
('Strong Acne Serum', 'Hanasui', 'serum', ARRAY['oily','combination'], ARRAY['acne'], ARRAY['salicylic_acid','tea_tree'], 25000, 'https://shopee.co.id/hanasui-strongacne', NULL, NULL, true, true, 'Serum anti-jerawat pocket-friendly. Kerja cepat di spot.', 'Malam hari, hanya di area berjerawat.', 4.3),

-- Biore (import, BPOM'd)
('UV Aqua Rich Watery Essence SPF 50', 'Biore', 'sunscreen', ARRAY['normal','combination','oily'], ARRAY['aging','dark_spots'], ARRAY['hyaluronic_acid','chemical_filters'], 99000, 'https://shopee.co.id/biore-aqua-rich', NULL, NULL, true, false, 'Sunscreen legendary — tekstur paling ringan, kayak air.', 'Pagi sebagai step terakhir.', 4.8),

-- Garnier Indonesia
('Light Complete Serum Cream', 'Garnier', 'moisturizer', ARRAY['normal','combination'], ARRAY['dark_spots','dullness'], ARRAY['vitamin_c','niacinamide'], 39000, 'https://shopee.co.id/garnier-light-complete', NULL, NULL, true, true, 'Moisturizer mass-market yang bantu cerahkan. Budget-friendly.', 'Pagi dan malam.', 4.4),

-- Pond''s
('Bright Beauty Serum Cream', 'Ponds', 'moisturizer', ARRAY['normal','combination'], ARRAY['dark_spots','dullness'], ARRAY['niacinamide','glutathione'], 35000, 'https://shopee.co.id/ponds-bright-beauty', NULL, NULL, true, true, 'Classic brand dengan formula baru. Cerahkan bertahap.', 'Pagi dan malam.', 4.3),

-- Innisfree (import)
('Green Tea Seed Serum', 'Innisfree', 'serum', ARRAY['oily','combination','normal'], ARRAY['dullness','acne'], ARRAY['green_tea','hyaluronic_acid'], 299000, 'https://shopee.co.id/innisfree-greentea-serum', NULL, NULL, true, false, 'Serum hidrasi dengan green tea extract. Glow subtle.', 'Pagi dan malam.', 4.7)

ON CONFLICT DO NOTHING;
