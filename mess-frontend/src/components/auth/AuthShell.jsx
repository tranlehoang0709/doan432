export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand-mark">✈</div>
        <p className="eyebrow">Mess App · Frontend UI</p>
        <h1>
          <span>Chất lượng tạo niềm tin</span>
          <span>Uy tín làm nên thương hiệu.</span>
        </h1>
        <p>
          Dịch vụ Tận tâm – Hỗ trợ Nhanh – Giá cả Hợp lý - Liên hệ chúng tôi ngay qua
          <br></br>
          <span>Hotline: 0898840964 - Anh Hoàng(trọc)</span>
          <br></br>
          <span>Email:tranlehoang205@gmail.com</span>
        </p>

        <div className="hero-phone">
          <div className="hero-phone-header">
            <span className="hero-dot" />
            <strong>Nhóm đồ án ứng dụng nhắn tin</strong>
            <small>online</small>
          </div>
          <div className="hero-messages">
            <div className="hero-message incoming">FE làm giao diện trước nha?</div>
            <div className="hero-message outgoing">Ở đâu khó, ở đó có chúng tôi</div>
            <div className="hero-message incoming small">Chòi peak quá zậy !!!</div>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-logo-row">
          <div className="brand-mark small">✈</div>
          <span>Mess App</span>
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
      </section>
    </main>
  )
}
