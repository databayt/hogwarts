'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
  accounts: any[]
}

export function DoughnutChart({ accounts }: DoughnutChartProps) {
  const accountNames = accounts.map((a) => a.name)
  const balances = accounts.map((a) => Number(a.currentBalance))

  const data = {
    datasets: [
      {
        data: balances,
        backgroundColor: [
          '#0747b6',
          '#2265d8',
          '#2f91fa',
          '#61b3ff',
          '#91caff',
        ],
        borderWidth: 0,
      }
    ],
    labels: accountNames
  }

  const options = {
    cutout: '60%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = '$' + context.parsed.toFixed(2)
            return label + ': ' + value
          }
        }
      }
    }
  }

  return (
    <Doughnut
      data={data}
      options={options}
    />
  )
}