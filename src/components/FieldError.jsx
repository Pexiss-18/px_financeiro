export default function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-medium text-expense">{message}</p>
}
