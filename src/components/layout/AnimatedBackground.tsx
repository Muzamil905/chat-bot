type AnimatedBackgroundProps = { paused: boolean };
const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];

export function AnimatedBackground({ paused }: AnimatedBackgroundProps) {
  return (
    <div className={`animated-background ${paused ? 'paused' : ''}`} aria-hidden="true">
      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />
      <div className="perspective-scene">
        {[1, 2].map((cube) => (
          <div key={cube} className={`floating-cube cube-${cube}`}>
            {faces.map((face) => <div key={face} className={`cube-face face-${face}`} />)}
          </div>
        ))}
      </div>
      <div className="background-grid" />
    </div>
  );
}
