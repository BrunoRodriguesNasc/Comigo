/**
 * Fotografia editorial (Unsplash). DESIGN.md: a imagem é o assunto — sangra no container, sem moldura.
 *
 * Critério de escolha: SEM marcas reais visíveis. Um app que avalia cosméticos não pode sugerir
 * endosso a produtos específicos na vitrine. URLs verificadas (HTTP 200) e conteúdo conferido.
 * Para produção, prefira fotografia própria hospedada no projeto.
 */
const unsplash = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export interface Photo {
  src: string;
  alt: string;
}

export const PHOTOS = {
  hero: {
    src: unsplash("1617897903246-719242758050", 2000),
    alt: "Frasco de sérum com conta-gotas sobre bandeja de madeira, tecido de linho e ramo de eucalipto",
  },
  home: {
    src: unsplash("1570172619644-dfd03ed5d881", 1200),
    alt: "Pessoa de olhos fechados recebendo aplicação de máscara facial com pincel",
  },
  ritual: {
    src: unsplash("1596462502278-27bfdc403348", 1400),
    alt: "Pincéis, batom, máscara de cílios e pó compacto dispostos sobre fundo bege",
  },
} satisfies Record<string, Photo>;
