import { Dimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
  Ellipse,
} from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
};

/**
 * Simplified nightlife cityscape silhouette for the auth screens.
 * Buildings, a moon/glow, stars, and small human figures.
 */
export function CityscapeIllustration({
  width = Dimensions.get('window').width,
  height = 220,
}: Props) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        {/* Ground glow gradient */}
        <LinearGradient id="groundGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C026D3" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#7C3AED" stopOpacity="0.05" />
        </LinearGradient>
        {/* Building tint */}
        <LinearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6D28D9" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#3B0764" stopOpacity="0.95" />
        </LinearGradient>
      </Defs>

      {/* Ground glow */}
      <Ellipse
        cx={width / 2}
        cy={height}
        rx={width * 0.6}
        ry={60}
        fill="url(#groundGlow)"
      />

      {/* Stars */}
      {[
        [0.1, 0.15],
        [0.25, 0.08],
        [0.4, 0.2],
        [0.55, 0.05],
        [0.7, 0.18],
        [0.85, 0.1],
        [0.15, 0.35],
        [0.6, 0.3],
        [0.9, 0.25],
        [0.35, 0.4],
      ].map(([xf, yf], i) => (
        <Circle
          key={`star-${i}`}
          cx={width * xf}
          cy={height * yf}
          r={i % 3 === 0 ? 2 : 1.2}
          fill="#FFFFFF"
          opacity={0.4 + (i % 3) * 0.2}
        />
      ))}

      {/* Buildings silhouettes — positioned relative to width */}
      <G>
        {/* Building 1 — tall left */}
        <Rect
          x={width * 0.05}
          y={height * 0.35}
          width={width * 0.08}
          height={height * 0.65}
          rx={2}
          fill="url(#buildingGrad)"
        />
        {/* Windows */}
        {[0.42, 0.52, 0.62, 0.72].map((yf, i) => (
          <Rect
            key={`w1-${i}`}
            x={width * 0.065}
            y={height * yf}
            width={width * 0.015}
            height={height * 0.03}
            fill="#FBBF24"
            opacity={0.7}
            rx={1}
          />
        ))}

        {/* Building 2 — short */}
        <Rect
          x={width * 0.15}
          y={height * 0.55}
          width={width * 0.1}
          height={height * 0.45}
          rx={2}
          fill="url(#buildingGrad)"
        />
        {[0.6, 0.7, 0.8].map((yf, i) => (
          <G key={`w2-${i}`}>
            <Rect
              x={width * 0.165}
              y={height * yf}
              width={width * 0.012}
              height={height * 0.03}
              fill="#FBBF24"
              opacity={0.6}
              rx={1}
            />
            <Rect
              x={width * 0.21}
              y={height * yf}
              width={width * 0.012}
              height={height * 0.03}
              fill="#EC4899"
              opacity={0.5}
              rx={1}
            />
          </G>
        ))}

        {/* Building 3 — tall center-left */}
        <Rect
          x={width * 0.28}
          y={height * 0.25}
          width={width * 0.07}
          height={height * 0.75}
          rx={2}
          fill="url(#buildingGrad)"
        />

        {/* Building 4 — medium center */}
        <Rect
          x={width * 0.42}
          y={height * 0.4}
          width={width * 0.12}
          height={height * 0.6}
          rx={2}
          fill="url(#buildingGrad)"
        />
        {[0.47, 0.57, 0.67, 0.77].map((yf, i) => (
          <G key={`w4-${i}`}>
            <Rect
              x={width * 0.44}
              y={height * yf}
              width={width * 0.012}
              height={height * 0.03}
              fill="#FBBF24"
              opacity={i % 2 === 0 ? 0.7 : 0.3}
              rx={1}
            />
            <Rect
              x={width * 0.5}
              y={height * yf}
              width={width * 0.012}
              height={height * 0.03}
              fill="#A78BFA"
              opacity={0.5}
              rx={1}
            />
          </G>
        ))}

        {/* Building 5 — short right */}
        <Rect
          x={width * 0.6}
          y={height * 0.5}
          width={width * 0.09}
          height={height * 0.5}
          rx={2}
          fill="url(#buildingGrad)"
        />

        {/* Building 6 — tall right */}
        <Rect
          x={width * 0.72}
          y={height * 0.3}
          width={width * 0.08}
          height={height * 0.7}
          rx={2}
          fill="url(#buildingGrad)"
        />
        {[0.37, 0.47, 0.57, 0.67].map((yf, i) => (
          <Rect
            key={`w6-${i}`}
            x={width * 0.74}
            y={height * yf}
            width={width * 0.015}
            height={height * 0.03}
            fill="#EC4899"
            opacity={0.5}
            rx={1}
          />
        ))}

        {/* Building 7 — medium far right */}
        <Rect
          x={width * 0.85}
          y={height * 0.45}
          width={width * 0.1}
          height={height * 0.55}
          rx={2}
          fill="url(#buildingGrad)"
        />
      </G>

      {/* Simplified people silhouettes — small circles + body shapes */}
      <G opacity={0.7}>
        {[
          { x: 0.2, color: '#EC4899' },
          { x: 0.3, color: '#A78BFA' },
          { x: 0.38, color: '#F97316' },
          { x: 0.55, color: '#C084FC' },
          { x: 0.65, color: '#EC4899' },
          { x: 0.78, color: '#A78BFA' },
        ].map(({ x: xf, color }, i) => {
          const px = width * xf;
          const py = height * 0.88;
          return (
            <G key={`person-${i}`}>
              {/* Head */}
              <Circle cx={px} cy={py - 10} r={4} fill={color} />
              {/* Body */}
              <Path
                d={`M${px - 4} ${py - 5} Q${px} ${py + 6} ${px + 4} ${py - 5}`}
                fill={color}
              />
            </G>
          );
        })}
      </G>

      {/* Music note accent */}
      <G opacity={0.5}>
        <Circle cx={width * 0.12} cy={height * 0.6} r={3.5} fill="#EC4899" />
        <Rect
          x={width * 0.12 + 2.5}
          y={height * 0.6 - 16}
          width={1.5}
          height={16}
          fill="#EC4899"
        />
      </G>
    </Svg>
  );
}
