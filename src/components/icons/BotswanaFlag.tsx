import type { SVGProps } from 'react'

/** Flag of Botswana: light blue field with a central black band fimbriated white (9:1:4:1:9). */
export function BotswanaFlag({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 36 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Flag of Botswana"
      {...props}
    >
      <rect width="36" height="24" fill="#75AADB" />
      <rect y="9" width="36" height="6" fill="#FFFFFF" />
      <rect y="10" width="36" height="4" fill="#000000" />
    </svg>
  )
}
