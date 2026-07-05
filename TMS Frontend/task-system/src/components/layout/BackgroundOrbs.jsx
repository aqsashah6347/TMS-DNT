// Renders the two soft blurred color orbs that drift behind every glass surface.
// This is a pure CSS animation (see .fluid-orb / @keyframes floatOrb in index.css) —
// no JS animation loop, so it's cheap on performance.
export default function BackgroundOrbs() {
  return (
    <>
      <div className="fluid-orb orb-a" />
      <div className="fluid-orb orb-b" />
    </>
  );
}