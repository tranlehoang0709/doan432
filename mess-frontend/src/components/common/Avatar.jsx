export default function Avatar({ src, name, size = 'md', online = false }) {
  const getInitials = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  const getBgColor = (text) => {
    if (!text) return 'var(--telegram)';
    const colors = [
      '#2aabee', // Telegram blue
      '#43a047', // Green
      '#e53935', // Red
      '#fb8c00', // Orange
      '#8e24aa', // Purple
      '#00acc1', // Cyan
      '#d81b60', // Pink
    ];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const bgColor = getBgColor(name);

  return (
    <div className={`avatar avatar-${size}`}>
      {src ? (
        <img src={src} alt={name} />
      ) : (
        <div 
          className="avatar-initials" 
          style={{ 
            backgroundColor: bgColor,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            width: '100%',
            height: '100%',
            fontWeight: 'bold',
            fontSize: size === 'lg' ? '32px' : size === 'sm' ? '12px' : '16px',
            textTransform: 'uppercase'
          }}
        >
          {initials}
        </div>
      )}
      {online && <span className="avatar-status" />}
    </div>
  )
}
