import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthShell from '../components/auth/AuthShell'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { registerApi, saveAuthSession } from '../api/authApi'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    const data = await registerApi(form)
    saveAuthSession(data)
    setLoading(false)
    navigate('/chat')
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Tạo tài khoản mới theo dữ liệu users: họ tên, số điện thoại và mật khẩu."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="Họ và tên"
          name="full_name"
          value={form.full_name}
          onChange={updateField}
          placeholder="Nguyễn Anh Minh"
          required
        />
        <Input
          label="Số điện thoại"
          name="phone"
          value={form.phone}
          onChange={updateField}
          placeholder="0901234567"
          required
        />
        <Input
          label="Mật khẩu"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          placeholder="Tối thiểu 6 ký tự"
          required
        />
        <Button type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Đăng ký'}</Button>
        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </AuthShell>
  )
}
