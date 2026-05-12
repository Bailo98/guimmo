-- ============================================================
-- GuImmo — Données de démonstration
-- À exécuter APRÈS 001_schema.sql
-- ============================================================

-- Propriétaire de démo (ne pas oublier de créer ce user dans Auth d'abord,
-- ou utiliser un UUID existant de ton projet)
-- Pour tester sans user réel, on insère sans owner_id (NULL autorisé)

INSERT INTO properties (
  title, description, transaction_type, type, status,
  price, price_period, surface, rooms, bathrooms,
  furnished, available_now, neighborhood, city, features,
  contact_phone, contact_preference, views, is_boosted
) VALUES

-- 1
('Appartement 3 chambres à Kipé', 'Bel appartement au 2ème étage, bien ventilé, proche du carrefour Kipé. Eau permanente et groupe électrogène inclus.', 'rent', 'apartment', 'active', 2500000, 'month', 90, 3, 2, false, true, 'kipe', 'Conakry', ARRAY['eau_permanente','groupe','gardien'], '+224 620 11 22 33', 'both', 128, true),

-- 2
('Studio meublé à Ratoma', 'Studio entièrement meublé, climatisation, connexion internet fibre. Idéal pour étudiant ou jeune professionnel. Disponible immédiatement.', 'rent', 'studio', 'active', 1200000, 'month', 35, 1, 1, true, true, 'ratoma', 'Conakry', ARRAY['wifi','clim','parking'], '+224 628 44 55 66', 'whatsapp', 95, false),

-- 3
('Villa 5 chambres à Hamdallaye', 'Grande villa avec jardin et piscine, 3 salles de bain, parking 3 voitures. Quartier résidentiel calme, sécurisé 24h/24.', 'rent', 'villa', 'active', 6000000, 'month', 280, 5, 3, false, true, 'hamdallaye', 'Conakry', ARRAY['piscine','gardien','parking','groupe','eau_permanente','clim'], '+224 622 77 88 99', 'both', 210, true),

-- 4
('Maison 4 chambres à Taouyah', 'Belle maison avec cour, idéale pour famille. Proche école et marché. Eau et électricité stables.', 'rent', 'house', 'active', 3000000, 'month', 150, 4, 2, false, true, 'taouyah', 'Conakry', ARRAY['gardien','eau_permanente','parking'], '+224 625 10 20 30', 'call', 67, false),

-- 5
('Appartement F3 à Dixinn', 'Appartement rénové, cuisine équipée, belle vue, immeuble sécurisé avec ascenseur. Proche ambassades et hôpitaux.', 'rent', 'apartment', 'active', 2200000, 'month', 80, 3, 1, true, true, 'dixinn', 'Conakry', ARRAY['clim','wifi','gardien','groupe'], '+224 620 99 88 77', 'whatsapp', 143, false),

-- 6
('Chambre meublée à Sonfonia', 'Chambre propre et sécurisée dans maison partagée, cuisine commune, eau et électricité incluses dans le loyer.', 'rent', 'room', 'active', 600000, 'month', 18, 1, 1, true, true, 'sonfonia', 'Conakry', ARRAY['wifi'], '+224 627 34 56 78', 'whatsapp', 45, false),

-- 7
('Bureau 3 pièces à Kaloum', 'Bureau climatisé au centre-ville, idéal pour ONG ou entreprise. Parking sécurisé, groupe électrogène permanent.', 'rent', 'office', 'active', 4500000, 'month', 120, 3, 1, false, true, 'kaloum', 'Conakry', ARRAY['clim','groupe','parking','wifi'], '+224 624 00 11 22', 'both', 88, false),

-- 8
('Villa à vendre à Kipé', 'Superbe villa R+1 avec piscine, 4 chambres, double salon, cuisine moderne. Titre foncier disponible. Quartier résidentiel.', 'sale', 'villa', 'active', 850000000, 'total', 320, 4, 3, false, true, 'kipe', 'Conakry', ARRAY['piscine','gardien','parking','groupe','eau_permanente','clim','balcon'], '+224 622 55 44 33', 'both', 312, true),

