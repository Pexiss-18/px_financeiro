export function getDescriptionError(value) {
  if (!value || !value.trim()) return 'Informe uma descrição'
  return null
}

export function getNameError(value) {
  if (!value || !value.trim()) return 'Informe um nome'
  return null
}

export function getAmountError(value) {
  if (value === '' || value === null || value === undefined) return 'Informe um valor'
  const amount = Number(value)
  if (Number.isNaN(amount)) return 'O valor deve ser numérico'
  if (amount <= 0) return 'O valor deve ser maior que zero'
  return null
}

export function getDateError(value) {
  if (!value) return 'Informe uma data'
  if (Number.isNaN(new Date(value).getTime())) return 'Data inválida'
  return null
}
