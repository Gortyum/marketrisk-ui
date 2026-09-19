export default function Footer({ footVer }) {
  return (
    <footer className="foot" id="settings">
      <span className="tag tag--hot">market-risk</span>
      <span className="sp" />
      <span className="tag tag--hot" id="footVer">{footVer}</span>
    </footer>
  )
}