-- 9
('Appartement 2 chambres à Lambanyi', 'Appartement au rez-de-chaussée, cour privative, idéal pour famille avec enfants. Eau permanente assurée.', 'rent', 'apartment', 'active', 1000000, 'month', 65, 2, 1, false, true, 'lambanyi', 'Conakry', ARRAY['eau_permanente','gardien'], '+224 628 22 33 44', 'call', 34, false),

-- 10
('Terrain à vendre à Sonfonia', 'Terrain plat et viabilisé de 500 m², titre foncier, accès route goudronnée. Idéal construction villa ou immeuble.', 'sale', 'land', 'active', 200000000, 'total', 500, 0, 0, false, true, 'sonfonia', 'Conakry', ARRAY[]::TEXT[], '+224 621 66 77 88', 'both', 56, false),

-- 11
('Studio à Ratoma Cité', 'Studio neuf, jamais habité. Cuisine américaine, salle de bain moderne. Dans résidence sécurisée avec gardien.', 'rent', 'studio', 'active', 900000, 'month', 30, 1, 1, false, true, 'ratoma', 'Conakry', ARRAY['gardien','eau_permanente'], '+224 629 88 99 00', 'whatsapp', 72, false),

-- 12
('Maison à vendre à Hamdallaye', 'Maison R+1 bien construite, 5 pièces principales, 2 garages. Quartier calme, proche centre commercial.', 'sale', 'house', 'active', 450000000, 'total', 200, 5, 3, false, true, 'hamdallaye', 'Conakry', ARRAY['parking','gardien','groupe'], '+224 620 33 44 55', 'both', 189, true),

-- 13
('Appartement meublé F2 à Dixinn', 'Appartement entièrement meublé, équipé (TV, réfrigérateur, machine à laver). Contrat de 6 mois minimum.', 'rent', 'apartment', 'active', 1800000, 'month', 55, 2, 1, true, true, 'dixinn', 'Conakry', ARRAY['clim','wifi','groupe','eau_permanente'], '+224 623 11 22 33', 'whatsapp', 115, false),

-- 14
('Villa à Taouyah avec vue', 'Villa de luxe 4 chambres avec belle vue sur la mer, grande terrasse, jardin tropical. Gardiennage 24h.', 'rent', 'villa', 'active', 8000000, 'month', 350, 4, 4, true, true, 'taouyah', 'Conakry', ARRAY['piscine','gardien','parking','groupe','clim','wifi','balcon'], '+224 626 44 55 66', 'both', 267, true),

-- 15
('Boutique à louer à Matam', 'Local commercial 45 m² en rez-de-chaussée sur artère principale, forte visibilité, bail commercial possible.', 'rent', 'shop', 'active', 1500000, 'month', 45, 0, 1, false, true, 'matam', 'Conakry', ARRAY['groupe'], '+224 628 77 88 99', 'call', 42, false),

-- 16
('Appartement 3ch à Kipé Mosquée', 'Appartement spacieux au 1er étage, balcon, placards intégrés. Gardien résidence. Bus à 5 min.', 'rent', 'apartment', 'active', 2000000, 'month', 85, 3, 2, false, true, 'kipe', 'Conakry', ARRAY['gardien','balcon','eau_permanente'], '+224 621 00 11 22', 'both', 98, false),

-- 17
('Terrain constructible à Kobaya', 'Beau terrain de 800 m² sur route principale, idéal investissement. Documents en règle.', 'sale', 'land', 'active', 120000000, 'total', 800, 0, 0, false, true, 'kobaya', 'Conakry', ARRAY[]::TEXT[], '+224 624 33 44 55', 'both', 31, false),

-- 18
('Maison 3 chambres à Cosa', 'Maison familiale avec grande cour, puits + raccordement réseau. Cuisine séparée. Quartier paisible.', 'rent', 'house', 'active', 1400000, 'month', 110, 3, 2, false, true, 'cosa', 'Conakry', ARRAY['eau_permanente','gardien'], '+224 627 55 66 77', 'call', 55, false),

