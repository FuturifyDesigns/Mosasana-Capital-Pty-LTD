import { Link } from 'react-router-dom'
import { COMPANY } from '@/lib/constants'

export function Logo({ className = 'h-12' }: { className?: string }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img
        src={`${import.meta.env.BASE_URL}logo-transparent.png`}
        alt={COMPANY.name}
        decoding="async"
        className={`${className} w-auto object-contain`}
      />
    </Link>
  )
}
