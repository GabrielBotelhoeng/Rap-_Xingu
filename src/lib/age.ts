/** Confirmação de maioridade guardada no localStorage (PROJETO.md: age gate +18). */
export const AGE_KEY = "rx:maioridade";

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "setItem">;

export function hasConfirmedAge(storage: ReadStorage | null): boolean {
  try {
    return Boolean(storage?.getItem(AGE_KEY));
  } catch {
    return false;
  }
}

/** Retorna `false` se o navegador bloquear o armazenamento (aba anônima, cookies desligados). */
export function rememberAge(storage: WriteStorage | null, now = new Date()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(AGE_KEY, now.toISOString());
    return true;
  } catch {
    return false;
  }
}

export function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
