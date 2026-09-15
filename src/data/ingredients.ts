/**
 * Base inicial de ingredientes (curadoria editorial v0).
 *
 * Princípios:
 * - Função cosmética ≠ benefício ≠ ponto de atenção ≠ flag objetiva.
 * - Nenhum ingrediente é "tóxico" ou "ruim": pontos de atenção têm nível e força de evidência.
 * - Resumos em linguagem simples, sem alegações terapêuticas.
 *
 * Esta base PRECISA de revisão por especialista (farmacêutico/dermatologista) antes de produção.
 */
import type { ConcernSeverity, EvidenceLevel } from "@/domain/types";

export interface SeedIngredient {
  inciName: string;
  displayNamePt: string;
  summaryPt: string;
  functions: string[];
  benefitTags: string[];
  concerns: { tag: string; level: ConcernSeverity; evidence: EvidenceLevel; note?: string }[];
  flags: string[];
  evidenceLevel: EvidenceLevel;
  aliases: { alias: string; kind?: string; locale?: string }[];
}

type Opts = Partial<Omit<SeedIngredient, "inciName" | "displayNamePt" | "summaryPt" | "aliases">> & {
  aliases?: (string | { alias: string; kind?: string; locale?: string })[];
};

function i(inciName: string, displayNamePt: string, summaryPt: string, o: Opts = {}): SeedIngredient {
  return {
    inciName,
    displayNamePt,
    summaryPt,
    functions: o.functions ?? [],
    benefitTags: o.benefitTags ?? [],
    concerns: o.concerns ?? [],
    flags: o.flags ?? [],
    evidenceLevel: o.evidenceLevel ?? "moderate",
    aliases: (o.aliases ?? []).map((a) => (typeof a === "string" ? { alias: a } : a)),
  };
}

const sensitization = (level: ConcernSeverity, evidence: EvidenceLevel, note?: string) => ({
  tag: "sensitization",
  level,
  evidence,
  note,
});
const irritation = (level: ConcernSeverity, evidence: EvidenceLevel, note?: string) => ({
  tag: "irritation",
  level,
  evidence,
  note,
});
const comedogenic = (level: ConcernSeverity) => ({
  tag: "comedogenic_potential",
  level,
  evidence: "low" as const,
  note: "Escalas de comedogenicidade vêm de testes antigos com ingrediente puro; o efeito real depende da fórmula.",
});

const FRAGRANCE_ALLERGEN_SUMMARY =
  "Componente de fragrância (também presente em plantas e óleos essenciais). É um alérgeno conhecido que precisa ser declarado no rótulo na Europa; a maioria das pessoas tolera bem.";

