/** Monta links e a mensagem do formulário "Seja revendedor". Nenhum dado vai para servidor. */

export interface RevendaData {
  nome: string;
  loja: string;
  cidade: string;
  whatsapp: string;
  cnpj?: string;
  sabores: string[];
}

/** "a", "a e b", "a, b e c" */
export function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

/**
 * Mensagem da copy: "Olá! Sou [nome], da [loja], em [cidade/UF]. Quero revender os rapés Xingu.
 * Tenho interesse em: [sabores]." CNPJ e WhatsApp informados vão em linhas separadas no fim,
 * para a fábrica já receber os dados do lojista.
 */
export function buildRevendaMessage(d: RevendaData): string {
  const clean = (s: string | undefined) => (s ?? "").trim().replace(/\s+/g, " ");
  let text = `Olá! Sou ${clean(d.nome)}, da ${clean(d.loja)}, em ${clean(d.cidade)}. Quero revender os rapés Xingu.`;
  const sabores = d.sabores.map(clean).filter(Boolean);
  if (sabores.length) text += ` Tenho interesse em: ${joinList(sabores)}.`;
  const extras: string[] = [];
  if (clean(d.cnpj)) extras.push(`CNPJ: ${clean(d.cnpj)}`);
  if (clean(d.whatsapp)) extras.push(`WhatsApp: ${clean(d.whatsapp)}`);
  return [text, ...extras].join("\n");
}

export function waLink(e164: string, text?: string): string {
  const base = `https://wa.me/${e164}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

const digits = (s: string) => s.replace(/\D/g, "");

/** (62) 99477-5811 enquanto digita; aceita fixo com 10 dígitos. */
export function formatPhoneBR(raw: string): string {
  const d = digits(raw).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  return rest.length > split ? `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}` : `(${ddd}) ${rest}`;
}

export function isValidPhoneBR(raw: string): boolean {
  const d = digits(raw);
  if (d.length !== 10 && d.length !== 11) return false;
  if (d.startsWith("0")) return false;
  return d.length === 10 || d[2] === "9";
}

/** 00.000.000/0000-00 enquanto digita. */
export function formatCNPJ(raw: string): string {
  const d = digits(raw).slice(0, 14);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 12), d.slice(12, 14)];
  let out = parts[0] ?? "";
  if (d.length > 2) out += `.${parts[1]}`;
  if (d.length > 5) out += `.${parts[2]}`;
  if (d.length > 8) out += `/${parts[3]}`;
  if (d.length > 12) out += `-${parts[4]}`;
  return out;
}

export function isValidCNPJ(raw: string): boolean {
  const d = digits(raw);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + w * Number(d[i]), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}
