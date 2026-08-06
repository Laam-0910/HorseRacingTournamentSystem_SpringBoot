// Flag to toggle starry background UI effect
const ENABLE_STARRY_BACKGROUND = true;

export default function StarryBackground() {
  if (!ENABLE_STARRY_BACKGROUND) {
    return (
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "url('/anhngua1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.3) contrast(1.1)",
          zIndex: 1
        }}
      />
    );
  }

  return (
    <div className="starry-bg-container">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
      <div className="starry-overlay-img"></div>
    </div>
  );
}
