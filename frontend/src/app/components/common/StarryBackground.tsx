// Flag to toggle starry background UI effect (Set to false locally, toggle to true before pushing to GitHub)
const ENABLE_STARRY_BACKGROUND = false;

export default function StarryBackground() {
  if (!ENABLE_STARRY_BACKGROUND) return null;

  return (
    <div className="starry-bg-container">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
      <div className="starry-overlay-img"></div>
    </div>
  );
}
