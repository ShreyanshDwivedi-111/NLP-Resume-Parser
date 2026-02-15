'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 2000)
    
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        if (session) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading Resume Parser...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📄</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Resume Parser
            </h1>
            <p className="text-gray-600">
              NLP-powered resume screening for HR managers
            </p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            theme="light"
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined}
          />
        </div>
      </div>
    </div>
  )
}
