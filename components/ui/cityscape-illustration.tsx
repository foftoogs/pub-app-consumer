import { Dimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  G,
  Ellipse,
} from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
};

/**
 * Simplified nightlife cityscape — fewer, larger buildings designed to sit
 * behind the logo/brand area on the auth screens. Uses low opacity so
 * overlaid text remains legible.
 */
export function CityscapeIllustration({
  width = Dimensions.get('window').width,
  height = 420,
}: Props) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="groundGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C026D3" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#7C3AED" stopOpacity="0.02" />
        </LinearGradient>
        <LinearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6D28D9" stopOpacity="0.45" />
          <Stop offset="1" stopColor="#3B0764" stopOpacity="0.55" />
        </LinearGradient>
      </Defs>

      {/* Ground glow */}
      <Ellipse
        cx={width / 2}
        cy={height}
        rx={width * 0.7}
        ry={80}
        fill="url(#groundGlow)"
      />

      {/* Stars — scattered in the upper portion */}
      {[
        [0.08, 0.06],
        [0.25, 0.03],
        [0.55, 0.02],
        [0.75, 0.08],
        [0.92, 0.04],
        [0.15, 0.15],
        [0.65, 0.12],
        [0.42, 0.1],
      ].map(([xf, yf], i) => (
        <Circle
          key={`star-${i}`}
          cx={width * xf}
          cy={height * yf}
          r={i % 3 === 0 ? 2.2 : 1.4}
          fill="#FFFFFF"
          opacity={0.3 + (i % 3) * 0.15}
        />
      ))}

      {/* 4 large buildings — spread across the width */}
      <G>
        {/* Building 1 — tall left */}
        <Rect
          x={width * 0.02}
          y={height * 0.18}
          width={width * 0.18}
          height={height * 0.82}
          rx={3}
          fill="url(#buildingGrad)"
        />
        {/* Windows — 2 columns */}
        {[0.28, 0.38, 0.48, 0.58, 0.68, 0.78].map((yf, i) => (
          <G key={`w1-${i}`}>
            <Rect
              x={width * 0.05}
              y={height * yf}
              width={width * 0.03}
              height={height * 0.035}
              fill="#FBBF24"
              opacity={i % 2 === 0 ? 0.55 : 0.25}
              rx={1}
            />
            <Rect
              x={width * 0.13}
              y={height * yf}
              width={width * 0.03}
              height={height * 0.035}
              fill="#A78BFA"
              opacity={i % 3 === 0 ? 0.45 : 0.2}
              rx={1}
            />
          </G>
        ))}

        {/* Building 2 — medium center-left */}
        <Rect
          x={width * 0.26}
          y={height * 0.35}
          width={width * 0.2}
          height={height * 0.65}
          rx={3}
          fill="url(#buildingGrad)"
        />
        {[0.44, 0.54, 0.64, 0.74].map((yf, i) => (
          <G key={`w2-${i}`}>
            <Rect
              x={width * 0.3}
              y={height * yf}
              width={width * 0.025}
              height={height * 0.035}
              fill="#EC4899"
              opacity={i % 2 === 0 ? 0.45 : 0.2}
              rx={1}
            />
            <Rect
              x={width * 0.39}
              y={height * yf}
              width={width * 0.025}
              height={height * 0.035}
              fill="#FBBF24"
              opacity={0.35}
              rx={1}
            />
          </G>
        ))}

        {/* Building 3 — tallest center-right */}
        <Rect
          x={width * 0.52}
          y={height * 0.12}
          width={width * 0.16}
          height={height * 0.88}
          rx={3}
          fill="url(#buildingGrad)"
        />
        {[0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82].map((yf, i) => (
          <Rect
            key={`w3-${i}`}
            x={width * 0.575}
            y={height * yf}
            width={width * 0.03}
            height={height * 0.035}
            fill="#FBBF24"
            opacity={i % 3 === 0 ? 0.5 : 0.18}
            rx={1}
          />
        ))}

        {/* Building 4 — wide right */}
        <Rect
          x={width * 0.74}
          y={height * 0.3}
          width={width * 0.24}
          height={height * 0.7}
          rx={3}
          fill="url(#buildingGrad)"
        />
        {[0.4, 0.52, 0.64, 0.76].map((yf, i) => (
          <G key={`w4-${i}`}>
            <Rect
              x={width * 0.78}
              y={height * yf}
              width={width * 0.025}
              height={height * 0.035}
              fill="#EC4899"
              opacity={0.35}
              rx={1}
            />
            <Rect
              x={width * 0.87}
              y={height * yf}
              width={width * 0.025}
              height={height * 0.035}
              fill="#A78BFA"
              opacity={i % 2 === 0 ? 0.4 : 0.15}
              rx={1}
            />
            <Rect
              x={width * 0.93}
              y={height * yf}
              width={width * 0.025}
              height={height * 0.035}
              fill="#FBBF24"
              opacity={0.25}
              rx={1}
            />
          </G>
        ))}
      </G>
    </Svg>
  );
}
