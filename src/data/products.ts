/**
 * Catálogo de DEMONSTRAÇÃO. Marcas e produtos são FICTÍCIOS de propósito:
 * atribuir uma composição inventada a um produto real seria enganoso.
 * Os códigos usam o prefixo 200–299 (reservado para uso interno pelo GS1), então não colidem com EANs reais.
 */
export interface SeedProduct {
  barcode: string;
  brand: string;
  name: string;
  category: string; // slug
  description: string;
  ingredientsRaw: string;
  attributes: { vegan?: boolean | null; crueltyFree?: boolean | null; finish?: string | null; spf?: number | null };
}

export const seedCategories: { slug: string; namePt: string; parent?: string }[] = [
  { slug: "maquiagem", namePt: "Maquiagem" },
  { slug: "base", namePt: "Base", parent: "maquiagem" },
  { slug: "po", namePt: "Pó", parent: "maquiagem" },
  { slug: "skincare", namePt: "Skincare" },
  { slug: "hidratante-facial", namePt: "Hidratante facial", parent: "skincare" },
  { slug: "serum", namePt: "Sérum", parent: "skincare" },
  { slug: "tonico", namePt: "Tônico", parent: "skincare" },
  { slug: "limpeza-facial", namePt: "Limpeza facial", parent: "skincare" },
  { slug: "protetor-solar", namePt: "Protetor solar", parent: "skincare" },
  { slug: "esfoliante", namePt: "Esfoliante", parent: "skincare" },
  { slug: "corpo", namePt: "Corpo" },
  { slug: "hidratante-corporal", namePt: "Hidratante corporal", parent: "corpo" },
  { slug: "cabelo", namePt: "Cabelo" },
  { slug: "shampoo", namePt: "Shampoo", parent: "cabelo" },
];

/** Calcula o dígito verificador EAN-13 para um prefixo de 12 dígitos. */
export function ean13(prefix12: string): string {
  const digits = prefix12.split("").map(Number);
  const sum = digits.reduce((acc, d, idx) => acc + d * (idx % 2 === 0 ? 1 : 3), 0);
  return prefix12 + ((10 - (sum % 10)) % 10);
}

const code = (n: number) => ean13(`200000000${String(n).padStart(3, "0")}`);

