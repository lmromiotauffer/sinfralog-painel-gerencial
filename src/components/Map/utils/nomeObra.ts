// Boilerplate contratual que abre muitas descrições (jurídico repetido, não é o nome da obra):
// "Contratação de empresa … para a execução da obra de…", "O objeto do presente instrumento consiste na … de…",
// "Execução d(os serviços) de…". Corta até o último "de/da/do" desse preâmbulo.
// ponytail: heurística sobre texto livre do Qlik; nome dedicado da obra é a correção de raiz (validar com a SINFRA).
const PREFIXO_CONTRATUAL =
  /^(?:contrata[çc][aã]o de empresa|o objeto do presente instrumento|execu[çc][aã]o|servi[çc]os?)\b.*\b(?:obra|servi[çc]os?)\s+d[aeo]s?\s*(?=[a-zà-ÿ])/i;
// Onde o nome termina e começam os detalhes: travessão, "Trecho:", ": MT-xxx", "Extensão", "localizada…", "município…"
const SEPARADORES = [
  /\s[-–—]\s/,
  /,?\s*trecho\s*:/i,
  /\s*:\s*mt-?\d/i,
  /,\s*extens[aã]o/i,
  /,\s*localizad/i,
  /,\s*(?:no\s+)?munic[ií]pio/i,
];

/**
 * Nome curto da obra a partir da descrição, para título de card, lista e tooltip.
 * "Construção da Ponte de Concreto PT00001 - Córrego Pedreira, na Rodovia MT-208" → "Construção da Ponte de Concreto PT00001"
 * "Contratação de empresa … obra deImplantação e Pavimentação: MT-110, Trecho: …" → "Implantação e Pavimentação: MT-110"
 * Sem separador reconhecido (ou trecho curto demais), devolve a descrição sem o boilerplate.
 */
export const nomeCurtoObra = (descricao?: string): string => {
  const texto = (descricao ?? "").trim().replace(PREFIXO_CONTRATUAL, "");
  const corte = Math.min(
    ...SEPARADORES.map((re) => texto.search(re)).filter((i) => i > 0),
    texto.length,
  );
  const curto = texto.slice(0, corte).trim();
  const escolhido = curto.length >= 8 ? curto : (descricao ?? "").trim();
  // Preâmbulo cortado no meio pode deixar inicial minúscula
  return escolhido.charAt(0).toUpperCase() + escolhido.slice(1);
};
