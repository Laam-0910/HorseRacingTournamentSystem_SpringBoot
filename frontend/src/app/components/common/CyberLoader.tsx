export default function CyberLoader({ text = "Loading System Data..." }: { text?: string }) {
  return (
    <div className="cyber-loader">
      <div className="cyber-spinner"></div>
      <span className="cyber-loader-text">{text}</span>
    </div>
  );
}
