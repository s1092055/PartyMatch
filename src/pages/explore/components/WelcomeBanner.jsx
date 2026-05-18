export default function WelcomeBanner({ userName = '' }) {
  return (
    <div className="pb-5 pt-2">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        {userName ? `歡迎回來，${userName}` : '探索群組'}
      </h1>
      <p className="mt-1 text-sm text-ink-3">找到適合你的共享訂閱</p>
    </div>
  )
}
