import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'

interface ContentContextValue {
  loaded: boolean
  getText: (key: string, fallback: string) => string
  getImage: (key: string, fallback: string) => string
  saveText: (key: string, value: string) => Promise<void>
  saveImage: (key: string, file: File) => Promise<string>
}

const ContentContext = createContext<ContentContextValue | undefined>(undefined)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('site_content')
      .select('key,value')
      .then(({ data, error }) => {
        if (!active) return
        if (!error && data) {
          const map: Record<string, string> = {}
          for (const row of data as { key: string; value: string | null }[]) {
            if (row.value != null) map[row.key] = row.value
          }
          setContent(map)
        }
        setLoaded(true)
      })

    const channel = supabase
      .channel('site-content-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, () => {
        supabase.from('site_content').select('key,value').then(({ data }) => {
          if (!data) return
          const map: Record<string, string> = {}
          for (const row of data as { key: string; value: string | null }[]) {
            if (row.value != null) map[row.key] = row.value
          }
          setContent(map)
        })
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  const getText = useCallback(
    (key: string, fallback: string) => content[key] ?? fallback,
    [content],
  )

  const getImage = useCallback(
    (key: string, fallback: string) => content[key] ?? fallback,
    [content],
  )

  const saveText = useCallback(async (key: string, value: string) => {
    const { error } = await supabase
      .from('site_content')
      .upsert({ key, type: 'text', value }, { onConflict: 'key' })
    if (error) throw error
    setContent((prev) => ({ ...prev, [key]: value }))
  }, [])

  const saveImage = useCallback(async (key: string, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${key.replace(/[^a-z0-9-_]/gi, '_')}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('site-images')
      .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('site-images').getPublicUrl(path)
    const publicUrl = data.publicUrl

    const { error: dbError } = await supabase
      .from('site_content')
      .upsert({ key, type: 'image', value: publicUrl }, { onConflict: 'key' })
    if (dbError) throw dbError

    setContent((prev) => ({ ...prev, [key]: publicUrl }))
    return publicUrl
  }, [])

  const value = useMemo(
    () => ({ loaded, getText, getImage, saveText, saveImage }),
    [loaded, getText, getImage, saveText, saveImage],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within a ContentProvider')
  return ctx
}
