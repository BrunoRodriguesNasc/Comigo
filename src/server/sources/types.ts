/** Contrato de qualquer fonte externa de produtos. Nova fonte = novo adaptador. */
export interface ExternalProduct {
  externalId: string;
  barcode: string;
  name: string;
  brandName: string | null;
  ingredientsRaw: string | null;
  imageUrl: string | null;
  country: string | null;
  sourceUrl: string | null;
}

export interface ProductSource {
  /** Deve existir uma linha em `Source` com esta key. */
  key: string;
  lookupByBarcode(barcode: string): Promise<ExternalProduct | null>;
}
