import type { SVGProps } from 'react'

export function CheckList3Icon({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g strokeDasharray="24">
          <path d="M11.5 5c0 -0.83 0.67 -1.5 1.5 -1.5h6c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5h-6c-0.83 0 -1.5 -0.67 -1.5 -1.5Z">
            <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="24;0" />
          </path>
          <path strokeDashoffset="24" d="M11.5 12c0 -0.83 0.67 -1.5 1.5 -1.5h6c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5h-6c-0.83 0 -1.5 -0.67 -1.5 -1.5Z">
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.3s" to="0" />
          </path>
          <path strokeDashoffset="24" d="M11.5 19c0 -0.83 0.67 -1.5 1.5 -1.5h6c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5h-6c-0.83 0 -1.5 -0.67 -1.5 -1.5Z">
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.8s" dur="0.3s" to="0" />
          </path>
        </g>
        <g strokeDasharray="12" strokeDashoffset="12" strokeWidth="2">
          <path d="M3 5l2 2l4 -4">
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.2s" dur="0.2s" to="0" />
          </path>
          <path d="M3 12l2 2l4 -4">
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" to="0" />
          </path>
          <path d="M3 19l2 2l4 -4">
            <animate fill="freeze" attributeName="stroke-dashoffset" begin="1s" dur="0.2s" to="0" />
          </path>
        </g>
      </g>
    </svg>
  )
}
