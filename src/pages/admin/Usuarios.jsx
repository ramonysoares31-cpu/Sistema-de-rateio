import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card, Button, Input, Select, Table, Badge, Modal, SectionTitle, Spinner } from '../../components/ui'
import { getUsuarios, updateUsuario, getUnidades } from '../../services/firestore'
import { createUser, resetPassword } from '../../services/auth'
import { Plus, Pencil, KeyRound, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { nome: '', email: '', senha: '', perfil: 'colaborador', unidadeId: '', ativo: true }

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [unidades, setUnidades] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editando, setEditando] = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getUsuarios(), getUnidades()])
      .then(([u, un]) => { setUsuarios(u); setUnidades(un) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function abrirCriar() {
    setEditando(null)
    setForm(EMPTY)
    setModal(true)
  }

  function abrirEditar(u) {
    setEditando(u)
    setForm({ nome: u.nome, email: u.email, senha: '', perfil: u.perfil, unidadeId: u.unidadeId || '', ativo: u.ativo })
    setModal(true)
  }

  async function salvar() {
    if (!form.nome || !form.email) return toast.error('Nome e e-mail são obrigatórios')
    if (!editando && !form.senha) return toast.error('Senha é obrigatória para novo usuário')
    setSaving(true)
    try {
      if (editando) {
        await updateUsuario(editando.id, {
          nome: form.nome,
          perfil: form.perfil,
          unidadeId: form.unidadeId || null,
          ativo: form.ativo,
        })
        toast.success('Usuário atualizado!')
      } else {
        await createUser({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          perfil: form.perfil,
          unidadeId: form.unidadeId || null,
        })
        toast.success('Usuário criado!')
      }
      setModal(false)
      load()
    } catch (e) {
      toast.error('Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetSenha(u) {
    try {
      await resetPassword(u.email)
      toast.success('E-mail de redefinição enviado para ' + u.email)
    } catch {
      toast.error('Erro ao enviar e-mail')
    }
  }

  async function toggleAtivo(u) {
    await updateUsuario(u.id, { ativo: !u.ativo })
    toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado')
    load()
  }

  function getNomeUnidade(id) {
    return unidades.find(u => u.id === id)?.nome || '—'
  }

  const columns = [
    { key: 'nome',    label: 'Nome' },
    { key: 'email',   label: 'E-mail', render: r => <span className="text-xs">{r.email}</span> },
    { key: 'perfil',  label: 'Perfil', render: r => (
      <Badge
        label={r.perfil === 'admin' ? 'Admin' : 'Colaborador'}
        color={r.perfil === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-surface-100 text-surface-800'}
      />
    )},
    { key: 'unidade', label: 'Unidade', render: r => (
      <span className="text-xs text-surface-200 truncate max-w-[180px] block">
        {r.perfil === 'colaborador' ? getNomeUnidade(r.unidadeId) : '—'}
      </span>
    )},
    { key: 'ativo',   label: 'Status', render: r => (
      <Badge label={r.ativo ? 'Ativo' : 'Inativo'} color={r.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-100 text-surface-200'} />
    )},
    { key: 'acoes',   label: '', render: r => (
      <div className="flex items-center gap-1 justify-end">
        <Button size="sm" variant="ghost" onClick={() => abrirEditar(r)}><Pencil size={13} /></Button>
        <Button size="sm" variant="ghost" onClick={() => handleResetSenha(r)} title="Resetar senha">
          <KeyRound size={13} />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toggleAtivo(r)}>
          {r.ativo ? <ToggleRight size={13} className="text-emerald-600" /> : <ToggleLeft size={13} />}
        </Button>
      </div>
    )},
  ]

  return (
    <AdminLayout>
      <SectionTitle
        title="Usuários"
        subtitle={`${usuarios.length} usuários cadastrados`}
        action={<Button onClick={abrirCriar}><Plus size={15} /> Novo Usuário</Button>}
      />

      {loading ? <Spinner /> : (
        <Card>
          <Table columns={columns} data={usuarios} emptyMessage="Nenhum usuário cadastrado." />
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Usuário' : 'Novo Usuário'}>
        <div className="space-y-4">
          <Input label="Nome completo" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          {!editando && (
            <>
              <Input label="E-mail" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Input label="Senha inicial" type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mínimo 6 caracteres" />
            </>
          )}
          <Select label="Perfil" value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
            <option value="colaborador">Colaborador</option>
            <option value="admin">Admin</option>
          </Select>
          {form.perfil === 'colaborador' && (
            <Select label="Unidade vinculada" value={form.unidadeId} onChange={e => setForm(f => ({ ...f, unidadeId: e.target.value }))}>
              <option value="">— Selecione —</option>
              {unidades.filter(u => u.ativa).map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </Select>
          )}
          {editando && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="rounded" />
              <label htmlFor="ativo" className="text-sm text-surface-800">Usuário ativo</label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={salvar}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
