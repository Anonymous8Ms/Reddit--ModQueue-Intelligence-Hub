// ============================================================================
// PRIORITY INDICATOR COMPONENT
// ============================================================================

import { getPriorityColor, getPriorityLevel } from './api';

type Props = {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export function PriorityIndicator({ score, showLabel = true, size = 'md' }: Props) {
  const color = getPriorityColor(score);
  const level = getPriorityLevel(score);
  
  const sizes = {
    sm: { width: 24, height: 24, fontSize: 10 },
    md: { width: 32, height: 32, fontSize: 12 },
    lg: { width: 40, height: 40, fontSize: 14 },
  };

  const s = sizes[size];

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.badge,
          width: s.width,
          height: s.height,
          backgroundColor: color,
          fontSize: s.fontSize,
        }}
      >
        {score.toFixed(1)}
      </div>
      {showLabel && (
        <span style={{ ...styles.label, color }}>
          {level.toUpperCase()}
        </span>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  badge: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 600,
    fontSize: '11px',
  },
};