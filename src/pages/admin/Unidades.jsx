import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card, Button, Input, Table, Badge, Modal, SectionTitle, Spinner } from '../../components/ui'
import { getUnidades, createUnidade, updateUnidade } from '../../services/firestore'
import { Building2, Plus, Search, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { cnpj: '', nome: '', email: '', ativa: true }

export default function Unidades() {
  const [unidades, setUnidades] = useState([])
  const [filtro,   setFiltro]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editando, setEditando] = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    getUnidades().then(setUnidades).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtradas = unidades.filter(u =>
    u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.cnpj.includes(filtro)
  )

  function abrirCriar() {
    setEditando(null)
    setForm(EMPTY)
    setModal(true)
  }

  function abrirEditar(u) {
    setEditando(u)
    setForm({ cnpj: u.cnpj, nome: u.nome, email: u.email || '', ativa: u.ativa })
    setModal(true)
  }

  async function salvar() {
    if (!form.cnpj || !form.nome) return toast.error('CNPJ e Nome são obrigatórios')
    setSaving(true)
    try {
      if (editando) {
        await updateUnidade(editando.id, form)
        toast.success('Unidade atualizada!')
      } else {
        await createUnidade(form)
        toast.success('Unidade criada!')
      }
      setModal(false)
      load()
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtiva(u) {
    await updateUnidade(u.id, { ativa: !u.ativa })
    toast.success(u.ativa ? 'Unidade desativada' : 'Unidade ativada')
    load()
  }

  const columns = [
    { key: 'cnpj',  label: 'CNPJ',  render: r => <span className="font-mono text-xs">{r.cnpj}</span> },
    { key: 'nome',  label: 'Nome' },
    { key: 'email', label: 'E-mail', render: r => <span className="text-xs text-surface-200">{r.email || '—'}</span> },
    { key: 'ativa', label: 'Status', render: r => (
      <Badge
        label={r.ativa ? 'Ativa' : 'Inativa'}
        color={r.ativa ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-100 text-surface-200'}
      />
    )},
    { key: 'acoes', label: '', render: r => (
      <div className="flex items-center gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => abrirEditar(r)}>
          <Pencil size={13} /> Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toggleAtiva(r)}>
          {r.ativa ? <ToggleRight size={13} className="text-emerald-600" /> : <ToggleLeft size={13} />}
          {r.ativa ? 'Desativar' : 'Ativar'}
        </Button>
      </div>
    )},
  ]

  return (
    <AdminLayout>
      <SectionTitle
        title="Unidades"
        subtitle={`${unidades.length} unidades cadastradas`}
        action={
          <Button onClick={abrirCriar}>
            <Plus size={15} /> Nova Unidade
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-brand-300 font-body"
          />
        </div>
      </Card>

      {loading ? <Spinner /> : (
        <Card>
          <Table
            columns={columns}
            data={filtradas}
            emptyMessage="Nenhuma unidade encontrada."
          />
        </Card>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editando ? 'Editar Unidade' : 'Nova Unidade'}
      >
        <div className="space-y-4">
          <Input
            label="CNPJ"
            value={form.cnpj}
            onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
            placeholder="0000-00"
          />
          <Input
            label="Nome da Unidade"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="N Sra do Livramento - Centro"
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="paroquia@gmail.com"
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativa"
              checked={form.ativa}
              onChange={e => setForm(f => ({ ...f, ativa: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="ativa" className="text-sm text-surface-800">Unidade ativa</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={salvar}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
