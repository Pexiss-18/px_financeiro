import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Database,
  Download,
  Eraser,
  FileSpreadsheet,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react'
import MonthSelector from './MonthSelector'
import AccountMenu from './AccountMenu'
import { buildTransactionsCsv } from '../utils/csv'

function IconButton({ label, onClick, children, badge = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-card flex items-center justify-center hover:scale-105 transition-transform"
    >
      {children}
      {badge && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-expense" aria-hidden="true" />
      )}
    </button>
  )
}

function Dropdown({ onClose, children }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-12 z-50 w-72 glass-card p-2 shadow-xl bg-white/90 dark:bg-slate-900/90">
        {children}
      </div>
    </>
  )
}

export default function TopBar({ title, darkMode, setDarkMode, finance, sync }) {
  const {
    selectedMonth,
    selectedYear,
    goToPreviousMonth,
    goToNextMonth,
    budgetUsedPct,
    goals,
    incomes,
    expenses,
    storageError,
    exportData,
    importData,
    resetData,
    clearData,
  } = finance
  const [openMenu, setOpenMenu] = useState(null)
  const [importFeedback, setImportFeedback] = useState(null)
  const fileInputRef = useRef(null)

  const notifications = useMemo(() => {
    const list = []
    if (storageError) {
      list.push({ tone: 'alert', text: storageError })
    }
    if (budgetUsedPct > 100) {
      list.push({
        tone: 'alert',
        text: `Orçamento do mês estourado: ${Math.round(budgetUsedPct)}% utilizado.`,
      })
    } else if (budgetUsedPct >= 80) {
      list.push({ tone: 'warn', text: `Você já usou ${Math.round(budgetUsedPct)}% do orçamento do mês.` })
    }
    goals
      .filter((g) => g.current >= g.target)
      .forEach((g) => list.push({ tone: 'success', text: `Meta "${g.name}" atingida. Parabéns!` }))
    return list
  }, [budgetUsedPct, goals, storageError])

  function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    setOpenMenu(null)
  }

  function handleExport() {
    const today = new Date().toISOString().slice(0, 10)
    downloadFile(
      JSON.stringify(exportData(), null, 2),
      'application/json',
      `px-financeiro-backup-${today}.json`
    )
  }

  function handleExportCsv() {
    const today = new Date().toISOString().slice(0, 10)
    downloadFile(
      buildTransactionsCsv(incomes, expenses),
      'text/csv;charset=utf-8',
      `px-financeiro-transacoes-${today}.csv`
    )
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importData(JSON.parse(reader.result))
        setImportFeedback({ tone: 'success', text: 'Dados importados com sucesso.' })
      } catch (error) {
        setImportFeedback({ tone: 'alert', text: error.message || 'Não foi possível ler o arquivo.' })
      }
    }
    reader.readAsText(file)
  }

  function handleReset() {
    if (window.confirm('Restaurar os dados de exemplo? Todos os lançamentos atuais serão substituídos.')) {
      resetData()
      setOpenMenu(null)
    }
  }

  function handleClear() {
    if (
      window.confirm(
        'Apagar TODOS os lançamentos, metas e orçamentos? Se a conta estiver conectada, a nuvem também será zerada. Considere exportar um backup antes.'
      )
    ) {
      clearData()
      setOpenMenu(null)
    }
  }

  const toneClasses = {
    alert: 'text-expense',
    warn: 'text-amber-500',
    success: 'text-income',
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-6 border-b border-white/20 dark:border-white/10">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2 sm:gap-3">
        <MonthSelector
          month={selectedMonth}
          year={selectedYear}
          onPrev={goToPreviousMonth}
          onNext={goToNextMonth}
        />

        <div className="relative">
          <IconButton
            label="Notificações"
            badge={notifications.length > 0}
            onClick={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')}
          >
            <Bell className="w-5 h-5" />
          </IconButton>
          {openMenu === 'notifications' && (
            <Dropdown onClose={() => setOpenMenu(null)}>
              <p className="px-3 py-2 text-sm font-semibold">Notificações</p>
              {notifications.length === 0 ? (
                <p className="px-3 pb-3 text-sm text-slate-400">Nenhuma notificação no momento.</p>
              ) : (
                <ul className="space-y-1 pb-1">
                  {notifications.map((n, index) => (
                    <li key={index} className="flex items-start gap-2 px-3 py-2 text-sm rounded-lg">
                      {n.tone === 'success' ? (
                        <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${toneClasses[n.tone]}`} />
                      ) : (
                        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${toneClasses[n.tone]}`} />
                      )}
                      <span>{n.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Dropdown>
          )}
        </div>

        <div className="relative">
          <IconButton
            label="Backup e dados"
            onClick={() => {
              setImportFeedback(null)
              setOpenMenu(openMenu === 'data' ? null : 'data')
            }}
          >
            <Database className="w-5 h-5" />
          </IconButton>
          {openMenu === 'data' && (
            <Dropdown onClose={() => setOpenMenu(null)}>
              <p className="px-3 py-2 text-sm font-semibold">Backup e dados</p>
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Download className="w-4 h-4" /> Exportar dados (JSON)
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" /> Exportar transações (CSV)
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Upload className="w-4 h-4" /> Importar dados (JSON)
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-expense hover:bg-expense/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Restaurar dados de exemplo
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-expense hover:bg-expense/10 transition-colors"
              >
                <Eraser className="w-4 h-4" /> Zerar todos os dados
              </button>
              {importFeedback && (
                <p className={`px-3 py-2 text-xs ${toneClasses[importFeedback.tone]}`}>
                  {importFeedback.text}
                </p>
              )}
            </Dropdown>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <AccountMenu
          sync={sync}
          open={openMenu === 'account'}
          onToggle={() => setOpenMenu(openMenu === 'account' ? null : 'account')}
          onClose={() => setOpenMenu(null)}
        />

        <IconButton
          label={darkMode ? 'Ativar tema claro' : 'Ativar tema escuro'}
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-500" />
          )}
        </IconButton>
      </div>
    </header>
  )
}
