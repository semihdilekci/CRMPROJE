export const PRODUCTS = [
  'Endüstriyel Pompalar',
  'Vana Sistemleri',
  'Kompresörler',
  'Filtre Üniteleri',
  'Otomasyon Yazılımı',
  'Sensörler & Ölçüm',
  'Boru & Fitting',
  'Isı Eşanjörleri',
  'Proses Ekipmanları',
  'Kontrol Panelleri',
] as const;

export type ProductName = (typeof PRODUCTS)[number];
