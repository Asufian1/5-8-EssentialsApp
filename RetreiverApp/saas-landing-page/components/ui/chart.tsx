// components/ui/chart.tsx
import type React from "react"

interface BarChartProps {
  data: { name: string; value: number }[]
  index: string
  categories: string[]
  colors: string[]
  valueFormatter?: (value: number) => string
  layout?: "vertical" | "horizontal"
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  index,
  categories,
  colors,
  valueFormatter,
  layout = "horizontal",
}) => {
  const maxValue = Math.max(...data.map((item) => item.value))

  return (
    <div className="w-full h-full">
      {data.map((item, i) => (
        <div key={i} className="flex items-center space-x-2">
          <div className="w-24 text-sm">{item.name}</div>
          <div className="relative w-full bg-gray-200 rounded-full h-4">
            <div
              className={`absolute left-0 top-0 h-4 rounded-full ${colors[0] === "primary" ? "bg-primary" : colors[0]} `}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            ></div>
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-700">
              {valueFormatter ? valueFormatter(item.value) : item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

interface LineChartProps {
  data: { date: string; count: number }[]
  index: string
  categories: string[]
  colors: string[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  index,
  categories,
  colors,
  valueFormatter,
  showLegend = true,
}) => {
  return (
    <div className="w-full h-full">
      {/* Placeholder for LineChart */}
      <div>Line Chart Placeholder</div>
      <div>
        {data.map((item, i) => (
          <div key={i}>
            {item.date}: {item.count}
          </div>
        ))}
      </div>
    </div>
  )
}

