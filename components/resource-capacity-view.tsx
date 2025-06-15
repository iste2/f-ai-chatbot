"use client"

import * as React from "react"
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from "./ui/chart"
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Tooltip,
  Legend,
} from "recharts"
import { FullscreenWrapper } from "./fullscreen-wrapper"

// Data type from resource-capacity-tool.ts outputSchema
// demand removed
type ResourceCapacityDatum = {
  date: string
  capacity: number
  assigned: number
}

type ResourceCapacityViewProps = {
  data: ResourceCapacityDatum[]
}

const chartConfig = {
  capacity: {
    label: "Capacity",
    color: "#22c55e", // green-500
  },
  // demand removed
  assigned: {
    label: "Assigned",
    color: "#3b82f6", // blue-500
  },
}

export function ResourceCapacityView({ data }: ResourceCapacityViewProps) {
  // demand removed
  return (
    <FullscreenWrapper>
      {(isFullscreen: boolean) => (
        <div className="overflow-x-auto">
          <div
            className={
              `overflow-y-auto border rounded bg-muted` +
              (isFullscreen ? '' : ' max-h-96')
            }
            style={isFullscreen ? {} : { maxHeight: '24rem' }}
          >
            <div className="bg-white dark:bg-gray-900 p-4">
              <ChartContainer config={chartConfig} className="w-full h-[350px]">
                <ComposedChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    minTickGap={16}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    label={{ value: "Date", position: "insideBottom", offset: -10 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    label={{ value: "Capacity [h]", angle: -90, position: "insideLeft", offset: 10 }}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="assigned"
                    name="Assigned"
                    fill={chartConfig.assigned.color}
                    barSize={18}
                    radius={[4, 4, 0, 0]}
                    opacity={0.7}
                  />
                  <Line
                    type="step"
                    dataKey="capacity"
                    name="Capacity"
                    stroke={chartConfig.capacity.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      )}
    </FullscreenWrapper>
  )
}

export default ResourceCapacityView
