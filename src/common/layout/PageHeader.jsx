export default function PageHeader({ title, subtitle, className = '' }) {
  return (
    <div className={className}>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle mt-2">{subtitle}</p>}
    </div>
  )
}
