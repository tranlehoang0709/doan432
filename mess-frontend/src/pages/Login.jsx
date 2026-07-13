import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthShell from '../components/auth/AuthShell'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { loginApi, saveAuthSession } from '../api/authApi'

export default function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    phone: '',
    password: ''
  })

  const [loading, setLoading] = useState(false)

  const updateField = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const data = await loginApi(form)
      saveAuthSession(data)
      navigate('/chat')
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Đăng nhập bằng số điện thoại."
    >
      <form 
        className="auth-form" 
        onSubmit={handleSubmit}
      >
        <Input
          label="Số điện thoại"
          name="phone"
          value={form.phone}
          onChange={updateField}
          placeholder="Nhập số điện thoại"
        />
        <Input
          label="Mật khẩu"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          placeholder="Nhập mật khẩu"
        />
        <Button 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
        <p className="auth-switch">
          Chưa có tài khoản? 
          <Link to="/register">
            Tạo tài khoản
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}