-- 19
('Studio climatisé à Hamdallaye', 'Studio moderne avec climatisation, chauffe-eau électrique, double vitrage. Résidence récente 2023.', 'rent', 'studio', 'active', 1100000, 'month', 32, 1, 1, true, false, 'hamdallaye', 'Conakry', ARRAY['clim','wifi','gardien'], '+224 620 88 99 00', 'whatsapp', 63, false),

-- 20
('Appartement F4 à vendre à Ratoma', 'Grand appartement 4 pièces à vendre, idéal investissement locatif. Bon état général, cuisine équipée, 2 parkings.', 'sale', 'apartment', 'active', 350000000, 'total', 130, 4, 2, true, true, 'ratoma', 'Conakry', ARRAY['parking','clim','groupe','eau_permanente'], '+224 622 11 22 33', 'both', 178, false);


-- Images pour les annonces (on récupère les IDs via subquery)
-- Unsplash IDs valides pour des intérieurs/extérieurs immobiliers

DO $$
DECLARE
  prop_ids UUID[];
  images TEXT[][] := ARRAY[
    ARRAY['photo-1564013799919-ab600027ffc6','photo-1502672260266-1c1ef2d93688'],
    ARRAY['photo-1555041469-a586c61ea9bc','photo-1484154218962-a197022b5858'],
    ARRAY['photo-1613490493576-7fde63acd811','photo-1600596542815-ffad4c1539a9'],
    ARRAY['photo-1570129477492-45c003edd2be','photo-1494526585095-c41746248156'],
    ARRAY['photo-1560448204-e02f11c3d0e2','photo-1630699144867-37acec97df5a'],
    ARRAY['photo-1522771739844-6a9f6d5f14af','photo-1505691723518-36a5ac3be353'],
    ARRAY['photo-1497366216548-37526070297c','photo-1524758631624-e2822e304c36'],
    ARRAY['photo-1600607687939-ce8a6c25118c','photo-1600607687644-aac4c3eac7f4'],
    ARRAY['photo-1493809842364-78817add7ffb','photo-1502005229762-cf1b2da7c5d6'],
    ARRAY['photo-1500530855697-b586d89ba3ee','photo-1516455590571-18256e5bb9ff'],
    ARRAY['photo-1554995207-c18c203602cb','photo-1556020685-ae41abfc9365'],
    ARRAY['photo-1600585154340-be6161a56a0c','photo-1600573472556-e636c2acda88'],
    ARRAY['photo-1505693314120-0d443867891c','photo-1560185007-cde436f6a4d0'],
    ARRAY['photo-1600047509807-ba8f99d2cdde','photo-1600047509358-9dc75507daeb'],
    ARRAY['photo-1604014237800-1c9102c219da','photo-1528698827591-e19ccd7bc23d'],
    ARRAY['photo-1576941089067-2de3c901e126','photo-1571508601891-ca5e7a713859'],
    ARRAY['photo-1470770841072-f978cf4d019e','photo-1474044159687-1ee9f3a51722'],
    ARRAY['photo-1583608205776-bfd35f0d9f83','photo-1558618666-fcd25c85cd64'],
    ARRAY['photo-1536376072261-38c75010e6c9','photo-1531835551805-16d864c8d311'],
    ARRAY['photo-1600210492493-0946911123ea','photo-1600210492486-724fe5c67fb0']
  ];
  i INT;
BEGIN
  SELECT ARRAY(SELECT id FROM properties ORDER BY created_at DESC LIMIT 20)
  INTO prop_ids;

  FOR i IN 1..ARRAY_LENGTH(prop_ids, 1) LOOP
    INSERT INTO property_images (property_id, url, alt, is_primary, sort_order)
    VALUES
      (prop_ids[i], 'https://images.unsplash.com/' || images[i][1] || '?w=800&q=80', 'Photo principale', true, 0),
      (prop_ids[i], 'https://images.unsplash.com/' || images[i][2] || '?w=800&q=80', 'Photo secondaire', false, 1);
  END LOOP;
END $$;
