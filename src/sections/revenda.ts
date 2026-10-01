/** Formulário "Seja revendedor": monta a mensagem da copy e abre o WhatsApp da fábrica. Nada é salvo em servidor. */
import { SITE } from "@/content/site";
import { buildRevendaMessage, formatCNPJ, formatPhoneBR, isValidCNPJ, isValidPhoneBR, waLink } from "@/lib/whatsapp";

const MSG = {
  required: "Preencha este campo.",
  phone: "Confira o número com DDD.",
  cnpj: "Confira o CNPJ.",
};

export function initRevenda(form: HTMLFormElement): void {
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | null;
  const success = form.querySelector<HTMLElement>("[data-revenda-success]");
  const whatsapp = field("whatsapp");
  const cnpj = field("cnpj");

  whatsapp?.addEventListener("input", () => (whatsapp.value = formatPhoneBR(whatsapp.value)));
  cnpj?.addEventListener("input", () => (cnpj.value = formatCNPJ(cnpj.value)));

  // "Pedir no WhatsApp" (catálogo) e "Quero revender este sabor" (destaques) já marcam o sabor no formulário
  document.addEventListener("click", (e) => {
    const pick = (e.target as HTMLElement).closest<HTMLElement>("[data-pick]");
    const id = pick?.dataset.pick;
    if (!id) return;
    const box = form.querySelector<HTMLInputElement>(`input[data-flavor="${CSS.escape(id)}"]`);
    if (box) box.checked = true;
  });

  function setError(input: HTMLInputElement, message: string) {
    const out = form.querySelector<HTMLElement>(`[data-error-for="${input.name}"]`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (out) out.textContent = message;
  }

  function validate(): HTMLInputElement | null {
    let firstInvalid: HTMLInputElement | null = null;
    for (const name of ["nome", "loja", "cidade", "whatsapp", "cnpj"]) {
      const input = field(name);
      if (!input) continue;
      const value = input.value.trim();
      let message = "";
      if (input.required && !value) message = MSG.required;
      else if (name === "whatsapp" && !isValidPhoneBR(value)) message = MSG.phone;
      else if (name === "cnpj" && value && !isValidCNPJ(value)) message = MSG.cnpj;
      setError(input, message);
      if (message && !firstInvalid) firstInvalid = input;
    }
    return firstInvalid;
  }

  // corrige o erro assim que a pessoa conserta o campo
  form.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.getAttribute("aria-invalid") === "true") validate();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = validate();
    if (invalid) {
      invalid.focus();
      return;
    }
    const sabores = Array.from(form.querySelectorAll<HTMLInputElement>("input[name='sabores']:checked")).map((b) => b.value);
    const text = buildRevendaMessage({
      nome: field("nome")?.value ?? "",
      loja: field("loja")?.value ?? "",
      cidade: field("cidade")?.value ?? "",
      whatsapp: whatsapp?.value ?? "",
      cnpj: cnpj?.value ?? "",
      sabores,
    });
    const url = waLink(SITE.whatsapp.main.e164, text);
    const tab = window.open(url, "_blank");
    if (tab) tab.opener = null;
    else window.location.href = url; // pop-up bloqueado: abre na mesma aba
    if (success) {
      success.hidden = false;
      success.focus();
    }
  });
}