export const seedProducts: SeedProduct[] = [
  {
    barcode: code(1),
    brand: "Aurora Make (demo)",
    name: "Base Matte Controle 24h",
    category: "base",
    description: "Base líquida de acabamento matte e cobertura média.",
    ingredientsRaw:
      "Aqua, Cyclopentasiloxane, Dimethicone, Isododecane, Talc, Glycerin, Nylon-12, Silica, PEG-10 Dimethicone, Dimethicone Crosspolymer, Trimethylsiloxysilicate, Phenoxyethanol, Parfum, Titanium Dioxide (CI 77891), CI 77491, CI 77492, CI 77499",
    attributes: { finish: "matte", vegan: null, crueltyFree: true },
  },
  {
    barcode: code(2),
    brand: "Aurora Make (demo)",
    name: "Base Glow Hidratante",
    category: "base",
    description: "Base de acabamento luminoso com ácido hialurônico.",
    ingredientsRaw:
      "Aqua, Glycerin, Squalane, Dimethicone, Butylene Glycol, Sodium Hyaluronate, Titanium Dioxide, CI 77491, CI 77492, CI 77499, Tocopherol, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin",
    attributes: { finish: "dewy", vegan: true, crueltyFree: true },
  },
  {
    barcode: code(3),
    brand: "Pele Viva (demo)",
    name: "Gel Hidratante Oil Control Niacinamida",
    category: "hidratante-facial",
    description: "Gel leve para pele oleosa com niacinamida e zinco.",
    ingredientsRaw:
      "Aqua, Glycerin, Niacinamide, Propanediol, Zinc PCA, Sodium Hyaluronate, Panthenol, Allantoin, Carbomer, Sodium Hydroxide, Phenoxyethanol, Ethylhexylglycerin",
    attributes: { finish: "matte", vegan: true, crueltyFree: true },
  },
  {
    barcode: code(4),
    brand: "Derma Lab (demo)",
    name: "Creme Barreira Ceramidas",
    category: "hidratante-facial",
    description: "Creme nutritivo com ceramidas e vaselina para pele seca.",
    ingredientsRaw:
      "Aqua, Glycerin, Cetearyl Alcohol, Caprylic/Capric Triglyceride, Petrolatum, Dimethicone, Ceramide NP, Ceramide AP, Ceramide EOP, Cholesterol, Phytosphingosine, Sodium Hyaluronate, Glyceryl Stearate, Xanthan Gum, Disodium EDTA, Phenoxyethanol",
    attributes: { vegan: false, crueltyFree: null },
  },
  {
    barcode: code(5),
    brand: "Fresh Skin (demo)",
    name: "Tônico Adstringente Refrescante",
    category: "tonico",
    description: "Tônico com sensação refrescante e toque seco.",
    ingredientsRaw:
      "Aqua, Alcohol Denat., Hamamelis Virginiana Water, Salicylic Acid, Menthol, Glycerin, Parfum, Limonene, Linalool, CI 42090",
    attributes: { vegan: true, crueltyFree: null },
  },
  {
    barcode: code(6),
    brand: "Derma Lab (demo)",
    name: "Sérum Vitamina C 10%",
    category: "serum",
    description: "Sérum antioxidante com vitamina C, E e ácido ferúlico.",
    ingredientsRaw:
      "Aqua, 3-O-Ethyl Ascorbic Acid, Propanediol, Glycerin, Niacinamide, Tocopherol, Ferulic Acid, Sodium Hyaluronate, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin",
    attributes: { vegan: true, crueltyFree: true },
  },
  {
    barcode: code(7),
    brand: "Derma Lab (demo)",
    name: "Sérum Retinol Noite",
    category: "serum",
    description: "Sérum oleoso noturno com retinol e bakuchiol.",
    ingredientsRaw: "Squalane, Caprylic/Capric Triglyceride, Simmondsia Chinensis Seed Oil, Retinol, Bakuchiol, Tocopherol",
    attributes: { vegan: true, crueltyFree: true },
  },
  {
    barcode: code(8),
    brand: "Fresh Skin (demo)",
    name: "Sabonete Líquido Facial Espumante",
    category: "limpeza-facial",
    description: "Sabonete de espuma abundante com ácido salicílico.",
    ingredientsRaw:
      "Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Sodium Chloride, Salicylic Acid, Glycerin, Parfum, Citric Acid, Sodium Benzoate, Methylchloroisothiazolinone, Methylisothiazolinone",
    attributes: { vegan: true, crueltyFree: null },
  },
  {
    barcode: code(9),
    brand: "Sol & Pele (demo)",
    name: "Protetor Solar FPS 50 Toque Seco",
    category: "protetor-solar",
    description: "Protetor facial de toque seco com niacinamida.",
    ingredientsRaw:
      "Aqua, Ethylhexyl Methoxycinnamate, Octocrylene, Butyl Methoxydibenzoylmethane, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Silica, Alcohol Denat., Niacinamide, Glycerin, Tocopheryl Acetate, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Triethanolamine, Phenoxyethanol, Parfum",
    attributes: { finish: "matte", spf: 50, vegan: null, crueltyFree: true },
  },
  {
    barcode: code(10),
    brand: "Sol & Pele (demo)",
    name: "Protetor Mineral Pele Sensível FPS 30",
    category: "protetor-solar",
    description: "Protetor com filtros minerais, sem fragrância.",
    ingredientsRaw:
      "Aqua, Zinc Oxide, Caprylic/Capric Triglyceride, Glycerin, Titanium Dioxide, Panthenol, Bisabolol, Allantoin, Tocopherol, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin",
    attributes: { spf: 30, vegan: true, crueltyFree: true },
  },
  {
    barcode: code(11),
    brand: "Casa Natural (demo)",
    name: "Creme Nutritivo Coco & Karité",
    category: "hidratante-corporal",
    description: "Creme corporal denso com óleo de coco, karité e lavanda.",
    ingredientsRaw:
      "Aqua, Cocos Nucifera Oil, Butyrospermum Parkii Butter, Cetearyl Alcohol, Glycerin, Isopropyl Myristate, Lanolin, Parfum, Lavandula Angustifolia Oil, Linalool, Coumarin, Methylparaben, Propylparaben",
    attributes: { vegan: false, crueltyFree: null },
  },
  {
    barcode: code(12),
    brand: "Pele Viva (demo)",
    name: "Hidratante Calmante Centella",
    category: "hidratante-facial",
    description: "Hidratante leve para pele sensível e com vermelhidão.",
    ingredientsRaw:
      "Aqua, Centella Asiatica Extract, Glycerin, Panthenol, Squalane, Madecassoside, Allantoin, Ceramide NP, Betaine, Dipotassium Glycyrrhizate, Carbomer, Sodium Hydroxide, Phenoxyethanol, Ethylhexylglycerin",
    attributes: { vegan: true, crueltyFree: true },
  },
  {
    barcode: code(13),
    brand: "Fio Leve (demo)",
    name: "Shampoo Suave Uso Diário",
    category: "shampoo",
    description: "Shampoo com tensoativos suaves e pantenol.",
    ingredientsRaw:
      "Aqua, Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Decyl Glucoside, Glycerin, Panthenol, Polyquaternium-10, Citric Acid, Sodium Benzoate, Parfum",
    attributes: { vegan: true, crueltyFree: true },
  },
  {
    barcode: code(14),
    brand: "Aurora Make (demo)",
    name: "Pó Compacto Matificante",
    category: "po",
    description: "Pó compacto translúcido para controle de brilho.",
    ingredientsRaw:
      "Talc, Mica, Silica, Kaolin, Zinc Stearate, Dimethicone, Titanium Dioxide (CI 77891), CI 77491, CI 77492, Phenoxyethanol",
    attributes: { finish: "matte", vegan: true, crueltyFree: true },
  },
  {
    barcode: code(15),
    brand: "Derma Lab (demo)",
    name: "Sérum Uniformizador Tranexâmico",
    category: "serum",
    description: "Sérum para manchas com ácido tranexâmico, alfa-arbutin e niacinamida.",
    ingredientsRaw:
      "Aqua, Niacinamide, Tranexamic Acid, Alpha-Arbutin, Glycerin, Sodium Hyaluronate, Glycyrrhiza Glabra Root Extract, Pentylene Glycol, Xanthan Gum, Phenoxyethanol",
    attributes: { vegan: true, crueltyFree: true },
  },
  {
    barcode: code(16),
    brand: "Fresh Skin (demo)",
    name: "Esfoliante Ácido Glicólico 7%",
    category: "esfoliante",
    description: "Tônico esfoliante noturno com ácido glicólico.",
    ingredientsRaw: "Aqua, Glycolic Acid, Sodium Hydroxide, Aloe Barbadensis Leaf Juice, Glycerin, Panthenol, Propanediol, Phenoxyethanol",
    attributes: { vegan: true, crueltyFree: true },
  },
];
