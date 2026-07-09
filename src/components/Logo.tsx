import { Link } from 'react-router-dom'
import { COMPANY } from '@/lib/constants'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

export function Logo({ className = 'h-12' }: { className?: string }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <OptimizedImage
        src={`${import.meta.env.BASE_URL}logo-transparent.png`}
        alt={COMPANY.name}
        eager
        className={`${className} w-auto object-contain`}
      />
    </Link>
  )
}
