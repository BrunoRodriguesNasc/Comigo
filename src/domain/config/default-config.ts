import { scoringConfigSchema, type ScoringConfig } from "./schema";

/**
 * Configuração padrão do motor. Pesos, bases e pontos são PONTOS DE PARTIDA,
 * não verdades: devem ser calibrados com feedback real e revisão especializada.
 * Editável no admin (fica versionada no banco); este arquivo é o fallback e a base dos testes.
 */
export const defaultScoringConfig: ScoringConfig = scoringConfigSchema.parse({
  weights: { preferences: 0.3, profile_fit: 0.3, benefits: 0.25, general: 0.15 },
  bases: { preferences: 100, profile_fit: 70, benefits: 40, general: 100 },
  verdictThresholds: { excellent: 85, good: 70, caution: 50 },
  conflictCap: 40,
  softAvoidPoints: -30,
  positionFactors: [
    { upTo: 5, factor: 1 },
    { upTo: 10, factor: 0.85 },
    { upTo: 20, factor: 0.6 },
    { upTo: 9999, factor: 0.4 },
  ],
  evidenceFactors: { high: 1, moderate: 0.8, low: 0.5 },
  confidence: { highAt: 0.85, mediumAt: 0.6, partialBelow: 0.5 },

  preferences: {
    avoid_fragrance: {
      label: "Evitar fragrância",
      okTitle: "Sem fragrância",
      flagsAny: ["fragrance"],
      softPoints: -35,
      conflictTitle: "Contém fragrância",
      conflictMessage: "Você marcou que quer evitar fragrância, e este produto contém {ingredients}.",
      okMessage: "Sem fragrância adicionada entre os ingredientes identificados.",
    },
    avoid_essential_oils: {
      label: "Evitar óleos essenciais",
      okTitle: "Sem óleos essenciais",
      flagsAny: ["essential_oil"],
      softPoints: -30,
      conflictTitle: "Contém óleos essenciais",
      conflictMessage: "Você marcou que quer evitar óleos essenciais, e este produto contém {ingredients}.",
      okMessage: "Sem óleos essenciais entre os ingredientes identificados.",
    },
    avoid_drying_alcohol: {
      label: "Evitar álcool (etanol/álcool desnaturado)",
      okTitle: "Sem álcool secante",
      flagsAny: ["drying_alcohol"],
      softPoints: -30,
      conflictTitle: "Contém álcool",
      conflictMessage: "Você marcou que quer evitar álcool, e este produto contém {ingredients}.",
      okMessage:
        "Sem álcool etílico/desnaturado. Álcoois graxos (como cetearyl alcohol), se houver, são emolientes e não entram nessa preferência.",
    },
    simple_formula: {
      label: "Prefiro fórmulas mais simples",
      okTitle: "Fórmula simples",
      maxIngredients: 20,
      softPoints: -15,
      conflictTitle: "Fórmula com muitos ingredientes",
      conflictMessage: "Este produto tem {count} ingredientes; você prefere fórmulas mais simples (até {max}).",
      okMessage: "Fórmula relativamente simples ({count} ingredientes).",
    },
    vegan: {
      label: "Prefiro produtos veganos",
      okTitle: "Declarado vegano",
      requiresAttribute: "vegan",
      softPoints: -25,
      conflictTitle: "Não declarado como vegano",
      conflictMessage: "A marca não declara este produto como vegano.",
      okMessage: "Declarado vegano pela marca (informação não verificada por nós).",
      unknownMessage: "Não temos a informação se este produto é vegano.",
    },
    cruelty_free: {
      label: "Prefiro cruelty-free",
      okTitle: "Declarado cruelty-free",
      requiresAttribute: "crueltyFree",
      softPoints: -25,
      conflictTitle: "Não declarado como cruelty-free",
      conflictMessage: "A marca não declara este produto como cruelty-free.",
      okMessage: "Declarado cruelty-free pela marca (informação não verificada por nós).",
      unknownMessage: "Não temos a informação se este produto é cruelty-free.",
    },
  },

  rules: [
    // ---------------- profile_fit ----------------
    {
      code: "sensitive_fragrance",
      dimension: "profile_fit",
      when: { profile: { sensitive: true }, ingredient: { flagsAny: ["fragrance"] } },
      effect: {
        kind: "attention",
        points: -15,
        title: "Fragrância e pele sensível",
        message:
          "Contém {ingredients}. Fragrâncias podem causar irritação ou sensibilização em algumas pessoas, especialmente com pele sensível.",
      },
      evidence: "high",
    },
    {
      code: "irritation_prone_fragrance",
      dimension: "profile_fit",
      when: { profile: { concernsAny: ["redness", "irritation"] }, ingredient: { flagsAny: ["fragrance"] } },
      effect: {
        kind: "attention",
        points: -8,
        title: "Fragrância e tendência a vermelhidão",
        message: "Contém {ingredients}. Para quem tem tendência a vermelhidão ou irritação, fragrância é um gatilho comum.",
      },
      evidence: "moderate",
    },
    {
      code: "sensitive_essential_oils",
      dimension: "profile_fit",
      when: { profile: { sensitive: true }, ingredient: { flagsAny: ["essential_oil"] } },
      effect: {
        kind: "attention",
        points: -12,
        title: "Óleos essenciais e pele sensível",
        message:
          "Contém {ingredients}. Óleos essenciais podem ser irritantes ou sensibilizantes para parte das pessoas com pele sensível.",
      },
      evidence: "moderate",
    },
    {
      code: "sensitive_fragrance_allergens",
      dimension: "profile_fit",
      when: { profile: { sensitive: true }, ingredient: { flagsAny: ["eu_declarable_allergen"] } },
      effect: {
        kind: "attention",
        points: -5,
        aggregate: "sum",
        maxPoints: 12,
        title: "Alérgenos de fragrância",
        message:
          "Contém {ingredients}, componentes de fragrância que a regulação europeia exige declarar por serem alérgenos conhecidos.",
      },
      evidence: "high",
    },
    {
      code: "sensitive_drying_alcohol",
      dimension: "profile_fit",
      when: { profile: { sensitive: true }, ingredient: { flagsAny: ["drying_alcohol"] } },
      effect: {
        kind: "attention",
        points: -10,
        positionScaling: true,
        title: "Álcool e pele sensível",
        message: "Contém {ingredients}. Em concentração alta, pode ressecar e incomodar peles sensíveis.",
      },
      evidence: "moderate",
    },
    {
      code: "dry_drying_alcohol",
      dimension: "profile_fit",
      when: {
        profile: { skinTypesAny: ["dry"], concernsAny: ["dryness"] },
        ingredient: { flagsAny: ["drying_alcohol"] },
      },
      effect: {
        kind: "attention",
        points: -12,
        positionScaling: true,
        title: "Álcool e pele seca",
        message: "Contém {ingredients}, que pode aumentar a sensação de ressecamento, principalmente se estiver entre os primeiros ingredientes.",
      },
      evidence: "moderate",
    },
    {
      code: "sensitive_active_exfoliants",
      dimension: "profile_fit",
      when: {
        profile: { sensitive: true },
        ingredient: { flagsAny: ["exfoliant_aha", "exfoliant_bha", "retinoid"] },
      },
      effect: {
        kind: "attention",
        points: -8,
        positionScaling: true,
        title: "Ativo potente para pele sensível",
        message:
          "Contém {ingredients}. Ativos esfoliantes e retinoides podem irritar no início; em pele sensível, costuma-se introduzir aos poucos.",
      },
      evidence: "moderate",
    },
    {
      code: "acne_prone_comedogenic_potential",
      dimension: "profile_fit",
      when: {
        profile: { skinTypesAny: ["oily"], concernsAny: ["acne", "blackheads"] },
        ingredient: { concernTagsAny: ["comedogenic_potential"] },
      },
      effect: {
        kind: "attention",
        points: -8,
        positionScaling: true,
        title: "Ingrediente com possível potencial comedogênico",
        message:
          "Contém {ingredients}. Há relatos de que pode obstruir poros em peles com tendência a acne, mas a evidência é limitada e depende muito da fórmula.",
      },
      evidence: "low",
    },
    {
      code: "dry_emollients",
      dimension: "profile_fit",
      when: {
        profile: { skinTypesAny: ["dry"], concernsAny: ["dryness"] },
        ingredient: { benefitTagsAny: ["emollient", "occlusive"], maxPosition: 12 },
      },
      effect: {
        kind: "positive",
        points: 10,
        positionScaling: true,
        title: "Textura nutritiva para pele seca",
        message: "Tem ingredientes emolientes como {ingredient}, que ajudam a deixar a pele macia e reduzir a perda de água.",
      },
      evidence: "high",
    },
    {
      code: "oily_matte_finish",
      dimension: "profile_fit",
      when: {
        profile: { skinTypesAny: ["oily", "combination"], concernsAny: ["oiliness"] },
        product: { attributeEquals: { finish: "matte" } },
      },
      effect: {
        kind: "positive",
        points: 10,
        title: "Acabamento adequado para pele oleosa",
        message: "Acabamento matte (declarado pela marca) costuma ser preferido por quem tem pele oleosa.",
      },
      evidence: "moderate",
    },
    {
      code: "dry_matte_finish",
      dimension: "profile_fit",
      when: { profile: { skinTypesAny: ["dry"] }, product: { attributeEquals: { finish: "matte" } } },
      effect: {
        kind: "attention",
        points: -6,
        title: "Acabamento matte em pele seca",
        message: "Acabamento matte pode destacar áreas ressecadas em pele seca.",
      },
      evidence: "low",
    },

    // ---------------- benefits ----------------
    {
      code: "benefit_hydration",
      dimension: "benefits",
      when: {
        profile: { skinTypesAny: ["dry", "combination"], concernsAny: ["dryness"] },
        ingredient: { benefitTagsAny: ["hydration"] },
      },
      effect: {
        kind: "positive",
        points: 20,
        positionScaling: true,
        title: "Ajuda na hidratação",
        message: "Contém {ingredients}, que ajudam a atrair e reter água na pele.",
      },
      evidence: "high",
    },
    {
      code: "benefit_barrier",
      dimension: "benefits",
      when: {
        profile: { skinTypesAny: ["dry"], concernsAny: ["dryness", "irritation", "redness"] },
        ingredient: { benefitTagsAny: ["barrier_support"] },
      },
      effect: {
        kind: "positive",
        points: 20,
        positionScaling: true,
        title: "Apoio à barreira da pele",
        message: "Contém {ingredients}, associados ao fortalecimento da barreira cutânea.",
      },
      evidence: "high",
    },
    {
      code: "benefit_barrier_sensitive",
      dimension: "benefits",
      when: { profile: { sensitive: true }, ingredient: { benefitTagsAny: ["barrier_support", "soothing"] } },
      effect: {
        kind: "positive",
        points: 12,
        positionScaling: true,
        title: "Ingredientes calmantes/de barreira",
        message: "Contém {ingredients}, que podem ajudar peles sensíveis a se manterem confortáveis.",
      },
      evidence: "moderate",
    },
    {
      code: "benefit_oil_control",
      dimension: "benefits",
      when: {
        profile: { skinTypesAny: ["oily", "combination"], concernsAny: ["oiliness"] },
        ingredient: { benefitTagsAny: ["oil_control"] },
      },
      effect: {
        kind: "positive",
        points: 15,
        positionScaling: true,
        title: "Pode ajudar no controle da oleosidade",
        message: "Contém {ingredients}, associados à redução do aspecto oleoso.",
      },
      evidence: "moderate",
    },
    {
      code: "benefit_acne",
      dimension: "benefits",
      when: { profile: { concernsAny: ["acne", "blackheads"] }, ingredient: { benefitTagsAny: ["acne_support"] } },
      effect: {
        kind: "positive",
        points: 20,
        positionScaling: true,
        title: "Ingrediente útil para acne e cravos",
        message:
          "Contém {ingredients}, com evidência de ajudar em poros obstruídos e acne leve. Não substitui tratamento dermatológico.",
      },
      evidence: "moderate",
    },
    {
      code: "benefit_soothing",
      dimension: "benefits",
      when: { profile: { concernsAny: ["redness", "irritation"] }, ingredient: { benefitTagsAny: ["soothing"] } },
      effect: {
        kind: "positive",
        points: 15,
        positionScaling: true,
        title: "Ingredientes calmantes",
        message: "Contém {ingredients}, que podem ajudar a acalmar a pele.",
      },
      evidence: "moderate",
    },
    {
      code: "benefit_dark_spots",
      dimension: "benefits",
      when: { profile: { concernsAny: ["dark_spots"] }, ingredient: { benefitTagsAny: ["brightening"] } },
      effect: {
        kind: "positive",
        points: 20,
        positionScaling: true,
        title: "Pode ajudar com manchas",
        message: "Contém {ingredients}, estudados para uniformizar o tom da pele. Resultados dependem de concentração e uso contínuo.",
      },
      evidence: "moderate",
    },
    {
      code: "benefit_aging",
      dimension: "benefits",
      when: { profile: { concernsAny: ["aging"] }, ingredient: { benefitTagsAny: ["anti_aging"] } },
      effect: {
        kind: "positive",
        points: 20,
        positionScaling: true,
        title: "Ingredientes para sinais de envelhecimento",
        message: "Contém {ingredients}, com estudos em textura e linhas finas.",
      },
      evidence: "high",
    },
    {
      code: "benefit_uv_protection",
      dimension: "benefits",
      when: { profile: { concernsAny: ["aging", "dark_spots"] }, ingredient: { flagsAny: ["uv_filter"] } },
      effect: {
        kind: "positive",
        points: 15,
        title: "Proteção solar",
        message: "Contém filtros UV como {ingredient}. Proteção solar diária é uma das medidas com melhor evidência contra manchas e fotoenvelhecimento.",
      },
      evidence: "high",
    },
    {
      code: "benefit_antioxidant",
      dimension: "benefits",
      when: { profile: { concernsAny: ["aging", "dullness"] }, ingredient: { benefitTagsAny: ["antioxidant"] } },
      effect: {
        kind: "positive",
        points: 8,
        positionScaling: true,
        title: "Antioxidantes",
        message: "Contém {ingredients}, com ação antioxidante.",
      },
      evidence: "moderate",
    },
    {
      code: "benefit_dullness",
      dimension: "benefits",
      when: { profile: { concernsAny: ["dullness"] }, ingredient: { benefitTagsAny: ["brightening", "exfoliation"] } },
      effect: {
        kind: "positive",
        points: 12,
        positionScaling: true,
        title: "Pode ajudar no viço",
        message: "Contém {ingredients}, que podem contribuir para uma pele com aspecto mais luminoso.",
      },
      evidence: "moderate",
    },

    {
      code: "dry_sensitive_strong_surfactant",
      dimension: "profile_fit",
      when: {
        profile: { skinTypesAny: ["dry"], concernsAny: ["dryness", "irritation"] },
        ingredient: { flagsAny: ["strong_surfactant"] },
      },
      effect: {
        kind: "attention",
        points: -10,
        positionScaling: true,
        title: "Limpeza forte para pele seca",
        message: "Contém {ingredients}, um tensoativo de limpeza forte que pode ressecar.",
      },
      evidence: "high",
    },

    // ---------------- general (vale para qualquer perfil) ----------------
    {
      code: "general_known_sensitizer",
      dimension: "general",
      when: { ingredient: { flagsAny: ["known_sensitizer"] } },
      effect: {
        kind: "attention",
        points: -20,
        title: "Conservante com alta taxa de alergia",
        message:
          "Contém {ingredients}, conservante(s) com taxa de alergia de contato bem documentada. Em produtos com enxágue a exposição é menor.",
      },
      evidence: "high",
    },
    {
      code: "general_formaldehyde_releaser",
      dimension: "general",
      when: { ingredient: { flagsAny: ["formaldehyde_releaser"] } },
      effect: {
        kind: "attention",
        points: -10,
        title: "Liberador de formaldeído",
        message: "Contém {ingredients}. Relevante principalmente para quem tem alergia a formaldeído.",
      },
      evidence: "high",
    },
    {
      code: "general_fragrance_allergens",
      dimension: "general",
      when: { ingredient: { flagsAny: ["eu_declarable_allergen"] } },
      effect: {
        kind: "attention",
        points: -4,
        aggregate: "sum",
        maxPoints: 12,
        title: "Alérgenos de fragrância declaráveis",
        message:
          "Contém {ingredients}. A maioria das pessoas tolera bem, mas são alérgenos conhecidos para quem já é sensibilizado.",
      },
      evidence: "high",
    },
    {
      code: "general_sun_sensitivity_info",
      dimension: "general",
      when: { ingredient: { flagsAny: ["exfoliant_aha", "retinoid"] } },
      effect: {
        kind: "info",
        points: 0,
        title: "Use protetor solar",
        message: "Contém {ingredients}, que podem aumentar a sensibilidade da pele ao sol. Use protetor solar durante o dia.",
      },
      evidence: "high",
    },
  ],
});
