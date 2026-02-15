'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Sparkles, Target, Users, CheckCircle } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAuthMode, setIsAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authLoading, setAuthLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    setMounted(true)
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
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
      if (session) {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setErrorMessage('')
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      router.push('/dashboard')
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to sign in')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      setAuthLoading(false)
      return
    }
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      setSuccessMessage('Account created! Please check your email to verify your account.')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to sign up')
    } finally {
      setAuthLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading Resume Parser...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-50">
      {/* Left Section - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-2xl">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Resume Parser</h1>
              <p className="text-slate-400 text-sm">AI-Powered HR Solution</p>
            </div>
          </div>
          
          <div className="space-y-8 mt-20">
            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-slate-700 transition-colors shadow-lg">
                <Sparkles className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Analysis</h3>
                <p className="text-slate-400 leading-relaxed">
                  Advanced NLP algorithms intelligently screen resumes and match candidates to your requirements with precision
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-slate-700 transition-colors shadow-lg">
                <Target className="h-7 w-7 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Precision Matching</h3>
                <p className="text-slate-400 leading-relaxed">
                  Get detailed skill analysis, match scores, and gap identification for every candidate automatically
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-slate-700 transition-colors shadow-lg">
                <Users className="h-7 w-7 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Boost HR Productivity</h3>
                <p className="text-slate-400 leading-relaxed">
                  Streamline your hiring workflow and reduce screening time by up to 80% with automated analysis
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-slate-500 text-sm relative z-10">
          <p>© 2026 Resume Parser. Professional HR Solution.</p>
        </div>
      </div>

      {/* Right Section - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Resume Parser</h1>
              <p className="text-sm text-slate-600">AI-Powered HR</p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Welcome back
              </CardTitle>
              <CardDescription className="text-base">
                Sign in to your account or create a new one to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full" onValueChange={(v) => {
                setIsAuthMode(v as 'signin' | 'signup')
                setErrorMessage('')
                setSuccessMessage('')
              }}>
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-slate-100">
                  <TabsTrigger value="signin" className="text-base">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-base">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-5">
                    {errorMessage && (
                      <Alert variant="destructive" className="border-red-200">
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-base font-semibold">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg" 
                      disabled={authLoading}
                    >
                      {authLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-5">
                    {errorMessage && (
                      <Alert variant="destructive" className="border-red-200">
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )}
                    
                    {successMessage && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-base font-semibold">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-base font-semibold">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-base font-semibold">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg" 
                      disabled={authLoading}
                    >
                      {authLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
