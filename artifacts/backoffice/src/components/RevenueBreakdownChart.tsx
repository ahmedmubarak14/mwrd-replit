import { useMemo, useState } from "react";
import type { MonthlyRevenuePoint } from "@workspace/api-client-react";

const PADDING = { top: 24, right: 56, bottom: 30, left: 56 };
const HEIGHT = 240;
const BAR_COLOR = "rgb(255, 109, 67)";
const LINE_COLOR = "rgb(7, 148, 85)";
const AXIS_COLOR = "rgb(208, 213, 221)";
const GRID_COLOR = "rgb(242, 244, 247)";

function formatSAR(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${Math.round(n)}`;
}

function monthLabel(month: string) {
  // YYYY-MM → "Jan", "Feb", …
  const [, m] = month.split("-");
  const idx = parseInt(m ?? "0", 10) - 1;
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][idx] ?? month;
}

export function RevenueBreakdownChart({ data }: { data: MonthlyRevenuePoint[] }) {
  // ResponsiveContainer-ish: fixed viewBox width, scales with the parent.
  const width = Math.max(360, data.length * 80);
  const innerW = width - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  const [hover, setHover] = useState<number | null>(null);

  const { maxSales, salesTicks } = useMemo(() => {
    const maxRaw = Math.max(...data.map((d) => d.sales_sar), 1);
    // Round up to a "nice" tick — pick the next multiple of {1, 2.5, 5} × 10^n.
    const exp = Math.floor(Math.log10(maxRaw));
    const base = Math.pow(10, exp);
    const niceMax =
      maxRaw / base <= 1 ? base
      : maxRaw / base <= 2 ? 2 * base
      : maxRaw / base <= 2.5 ? 2.5 * base
      : maxRaw / base <= 5 ? 5 * base
      : 10 * base;
    return {
      maxSales: niceMax,
      salesTicks: [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax],
    };
  }, [data]);

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-[rgb(152,162,179)]">No revenue data yet.</p>;
  }

  const xStep = innerW / data.length;
  const barWidth = Math.min(36, xStep * 0.55);
  const yForSales = (sar: number) => PADDING.top + innerH - (sar / maxSales) * innerH;
  const yForMargin = (pct: number) => PADDING.top + innerH - (Math.min(pct, 100) / 100) * innerH;

  // Margin polyline path. Start at the centre of each bar slot.
  const marginPath = data
    .map((d, i) => {
      const cx = PADDING.left + xStep * i + xStep / 2;
      const cy = yForMargin(d.margin_pct);
      return `${i === 0 ? "M" : "L"}${cx.toFixed(2)},${cy.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Monthly revenue breakdown — sales bars with margin percentage line"
      >
        {/* Y grid + sales axis (left, SAR) */}
        {salesTicks.map((t, i) => {
          const y = yForSales(t);
          return (
            <g key={`grid-${i}`}>
              <line x1={PADDING.left} x2={PADDING.left + innerW} y1={y} y2={y} stroke={GRID_COLOR} strokeWidth={1} />
              <text x={PADDING.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="rgb(152,162,179)">
                {formatSAR(t)}
              </text>
            </g>
          );
        })}

        {/* Right axis: margin % */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <text
            key={`mt-${pct}`}
            x={PADDING.left + innerW + 6}
            y={yForMargin(pct) + 4}
            fontSize="10"
            fill="rgb(152,162,179)"
          >
            {pct}%
          </text>
        ))}

        {/* X axis baseline */}
        <line
          x1={PADDING.left}
          x2={PADDING.left + innerW}
          y1={PADDING.top + innerH}
          y2={PADDING.top + innerH}
          stroke={AXIS_COLOR}
          strokeWidth={1}
        />

        {/* Sales bars */}
        {data.map((d, i) => {
          const cx = PADDING.left + xStep * i + xStep / 2;
          const x = cx - barWidth / 2;
          const y = yForSales(d.sales_sar);
          const h = PADDING.top + innerH - y;
          const isHover = hover === i;
          return (
            <g
              key={d.month}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              data-testid={`chart-bar-${d.month}`}
            >
              <rect
                x={PADDING.left + xStep * i}
                y={PADDING.top}
                width={xStep}
                height={innerH}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(0, h)}
                fill={BAR_COLOR}
                opacity={isHover ? 1 : 0.85}
                rx={3}
              />
              <text
                x={cx}
                y={PADDING.top + innerH + 18}
                textAnchor="middle"
                fontSize="11"
                fill="rgb(102,112,133)"
              >
                {monthLabel(d.month)}
              </text>
            </g>
          );
        })}

        {/* Margin line + dots */}
        <path d={marginPath} stroke={LINE_COLOR} strokeWidth={2} fill="none" />
        {data.map((d, i) => {
          const cx = PADDING.left + xStep * i + xStep / 2;
          const cy = yForMargin(d.margin_pct);
          return (
            <circle key={`dot-${d.month}`} cx={cx} cy={cy} r={3.5} fill="white" stroke={LINE_COLOR} strokeWidth={2} />
          );
        })}

        {/* Hover tooltip */}
        {hover !== null && data[hover] && (() => {
          const d = data[hover]!;
          const cx = PADDING.left + xStep * hover + xStep / 2;
          const tipX = Math.min(Math.max(cx, PADDING.left + 80), PADDING.left + innerW - 80);
          const tipY = PADDING.top + 8;
          return (
            <g pointerEvents="none">
              <rect x={tipX - 80} y={tipY} width={160} height={48} rx={6} fill="white" stroke="rgb(228,231,236)" />
              <text x={tipX} y={tipY + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgb(16,24,40)">
                {monthLabel(d.month)}
              </text>
              <text x={tipX - 70} y={tipY + 32} fontSize="10" fill={BAR_COLOR}>
                ▮ {formatSAR(d.sales_sar)} SAR
              </text>
              <text x={tipX - 70} y={tipY + 44} fontSize="10" fill={LINE_COLOR}>
                — {d.margin_pct.toFixed(1)}% margin
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 px-2 mt-2 text-xs text-[rgb(102,112,133)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: BAR_COLOR }} />
          Sales (SAR)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5" style={{ background: LINE_COLOR }} />
          Margin %
        </span>
      </div>
    </div>
  );
}