export const seedIngredients: SeedIngredient[] = [
  // ---------- Base / solventes / umectantes ----------
  i("Aqua", "Água", "Base da maioria das fórmulas; dissolve os outros ingredientes.", {
    functions: ["solvent"],
    evidenceLevel: "high",
    aliases: ["Water", "Eau", { alias: "Água", locale: "pt" }, "Aqua/Water", "Purified Water"],
  }),
  i("Glycerin", "Glicerina", "Ajuda a atrair e reter água na pele. Um dos hidratantes mais estudados e bem tolerados.", {
    functions: ["humectant", "solvent"],
    benefitTags: ["hydration"],
    evidenceLevel: "high",
    aliases: ["Glycerol", { alias: "Glicerina", locale: "pt" }, "Glycerine"],
  }),
  i("Butylene Glycol", "Butilenoglicol", "Umectante leve e solvente; ajuda a textura e a hidratação.", {
    functions: ["humectant", "solvent"],
    benefitTags: ["hydration"],
  }),
  i("Propylene Glycol", "Propilenoglicol", "Umectante e solvente. Bem tolerado pela maioria; em pele muito sensível e concentração alta pode incomodar.", {
    functions: ["humectant", "solvent"],
    benefitTags: ["hydration"],
    concerns: [irritation("low", "moderate")],
  }),
  i("Propanediol", "Propanodiol", "Umectante e solvente, geralmente de origem vegetal; ajuda na hidratação.", {
    functions: ["humectant", "solvent"],
    benefitTags: ["hydration"],
  }),
  i("Pentylene Glycol", "Pentilenoglicol", "Umectante que também ajuda a conservar a fórmula.", {
    functions: ["humectant", "solvent", "antimicrobial"],
    benefitTags: ["hydration"],
  }),
  i("Sodium Hyaluronate", "Hialuronato de sódio", "Forma do ácido hialurônico que retém água e dá sensação de pele hidratada e preenchida.", {
    functions: ["humectant", "skin_conditioning"],
    benefitTags: ["hydration"],
    evidenceLevel: "high",
    aliases: ["Sodium Hyaluronate Crosspolymer"],
  }),
  i("Hyaluronic Acid", "Ácido hialurônico", "Retém água na superfície da pele, melhorando a hidratação.", {
    functions: ["humectant", "skin_conditioning"],
    benefitTags: ["hydration"],
    evidenceLevel: "high",
    aliases: [{ alias: "Ácido Hialurônico", locale: "pt" }],
  }),
  i("Panthenol", "Pantenol (pró-vitamina B5)", "Hidrata e ajuda a pele a se manter confortável; associado à recuperação da barreira.", {
    functions: ["humectant", "skin_conditioning"],
    benefitTags: ["hydration", "soothing", "barrier_support"],
    evidenceLevel: "high",
    aliases: ["D-Panthenol", "Dexpanthenol", "Provitamin B5", { alias: "Pantenol", locale: "pt" }],
  }),
  i("Urea", "Ureia", "Hidratante que também ajuda a amaciar áreas ásperas. Em pele com fissuras pode arder.", {
    functions: ["humectant", "skin_conditioning"],
    benefitTags: ["hydration", "exfoliation"],
    concerns: [irritation("low", "moderate", "Pode arder em pele lesionada ou em concentração alta.")],
    evidenceLevel: "high",
    aliases: [{ alias: "Ureia", locale: "pt" }],
  }),
  i("Sodium PCA", "PCA de sódio", "Componente do fator natural de hidratação da pele; ajuda a reter água.", {
    functions: ["humectant"],
    benefitTags: ["hydration"],
  }),
  i("Betaine", "Betaína", "Umectante suave que ajuda na hidratação.", {
    functions: ["humectant"],
    benefitTags: ["hydration"],
  }),
  i("Sorbitol", "Sorbitol", "Umectante que ajuda a reter água.", { functions: ["humectant"], benefitTags: ["hydration"] }),
  i("Allantoin", "Alantoína", "Ingrediente calmante e condicionante, geralmente bem tolerado.", {
    functions: ["skin_conditioning", "soothing"],
    benefitTags: ["soothing"],
    aliases: [{ alias: "Alantoína", locale: "pt" }],
  }),
  i("Aloe Barbadensis Leaf Juice", "Aloe vera", "Suco da folha de babosa; hidratante e calmante leve.", {
    functions: ["skin_conditioning"],
    benefitTags: ["hydration", "soothing"],
    evidenceLevel: "low",
    aliases: ["Aloe Vera", "Aloe Barbadensis Leaf Extract", "Aloe Vera Gel"],
  }),

  // ---------- Emolientes / oclusivos ----------
  i("Dimethicone", "Dimeticona (silicone)", "Silicone que suaviza, forma uma película leve e reduz a perda de água. Bem tolerado e com baixo potencial irritante.", {
    functions: ["emollient", "occlusive", "film_forming"],
    benefitTags: ["emollient", "occlusive"],
    evidenceLevel: "high",
    aliases: ["Dimeticone", { alias: "Dimeticona", locale: "pt" }, "Polydimethylsiloxane"],
  }),
  i("Cyclopentasiloxane", "Ciclopentassiloxano (silicone volátil)", "Silicone que evapora e deixa textura sedosa e seca.", {
    functions: ["emollient", "solvent"],
  }),
  i("Dimethicone Crosspolymer", "Dimeticona crosspolymer", "Silicone em gel que dá toque aveludado e matificante.", {
    functions: ["emollient", "viscosity_controlling"],
    benefitTags: ["oil_control"],
    evidenceLevel: "low",
  }),
  i("Isododecane", "Isododecano", "Solvente volátil e emoliente leve; comum em maquiagem de longa duração.", {
    functions: ["emollient", "solvent"],
  }),
  i("Petrolatum", "Vaselina (petrolato)", "Oclusivo muito eficaz contra a perda de água; estudos indicam que ajuda a recuperar a barreira. Não é considerado comedogênico em estudos modernos.", {
    functions: ["occlusive", "emollient"],
    benefitTags: ["occlusive", "barrier_support"],
    evidenceLevel: "high",
    aliases: ["Vaseline", "Petroleum Jelly", { alias: "Vaselina", locale: "pt" }, "White Petrolatum"],
  }),
  i("Mineral Oil", "Óleo mineral", "Emoliente e oclusivo purificado, com baixo potencial irritante.", {
    functions: ["emollient", "occlusive"],
    benefitTags: ["emollient", "occlusive"],
    evidenceLevel: "high",
    aliases: ["Paraffinum Liquidum", "Liquid Paraffin", { alias: "Óleo Mineral", locale: "pt" }],
  }),
  i("Squalane", "Esqualano", "Emoliente leve, semelhante a lipídios naturais da pele; deixa a pele macia sem pesar.", {
    functions: ["emollient"],
    benefitTags: ["emollient"],
    evidenceLevel: "high",
    aliases: [{ alias: "Esqualano", locale: "pt" }],
  }),
  i("Caprylic/Capric Triglyceride", "Triglicerídeo cáprico/caprílico", "Emoliente leve derivado de óleo de coco/glicerina; melhora o espalhamento.", {
    functions: ["emollient", "solvent"],
    benefitTags: ["emollient"],
    evidenceLevel: "high",
    aliases: ["Caprylic Capric Triglyceride", "Capric/Caprylic Triglyceride"],
  }),
  i("Cetearyl Alcohol", "Álcool cetoestearílico (álcool graxo)", "Apesar do nome, NÃO é o álcool que resseca: é um álcool graxo que amacia a pele e dá corpo ao creme.", {
    functions: ["emollient", "emulsion_stabilising", "viscosity_controlling"],
    benefitTags: ["emollient"],
    flags: ["fatty_alcohol"],
    evidenceLevel: "high",
    aliases: ["Cetostearyl Alcohol"],
  }),
  i("Cetyl Alcohol", "Álcool cetílico (álcool graxo)", "Álcool graxo emoliente e estabilizante — não é o álcool que resseca.", {
    functions: ["emollient", "emulsion_stabilising"],
    benefitTags: ["emollient"],
    flags: ["fatty_alcohol"],
    evidenceLevel: "high",
  }),
  i("Stearyl Alcohol", "Álcool estearílico (álcool graxo)", "Álcool graxo emoliente e espessante — não é o álcool que resseca.", {
    functions: ["emollient", "emulsion_stabilising"],
    benefitTags: ["emollient"],
    flags: ["fatty_alcohol"],
    evidenceLevel: "high",
  }),
  i("Isopropyl Myristate", "Miristato de isopropila", "Emoliente que deixa toque leve. Aparece em listas de possível potencial comedogênico (evidência limitada).", {
    functions: ["emollient"],
    benefitTags: ["emollient"],
    concerns: [comedogenic("medium")],
  }),
  i("Isopropyl Palmitate", "Palmitato de isopropila", "Emoliente de toque leve. Aparece em listas de possível potencial comedogênico (evidência limitada).", {
    functions: ["emollient"],
    benefitTags: ["emollient"],
    concerns: [comedogenic("medium")],
  }),
  i("Cocos Nucifera Oil", "Óleo de coco", "Óleo emoliente e nutritivo. Em peles com tendência a acne, há relatos de obstrução de poros (evidência limitada).", {
    functions: ["emollient"],
    benefitTags: ["emollient", "occlusive"],
    concerns: [comedogenic("medium")],
    aliases: ["Coconut Oil", { alias: "Óleo de Coco", locale: "pt" }],
  }),
  i("Butyrospermum Parkii Butter", "Manteiga de karité", "Manteiga vegetal emoliente, boa para pele seca.", {
    functions: ["emollient", "occlusive"],
    benefitTags: ["emollient", "occlusive"],
    aliases: ["Shea Butter", "Butyrospermum Parkii (Shea) Butter", { alias: "Manteiga de Karité", locale: "pt" }],
  }),
  i("Simmondsia Chinensis Seed Oil", "Óleo de jojoba", "Cera líquida vegetal emoliente, geralmente bem tolerada.", {
    functions: ["emollient"],
    benefitTags: ["emollient"],
    aliases: ["Jojoba Oil", "Simmondsia Chinensis (Jojoba) Seed Oil"],
  }),
  i("Helianthus Annuus Seed Oil", "Óleo de girassol", "Óleo emoliente rico em ácido linoleico, associado ao cuidado da barreira.", {
    functions: ["emollient"],
    benefitTags: ["emollient", "barrier_support"],
    aliases: ["Sunflower Seed Oil", "Helianthus Annuus (Sunflower) Seed Oil"],
  }),
  i("Lanolin", "Lanolina", "Emoliente e oclusivo derivado da lã de ovelha. Bom para pele seca; algumas pessoas são sensibilizadas.", {
    functions: ["emollient", "occlusive"],
    benefitTags: ["emollient", "occlusive"],
    concerns: [sensitization("low", "moderate")],
    flags: ["animal_derived"],
  }),
  i("Stearic Acid", "Ácido esteárico", "Ácido graxo usado como emulsionante e emoliente.", {
    functions: ["emulsifying", "emollient"],
    evidenceLevel: "high",
  }),
  i("Glyceryl Stearate", "Estearato de glicerila", "Emulsionante e emoliente comum em cremes.", { functions: ["emulsifying", "emollient"] }),
  i("PEG-100 Stearate", "PEG-100 estearato", "Emulsionante que ajuda água e óleo a se misturarem.", { functions: ["emulsifying"] }),
  i("Polysorbate 20", "Polissorbato 20", "Emulsionante/solubilizante suave.", { functions: ["emulsifying", "surfactant"] }),

  // ---------- Barreira ----------
  i("Ceramide NP", "Ceramida NP", "Lipídio natural da pele; ajuda a manter a barreira cutânea íntegra.", {
    functions: ["skin_conditioning"],
    benefitTags: ["barrier_support", "hydration"],
    evidenceLevel: "high",
    aliases: ["Ceramide 3", { alias: "Ceramida NP", locale: "pt" }],
  }),
  i("Ceramide AP", "Ceramida AP", "Lipídio da barreira da pele; costuma aparecer junto de outras ceramidas.", {
    functions: ["skin_conditioning"],
    benefitTags: ["barrier_support"],
    evidenceLevel: "high",
    aliases: ["Ceramide 6 II"],
  }),
  i("Ceramide EOP", "Ceramida EOP", "Lipídio da barreira da pele.", {
    functions: ["skin_conditioning"],
    benefitTags: ["barrier_support"],
    evidenceLevel: "high",
    aliases: ["Ceramide 1"],
  }),
  i("Cholesterol", "Colesterol", "Lipídio que, junto com ceramidas e ácidos graxos, compõe a barreira da pele.", {
    functions: ["skin_conditioning", "emollient"],
    benefitTags: ["barrier_support"],
  }),
  i("Phytosphingosine", "Fitoesfingosina", "Precursor de ceramidas; apoia a barreira da pele.", {
    functions: ["skin_conditioning"],
    benefitTags: ["barrier_support"],
  }),

  // ---------- Ativos ----------
  i("Niacinamide", "Niacinamida (vitamina B3)", "Pode ajudar na barreira da pele, no controle da oleosidade e na uniformização do tom. Geralmente bem tolerada.", {
    functions: ["skin_conditioning"],
    benefitTags: ["barrier_support", "oil_control", "brightening", "acne_support", "anti_aging"],
    evidenceLevel: "high",
    aliases: ["Nicotinamide", "Vitamin B3", { alias: "Niacinamida", locale: "pt" }, { alias: "Nicotinamida", locale: "pt" }],
  }),
  i("Salicylic Acid", "Ácido salicílico (BHA)", "Esfoliante que penetra no poro; ajuda com cravos e acne leve. Pode ressecar ou irritar no início.", {
    functions: ["exfoliant", "preservative"],
    benefitTags: ["acne_support", "exfoliation", "oil_control"],
    concerns: [irritation("low", "moderate")],
    flags: ["exfoliant_bha"],
    evidenceLevel: "high",
    aliases: ["BHA", "Beta Hydroxy Acid", { alias: "Ácido Salicílico", locale: "pt" }],
  }),
  i("Glycolic Acid", "Ácido glicólico (AHA)", "Esfoliante que renova a superfície da pele, melhorando textura e viço. Pode irritar e aumentar a sensibilidade ao sol.", {
    functions: ["exfoliant", "buffering"],
    benefitTags: ["exfoliation", "brightening", "anti_aging"],
    concerns: [irritation("medium", "high"), { tag: "photosensitivity", level: "medium", evidence: "high" }],
    flags: ["exfoliant_aha"],
    evidenceLevel: "high",
    aliases: ["AHA", { alias: "Ácido Glicólico", locale: "pt" }],
  }),
  i("Lactic Acid", "Ácido lático (AHA)", "Esfoliante suave que também ajuda a hidratar. Pode aumentar a sensibilidade ao sol.", {
    functions: ["exfoliant", "humectant", "buffering"],
    benefitTags: ["exfoliation", "hydration", "brightening"],
    concerns: [irritation("low", "moderate"), { tag: "photosensitivity", level: "low", evidence: "moderate" }],
    flags: ["exfoliant_aha"],
    evidenceLevel: "high",
    aliases: [{ alias: "Ácido Lático", locale: "pt" }],
  }),
  i("Mandelic Acid", "Ácido mandélico (AHA)", "Esfoliante de molécula maior, geralmente mais suave.", {
    functions: ["exfoliant"],
    benefitTags: ["exfoliation", "acne_support", "brightening"],
    concerns: [irritation("low", "low")],
    flags: ["exfoliant_aha"],
  }),
  i("Azelaic Acid", "Ácido azelaico", "Ajuda com acne, vermelhidão e manchas. Concentrações cosméticas são menores que as de medicamentos.", {
    functions: ["skin_conditioning"],
    benefitTags: ["acne_support", "brightening", "soothing"],
    concerns: [irritation("low", "moderate", "Pode formigar nas primeiras aplicações.")],
    evidenceLevel: "high",
  }),
  i("Retinol", "Retinol (vitamina A)", "Um dos ativos mais estudados para textura e linhas finas. Costuma irritar no início e aumenta a sensibilidade ao sol.", {
    functions: ["skin_conditioning"],
    benefitTags: ["anti_aging", "acne_support"],
    concerns: [irritation("medium", "high"), { tag: "photosensitivity", level: "low", evidence: "moderate" }],
    flags: ["retinoid"],
    evidenceLevel: "high",
    aliases: ["Vitamin A", { alias: "Vitamina A", locale: "pt" }],
  }),
  i("Retinyl Palmitate", "Palmitato de retinila", "Forma mais suave e menos potente de vitamina A.", {
    functions: ["skin_conditioning", "antioxidant"],
    benefitTags: ["anti_aging"],
    concerns: [irritation("low", "low")],
    flags: ["retinoid"],
    evidenceLevel: "low",
  }),
  i("Hydroxypinacolone Retinoate", "Retinoato de hidroxipinacolona", "Retinoide mais recente, com proposta de menor irritação; menos estudos que o retinol.", {
    functions: ["skin_conditioning"],
    benefitTags: ["anti_aging"],
    concerns: [irritation("low", "low")],
    flags: ["retinoid"],
    evidenceLevel: "low",
    aliases: ["HPR", "Granactive Retinoid"],
  }),
  i("Bakuchiol", "Bakuchiol", "Ativo vegetal estudado como alternativa mais suave ao retinol; ainda com poucos estudos.", {
    functions: ["antioxidant", "skin_conditioning"],
    benefitTags: ["anti_aging", "antioxidant"],
    evidenceLevel: "low",
  }),
  i("Ascorbic Acid", "Vitamina C (ácido ascórbico)", "Antioxidante que ajuda a uniformizar o tom e dar viço. Pode formigar em pele sensível.", {
    functions: ["antioxidant"],
    benefitTags: ["antioxidant", "brightening", "anti_aging"],
    concerns: [irritation("low", "moderate")],
    evidenceLevel: "high",
    aliases: ["Vitamin C", "L-Ascorbic Acid", { alias: "Vitamina C", locale: "pt" }],
  }),
  i("Sodium Ascorbyl Phosphate", "Fosfato de ascorbil sódio", "Derivado estável e suave da vitamina C.", {
    functions: ["antioxidant"],
    benefitTags: ["antioxidant", "brightening"],
  }),
  i("Ascorbyl Glucoside", "Glicosídeo de ascorbila", "Derivado estável da vitamina C, voltado à uniformização do tom.", {
    functions: ["antioxidant"],
    benefitTags: ["antioxidant", "brightening"],
    evidenceLevel: "low",
  }),
  i("3-O-Ethyl Ascorbic Acid", "Vitamina C etilada", "Derivado estável da vitamina C, voltado à uniformização do tom.", {
    functions: ["antioxidant"],
    benefitTags: ["antioxidant", "brightening"],
    aliases: ["Ethyl Ascorbic Acid"],
  }),
  i("Ferulic Acid", "Ácido ferúlico", "Antioxidante que costuma acompanhar vitaminas C e E para estabilizá-las.", {
    functions: ["antioxidant"],
    benefitTags: ["antioxidant"],
  }),
  i("Tocopherol", "Vitamina E (tocoferol)", "Antioxidante que também protege os óleos da fórmula.", {
    functions: ["antioxidant", "skin_conditioning"],
    benefitTags: ["antioxidant"],
    aliases: ["Vitamin E", { alias: "Vitamina E", locale: "pt" }, "D-Alpha-Tocopherol"],
  }),
  i("Tocopheryl Acetate", "Acetato de tocoferila (vitamina E)", "Forma estável da vitamina E; antioxidante e condicionante.", {
    functions: ["antioxidant", "skin_conditioning"],
    benefitTags: ["antioxidant"],
    concerns: [sensitization("low", "low")],
    evidenceLevel: "low",
  }),
  i("Alpha-Arbutin", "Alfa-arbutin", "Ativo estudado para manchas; age de forma gradual.", {
    functions: ["skin_conditioning"],
    benefitTags: ["brightening"],
    aliases: ["Alpha Arbutin"],
  }),
  i("Tranexamic Acid", "Ácido tranexâmico", "Estudado para manchas e melasma em uso tópico.", {
    functions: ["skin_conditioning"],
    benefitTags: ["brightening"],
    aliases: [{ alias: "Ácido Tranexâmico", locale: "pt" }],
  }),
  i("Kojic Acid", "Ácido kójico", "Ativo para manchas; algumas pessoas são sensibilizadas.", {
    functions: ["skin_conditioning", "antioxidant"],
    benefitTags: ["brightening"],
    concerns: [sensitization("low", "moderate")],
  }),
  i("Glycyrrhiza Glabra Root Extract", "Extrato de alcaçuz", "Extrato vegetal calmante, estudado também para uniformizar o tom.", {
    functions: ["skin_conditioning"],
    benefitTags: ["soothing", "brightening"],
    evidenceLevel: "low",
    aliases: ["Licorice Root Extract", "Glycyrrhiza Glabra (Licorice) Root Extract"],
  }),
  i("Dipotassium Glycyrrhizate", "Glicirrizinato dipotássico", "Derivado do alcaçuz com ação calmante.", {
    functions: ["skin_conditioning"],
    benefitTags: ["soothing"],
  }),
  i("Centella Asiatica Extract", "Extrato de centella asiática", "Extrato vegetal associado a efeito calmante e ao cuidado da barreira.", {
    functions: ["skin_conditioning"],
    benefitTags: ["soothing", "barrier_support"],
    aliases: ["Cica", "Centella Asiatica Leaf Extract", "Gotu Kola Extract"],
  }),
  i("Madecassoside", "Madecassosídeo", "Composto da centella asiática com ação calmante.", {
    functions: ["skin_conditioning"],
    benefitTags: ["soothing", "barrier_support"],
  }),
  i("Bisabolol", "Bisabolol", "Ativo da camomila com ação calmante.", {
    functions: ["skin_conditioning", "soothing"],
    benefitTags: ["soothing"],
    aliases: ["Alpha-Bisabolol", "Levomenol"],
  }),
  i("Zinc PCA", "PCA de zinco", "Associado à redução do aspecto oleoso.", {
    functions: ["humectant", "skin_conditioning"],
    benefitTags: ["oil_control", "acne_support"],
    evidenceLevel: "low",
  }),
  i("Hamamelis Virginiana Water", "Água de hamamélis", "Extrato adstringente. Algumas versões contêm álcool; pode ressecar pele seca.", {
    functions: ["astringent", "skin_conditioning"],
    concerns: [{ tag: "drying", level: "low", evidence: "low" }],
    evidenceLevel: "low",
    aliases: ["Witch Hazel Water", "Hamamelis Virginiana (Witch Hazel) Water", "Witch Hazel"],
  }),

  // ---------- Filtros UV / pigmentos ----------
  i("Ethylhexyl Methoxycinnamate", "Octinoxato (filtro UVB)", "Filtro solar UVB químico.", {
    functions: ["uv_absorber"],
    concerns: [sensitization("low", "low")],
    flags: ["uv_filter"],
    evidenceLevel: "high",
    aliases: ["Octinoxate", "Octyl Methoxycinnamate"],
  }),
  i("Butyl Methoxydibenzoylmethane", "Avobenzona (filtro UVA)", "Filtro solar UVA químico.", {
    functions: ["uv_absorber"],
    flags: ["uv_filter"],
    evidenceLevel: "high",
    aliases: ["Avobenzone"],
  }),
  i("Octocrylene", "Octocrileno (filtro UVB)", "Filtro solar UVB que também estabiliza outros filtros. Raramente associado a alergia de contato.", {
    functions: ["uv_absorber"],
    concerns: [sensitization("low", "moderate")],
    flags: ["uv_filter"],
    evidenceLevel: "high",
  }),
  i("Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine", "Bemotrizinol (filtro UVA/UVB)", "Filtro solar de amplo espectro, fotoestável.", {
    functions: ["uv_absorber"],
    flags: ["uv_filter"],
    evidenceLevel: "high",
    aliases: ["Bemotrizinol", "Tinosorb S"],
  }),
  i("Diethylamino Hydroxybenzoyl Hexyl Benzoate", "DHHB (filtro UVA)", "Filtro solar UVA fotoestável.", {
    functions: ["uv_absorber"],
    flags: ["uv_filter"],
    evidenceLevel: "high",
    aliases: ["Uvinul A Plus", "DHHB"],
  }),
  i("Zinc Oxide", "Óxido de zinco", "Mineral usado como filtro solar físico de amplo espectro e como pigmento; geralmente bem tolerado por pele sensível. Proteção depende do FPS declarado.", {
    functions: ["uv_filter", "colorant", "skin_protecting"],
    benefitTags: ["soothing"],
    flags: ["uv_filter"],
    evidenceLevel: "high",
    aliases: ["CI 77947", { alias: "Óxido de Zinco", locale: "pt" }],
  }),
  i("Titanium Dioxide", "Dióxido de titânio", "Mineral usado como pigmento branco (maquiagem) ou filtro solar físico. Só protege do sol se o produto declarar FPS.", {
    functions: ["colorant", "uv_filter", "opacifying"],
    evidenceLevel: "high",
    aliases: ["CI 77891", "Titanium Dioxide (CI 77891)"],
  }),
  i("CI 77491", "Óxido de ferro vermelho (pigmento)", "Pigmento mineral que dá cor à maquiagem.", {
    functions: ["colorant"],
    evidenceLevel: "high",
    aliases: ["Iron Oxide Red"],
  }),
  i("CI 77492", "Óxido de ferro amarelo (pigmento)", "Pigmento mineral que dá cor à maquiagem.", {
    functions: ["colorant"],
    evidenceLevel: "high",
    aliases: ["Iron Oxide Yellow"],
  }),
  i("CI 77499", "Óxido de ferro preto (pigmento)", "Pigmento mineral que dá cor à maquiagem.", {
    functions: ["colorant"],
    evidenceLevel: "high",
    aliases: ["Iron Oxide Black"],
  }),
  i("Iron Oxides", "Óxidos de ferro (pigmentos)", "Pigmentos minerais que dão cor à maquiagem.", { functions: ["colorant"], evidenceLevel: "high" }),
  i("Mica", "Mica", "Mineral que dá brilho e cor.", { functions: ["colorant", "opacifying"], aliases: ["CI 77019"] }),
  i("Talc", "Talco", "Mineral absorvente que ajuda a matificar e dar textura a pós. O talco cosmético é regulado quanto à pureza.", {
    functions: ["absorbent", "bulking", "opacifying"],
    benefitTags: ["oil_control"],
    evidenceLevel: "low",
    aliases: [{ alias: "Talco", locale: "pt" }],
  }),
  i("Silica", "Sílica", "Pó mineral absorvente que ajuda a reduzir o brilho da pele.", {
    functions: ["absorbent", "opacifying", "viscosity_controlling"],
    benefitTags: ["oil_control"],
    evidenceLevel: "low",
    aliases: ["Silica Silylate", "Hydrated Silica"],
  }),
  i("Kaolin", "Caulim (argila branca)", "Argila absorvente que ajuda a controlar o brilho.", {
    functions: ["absorbent", "bulking"],
    benefitTags: ["oil_control"],
    aliases: ["Kaolin Clay", "White Clay", { alias: "Argila Branca", locale: "pt" }],
  }),
  i("Nylon-12", "Nylon-12", "Pó que dá textura macia e ajuda a reduzir o brilho.", {
    functions: ["bulking", "opacifying"],
    benefitTags: ["oil_control"],
    evidenceLevel: "low",
  }),
  i("Trimethylsiloxysilicate", "Trimetilsiloxissilicato", "Resina de silicone que ajuda a maquiagem a durar mais.", { functions: ["film_forming", "emollient"] }),
  i("Zinc Stearate", "Estearato de zinco", "Ajuda pós a aderirem à pele e dá textura.", { functions: ["bulking", "viscosity_controlling"] }),

  // ---------- Fragrância e alérgenos ----------
  i("Parfum", "Fragrância (perfume)", "Mistura de substâncias aromáticas (a composição não é detalhada no rótulo). Pode causar irritação ou sensibilização em algumas pessoas, especialmente com pele sensível.", {
    functions: ["perfuming"],
    concerns: [sensitization("medium", "high"), irritation("low", "moderate")],
    flags: ["fragrance"],
    evidenceLevel: "high",
    aliases: ["Fragrance", "Perfume", "Parfum/Fragrance", "Fragrance (Parfum)", { alias: "Fragrância", locale: "pt" }, "Aroma"],
  }),
  i("Linalool", "Linalol", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming"],
    concerns: [sensitization("low", "high", "O potencial aumenta quando oxidado.")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Limonene", "Limoneno", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming", "solvent"],
    concerns: [sensitization("low", "high", "O potencial aumenta quando oxidado.")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
    aliases: ["D-Limonene"],
  }),
  i("Citronellol", "Citronelol", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming"],
    concerns: [sensitization("low", "high")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Geraniol", "Geraniol", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming"],
    concerns: [sensitization("medium", "high")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Citral", "Citral", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming"],
    concerns: [sensitization("medium", "high")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Coumarin", "Cumarina", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming"],
    concerns: [sensitization("low", "high")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Hexyl Cinnamal", "Hexil cinamal", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming"],
    concerns: [sensitization("low", "high")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Benzyl Salicylate", "Salicilato de benzila", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming", "uv_absorber"],
    concerns: [sensitization("low", "high")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Eugenol", "Eugenol", FRAGRANCE_ALLERGEN_SUMMARY, {
    functions: ["perfuming"],
    concerns: [sensitization("medium", "high")],
    flags: ["fragrance", "eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Benzyl Alcohol", "Álcool benzílico", "Conservante e solvente (não é o álcool que resseca). Também está na lista europeia de alérgenos declaráveis.", {
    functions: ["preservative", "solvent", "perfuming"],
    concerns: [sensitization("low", "high")],
    flags: ["eu_declarable_allergen"],
    evidenceLevel: "high",
  }),
  i("Menthol", "Mentol", "Dá sensação refrescante. Pode irritar peles sensíveis.", {
    functions: ["refreshing", "perfuming"],
    concerns: [irritation("medium", "moderate")],
    flags: ["cooling_agent"],
    aliases: ["L-Menthol"],
  }),

  // ---------- Óleos essenciais ----------
  i("Lavandula Angustifolia Oil", "Óleo essencial de lavanda", "Óleo essencial aromático. Pode ser sensibilizante para parte das pessoas, principalmente quando oxidado.", {
    functions: ["perfuming"],
    concerns: [sensitization("medium", "moderate")],
    flags: ["essential_oil", "fragrance"],
    aliases: ["Lavender Oil", "Lavandula Angustifolia (Lavender) Oil"],
  }),
  i("Melaleuca Alternifolia Leaf Oil", "Óleo de melaleuca (tea tree)", "Óleo essencial com alguns estudos em acne leve; pode ser sensibilizante, principalmente oxidado.", {
    functions: ["perfuming", "antimicrobial"],
    benefitTags: ["acne_support"],
    concerns: [sensitization("medium", "moderate")],
    flags: ["essential_oil", "fragrance"],
    evidenceLevel: "low",
    aliases: ["Tea Tree Oil", "Melaleuca Alternifolia (Tea Tree) Leaf Oil"],
  }),
  i("Citrus Limon Peel Oil", "Óleo essencial de limão", "Óleo essencial cítrico. Pode causar reação na pele quando exposta ao sol.", {
    functions: ["perfuming"],
    concerns: [{ tag: "photosensitivity", level: "medium", evidence: "moderate" }, sensitization("low", "moderate")],
    flags: ["essential_oil", "fragrance"],
    aliases: ["Lemon Peel Oil", "Citrus Limon (Lemon) Peel Oil"],
  }),
  i("Mentha Piperita Oil", "Óleo essencial de hortelã-pimenta", "Óleo essencial refrescante; pode irritar peles sensíveis.", {
    functions: ["perfuming", "refreshing"],
    concerns: [irritation("medium", "moderate")],
    flags: ["essential_oil", "fragrance"],
    aliases: ["Peppermint Oil", "Mentha Piperita (Peppermint) Oil"],
  }),
  i("Eucalyptus Globulus Leaf Oil", "Óleo essencial de eucalipto", "Óleo essencial aromático; pode irritar peles sensíveis.", {
    functions: ["perfuming"],
    concerns: [irritation("low", "moderate")],
    flags: ["essential_oil", "fragrance"],
    aliases: ["Eucalyptus Oil"],
  }),

  // ---------- Álcoois secantes ----------
  i("Alcohol Denat.", "Álcool desnaturado", "Álcool etílico que evapora rápido e dá toque seco. Em concentração alta pode ressecar e incomodar peles secas ou sensíveis.", {
    functions: ["solvent", "antimicrobial", "astringent"],
    concerns: [{ tag: "drying", level: "medium", evidence: "moderate" }, irritation("low", "moderate")],
    flags: ["drying_alcohol"],
    aliases: ["Alcohol Denat", "Denatured Alcohol", "SD Alcohol 40", "SD Alcohol", { alias: "Álcool Desnaturado", locale: "pt" }],
  }),
  i("Alcohol", "Álcool (etanol)", "Álcool etílico. Em concentração alta pode ressecar; em pequena quantidade costuma servir para dissolver outros ingredientes.", {
    functions: ["solvent", "antimicrobial"],
    concerns: [{ tag: "drying", level: "medium", evidence: "moderate" }],
    flags: ["drying_alcohol"],
    aliases: ["Ethanol", "Ethyl Alcohol", { alias: "Álcool Etílico", locale: "pt" }],
  }),

  // ---------- Conservantes ----------
  i("Phenoxyethanol", "Fenoxietanol", "Conservante amplamente usado, permitido em até 1% na Europa. Geralmente bem tolerado.", {
    functions: ["preservative"],
    concerns: [irritation("low", "low")],
    evidenceLevel: "high",
    aliases: [{ alias: "Fenoxietanol", locale: "pt" }],
  }),
  i("Ethylhexylglycerin", "Etilhexilglicerina", "Ajuda a potencializar conservantes e condiciona a pele. Sensibilização é rara.", {
    functions: ["skin_conditioning", "preservative_booster"],
    concerns: [sensitization("low", "low")],
  }),
  i("Methylparaben", "Metilparabeno", "Conservante com longo histórico de uso e baixo índice de alergia. Os parabenos permitidos são regulados quanto à concentração.", {
    functions: ["preservative"],
    concerns: [sensitization("low", "moderate")],
    flags: ["paraben"],
    evidenceLevel: "high",
  }),
  i("Propylparaben", "Propilparabeno", "Conservante regulado com limite de concentração. Baixo índice de alergia.", {
    functions: ["preservative"],
    concerns: [sensitization("low", "moderate")],
    flags: ["paraben"],
    evidenceLevel: "high",
  }),
  i("Sodium Benzoate", "Benzoato de sódio", "Conservante comum, geralmente bem tolerado.", { functions: ["preservative"], evidenceLevel: "high" }),
  i("Potassium Sorbate", "Sorbato de potássio", "Conservante comum, geralmente bem tolerado.", { functions: ["preservative"], evidenceLevel: "high" }),
  i("Methylisothiazolinone", "Metilisotiazolinona", "Conservante com alta taxa de alergia de contato documentada; na Europa é proibido em produtos sem enxágue e limitado nos com enxágue.", {
    functions: ["preservative"],
    concerns: [sensitization("high", "high")],
    flags: ["known_sensitizer"],
    evidenceLevel: "high",
    aliases: ["MI", "MIT"],
  }),
  i("Methylchloroisothiazolinone", "Metilcloroisotiazolinona", "Conservante com alta taxa de alergia de contato documentada; uso limitado a produtos com enxágue na Europa.", {
    functions: ["preservative"],
    concerns: [sensitization("high", "high")],
    flags: ["known_sensitizer"],
    evidenceLevel: "high",
    aliases: ["MCI", "Kathon CG"],
  }),
  i("DMDM Hydantoin", "DMDM hidantoína", "Conservante liberador de formaldeído em pequenas quantidades; relevante para quem tem alergia a formaldeído.", {
    functions: ["preservative"],
    concerns: [sensitization("medium", "high")],
    flags: ["formaldehyde_releaser"],
    evidenceLevel: "high",
  }),

  // ---------- Textura / pH / quelantes ----------
  i("Carbomer", "Carbômero", "Espessante que forma géis.", { functions: ["viscosity_controlling"], evidenceLevel: "high" }),
  i("Xanthan Gum", "Goma xantana", "Espessante natural.", { functions: ["viscosity_controlling", "emulsion_stabilising"], evidenceLevel: "high" }),
  i("Sodium Hydroxide", "Hidróxido de sódio", "Usado em pequena quantidade para ajustar o pH da fórmula.", { functions: ["buffering"], evidenceLevel: "high" }),
  i("Citric Acid", "Ácido cítrico", "Em cosméticos, geralmente usado em baixa quantidade para ajustar o pH (não como esfoliante).", {
    functions: ["buffering", "chelating"],
    evidenceLevel: "high",
  }),
  i("Disodium EDTA", "EDTA dissódico", "Quelante que ajuda a estabilizar a fórmula.", { functions: ["chelating"], evidenceLevel: "high" }),
  i("Triethanolamine", "Trietanolamina", "Ajustador de pH e emulsionante.", { functions: ["buffering", "emulsifying"] }),
  i("Sodium Chloride", "Cloreto de sódio (sal)", "Espessante em produtos de limpeza.", { functions: ["viscosity_controlling"], evidenceLevel: "high", aliases: ["Salt"] }),
  i("Acrylates/C10-30 Alkyl Acrylate Crosspolymer", "Copolímero de acrilatos", "Espessante/estabilizante de géis e emulsões.", { functions: ["viscosity_controlling", "emulsion_stabilising"] }),

  // ---------- Limpeza ----------
  i("Sodium Lauryl Sulfate", "Lauril sulfato de sódio", "Tensoativo de limpeza forte e espumante. Em contato prolongado pode ressecar e irritar.", {
    functions: ["surfactant", "cleansing"],
    concerns: [irritation("medium", "high"), { tag: "drying", level: "medium", evidence: "high" }],
    flags: ["strong_surfactant"],
    evidenceLevel: "high",
    aliases: ["SLS"],
  }),
  i("Sodium Laureth Sulfate", "Lauril éter sulfato de sódio", "Tensoativo de limpeza espumante, mais suave que o lauril sulfato.", {
    functions: ["surfactant", "cleansing"],
    concerns: [irritation("low", "moderate")],
    evidenceLevel: "high",
    aliases: ["SLES", "Sodium Lauryl Ether Sulfate"],
  }),
  i("Cocamidopropyl Betaine", "Cocoamidopropil betaína", "Tensoativo suave que ajuda na espuma. Casos raros de alergia costumam estar ligados a impurezas.", {
    functions: ["surfactant", "cleansing"],
    concerns: [sensitization("low", "moderate")],
  }),
  i("Sodium Cocoyl Isethionate", "Cocoil isetionato de sódio", "Tensoativo suave, comum em limpadores delicados.", { functions: ["surfactant", "cleansing"] }),
  i("Decyl Glucoside", "Decil glucosídeo", "Tensoativo suave de origem vegetal.", { functions: ["surfactant", "cleansing"] }),
  i("Coco-Glucoside", "Coco glucosídeo", "Tensoativo suave de origem vegetal.", { functions: ["surfactant", "cleansing"] }),

  // ---------- Cabelo ----------
  i("Behentrimonium Chloride", "Cloreto de beentrimônio", "Condicionante que desembaraça e reduz o frizz.", { functions: ["hair_conditioning", "antistatic"] }),
  i("Cetrimonium Chloride", "Cloreto de cetrimônio", "Condicionante e antiestático.", { functions: ["hair_conditioning", "antistatic", "preservative"] }),
  i("Amodimethicone", "Amodimeticona", "Silicone condicionante que se deposita nas áreas danificadas do fio.", { functions: ["hair_conditioning", "antistatic"] }),
  i("Hydrolyzed Keratin", "Queratina hidrolisada", "Proteína condicionante para os fios.", { functions: ["hair_conditioning", "film_forming"], evidenceLevel: "low" }),
  i("Polyquaternium-10", "Poliquatérnio-10", "Polímero condicionante que ajuda a desembaraçar.", { functions: ["hair_conditioning", "film_forming", "antistatic"] }),
];

/** Evidências citáveis para as afirmações mais importantes (amostra inicial). */
export const seedEvidence: {
  inciName: string;
  claim: string;
  stance: "supports" | "mixed" | "against";
  level: EvidenceLevel;
  sourceTitle: string;
  sourceUrl?: string;
  notes?: string;
}[] = [
  {
    inciName: "Parfum",
    claim: "sensitization",
    stance: "supports",
    level: "high",
    sourceTitle: "Regulamento (CE) nº 1223/2009 sobre produtos cosméticos — Anexo III (alérgenos de fragrância declaráveis)",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2009/1223/oj",
  },
  {
    inciName: "Linalool",
    claim: "sensitization",
    stance: "supports",
    level: "high",
    sourceTitle: "SCCS — Opinion on fragrance allergens in cosmetic products (SCCS/1459/11)",
  },
  {
    inciName: "Methylisothiazolinone",
    claim: "sensitization",
    stance: "supports",
    level: "high",
    sourceTitle: "SCCS — Opinion on Methylisothiazolinone (SCCS/1521/13)",
  },
  {
    inciName: "Niacinamide",
    claim: "oil_control",
    stance: "supports",
    level: "moderate",
    sourceTitle: "Draelos ZD et al. The effect of 2% niacinamide on facial sebum production. J Cosmet Laser Ther, 2006",
  },
  {
    inciName: "Niacinamide",
    claim: "anti_aging",
    stance: "supports",
    level: "moderate",
    sourceTitle: "Bissett DL et al. Niacinamide: a B vitamin that improves aging facial skin appearance. Dermatol Surg, 2005",
  },
  {
    inciName: "Petrolatum",
    claim: "barrier_support",
    stance: "supports",
    level: "high",
    sourceTitle: "Ghadially R et al. Effects of petrolatum on stratum corneum structure and function. J Am Acad Dermatol, 1992",
  },
  {
    inciName: "Isopropyl Myristate",
    claim: "comedogenic_potential",
    stance: "mixed",
    level: "low",
    sourceTitle: "Draelos ZD, DiNardo JC. A re-evaluation of the comedogenicity concept. J Am Acad Dermatol, 2006",
    notes: "Modelos antigos (orelha de coelho) superestimam o efeito em produtos acabados.",
  },
  {
    inciName: "Cocos Nucifera Oil",
    claim: "comedogenic_potential",
    stance: "mixed",
    level: "low",
    sourceTitle: "Draelos ZD, DiNardo JC. A re-evaluation of the comedogenicity concept. J Am Acad Dermatol, 2006",
  },
];
