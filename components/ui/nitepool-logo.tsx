import Svg, { Circle, Line, G, Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

/**
 * NitePool logo — centre "group of people" node connected by lines to
 * three outer nodes arranged in a triangle: food, drinks, transport.
 */
export function NitePoolLogo({ size = 64, color = '#FFFFFF' }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.65;
  const nodeR = size * 0.22;
  const centerR = size * 0.24;
  const iconScale = size / 48; // icons are authored at size=64, scale up

  // Three outer nodes in a triangle (top, bottom-left, bottom-right)
  const nodes = [
    { x: cx, y: cy - outerR },                                          // top — food
    { x: cx - outerR * Math.cos(Math.PI / 6), y: cy + outerR * 0.5 },  // bottom-left — drinks
    { x: cx + outerR * Math.cos(Math.PI / 6), y: cy + outerR * 0.5 },  // bottom-right — transport
  ];

  const pad = outerR + nodeR + 4;
  const viewSize = pad * 2;
  const vOff = cx - pad; // offset so centre stays at cx,cy in local coords

  return (
    <Svg width={size} height={size} viewBox={`${vOff} ${vOff} ${viewSize} ${viewSize}`}>

      <G>
        {/* Triangle edges connecting the three outer nodes */}
        {[
          [0, 1],
          [1, 2],
          [2, 0],
        ].map(([a, b]) => (
          <Line
            key={`edge-${a}-${b}`}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={color}
            strokeWidth={1.2}
            strokeOpacity={0.2}
          />
        ))}

        {/* Lines from centre to each outer node */}
        {nodes.map((n, i) => (
          <Line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={n.x}
            y2={n.y}
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.45}
          />
        ))}

        {/* Centre node — group/people icon */}
        <Circle cx={cx} cy={cy} r={centerR} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} />
        <G transform={`translate(${cx}, ${cy}) scale(${iconScale})`}>
          {/* Three-person group icon, centred at origin */}
          {/* Centre person */}
          <Circle cx={0} cy={-4} r={2.8} fill={color} />
          <Path d="M-4 4 Q0 -1 4 4" fill={color} />
          {/* Left person (smaller) */}
          <Circle cx={-7} cy={-2.5} r={2.2} fill={color} fillOpacity={0.75} />
          <Path d="M-10 3.5 Q-7 -0.5 -4 3.5" fill={color} fillOpacity={0.75} />
          {/* Right person (smaller) */}
          <Circle cx={7} cy={-2.5} r={2.2} fill={color} fillOpacity={0.75} />
          <Path d="M4 3.5 Q7 -0.5 10 3.5" fill={color} fillOpacity={0.75} />
        </G>

        {/* Top node — food (fork & knife) */}
        <Circle cx={nodes[0].x} cy={nodes[0].y} r={nodeR} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.2} />
        <G transform={`translate(${nodes[0].x}, ${nodes[0].y}) scale(${iconScale})`}>
          {/* Fork */}
          <Path
            d="M-3 -5 L-3 -1 Q-3 1 -3 2 L-3 5"
            stroke={color}
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
          />
          <Line x1={-3} y1={-5} x2={-3} y2={-3} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
          <Line x1={-5} y1={-5} x2={-5} y2={-2} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
          <Line x1={-1} y1={-5} x2={-1} y2={-2} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
          <Path d="M-5 -2 Q-3 0 -1 -2" stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" />
          {/* Knife */}
          <Path
            d="M3 -5 Q5 -3 5 -1 L3 1 L3 5"
            stroke={color}
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* Bottom-left node — drinks (wine glass & beer) */}
        <Circle cx={nodes[1].x} cy={nodes[1].y} r={nodeR} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.2} />
        <G transform={`translate(${nodes[1].x}, ${nodes[1].y}) scale(${iconScale})`}>
          {/* Wine glass */}
          <Path
            d="M-4 -5 L-2 -1 L-2 3 M-4 3 L0 3 M-4 -5 L0 -5 L-2 -1"
            stroke={color}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Beer mug */}
          <Path
            d="M2 -3 L2 4 L6 4 L6 -3 Z"
            stroke={color}
            strokeWidth={1.2}
            strokeLinejoin="round"
            fill="none"
          />
          <Line x1={6} y1={-1} x2={7.5} y2={-1} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={7.5} y1={-1} x2={7.5} y2={2} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={7.5} y1={2} x2={6} y2={2} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          {/* Foam line */}
          <Line x1={2} y1={-1.5} x2={6} y2={-1.5} stroke={color} strokeWidth={1} strokeOpacity={0.6} />
        </G>

        {/* Bottom-right node — transport (car) */}
        <Circle cx={nodes[2].x} cy={nodes[2].y} r={nodeR} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.2} />
        <G transform={`translate(${nodes[2].x}, ${nodes[2].y}) scale(${iconScale})`}>
          {/* Car body */}
          <Path
            d="M-7 1 L-5 -3 L5 -3 L7 1 L7 3 L-7 3 Z"
            stroke={color}
            strokeWidth={1.2}
            strokeLinejoin="round"
            fill="none"
          />
          {/* Roof / windshield */}
          <Path
            d="M-3 -3 L-1.5 -6 L4 -6 L5 -3"
            stroke={color}
            strokeWidth={1.2}
            strokeLinejoin="round"
            fill="none"
          />
          {/* Wheels */}
          <Circle cx={-4} cy={3.5} r={1.8} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.2} />
          <Circle cx={4} cy={3.5} r={1.8} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.2} />
        </G>
      </G>
    </Svg>
  );
}
