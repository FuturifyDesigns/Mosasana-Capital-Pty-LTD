import { motion } from 'framer-motion'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { buildWhatsAppGeneralUrl } from '@/lib/whatsapp'

export function WhatsAppButton() {
  return (
    <motion.a
      href={buildWhatsAppGeneralUrl()}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-600/30 transition hover:bg-[#1da851]"
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </motion.a>
  )
}
