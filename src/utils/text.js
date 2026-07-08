// Normaliza para busca: minúsculas e sem acentos ('Salário' -> 'salario')
export function normalizeSearchText(value) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
