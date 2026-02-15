'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  Upload, 
  Search, 
  LogOut, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  Trash2,
  RefreshCw,
  Award,
  Clock,
  AlertCircle,
  LayoutDashboard,
  FolderOpen,
  History,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  Download,
  Eye,
  MoreVertical,
  Filter,
  SortDesc,
  Sparkles
} from 'lucide-react'

interface MatchResult {
  filename: string
  score: number
  matched_skills: string[]
  missing_skills: string[]
  extracted_data: any
}

interface Resume {
  id: string
  filename: string
  name: string
  email: string
  phone: string
  skills: string[]
  created_at: string
}

interface JobSearch {
  id: string
  job_title: string
  job_description: string
  keywords: string[]
  created_at: string
}

interface MatchHistory {
  id: string
  job_search_id: string
  resume_id: string
  match_score: number
  matched_skills: string[]
  missing_skills: string[]
  created_at: string
  job_search?: JobSearch
  resume?: Resume
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [slowLoading, setSlowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('match')
  
  // Match Tab State
  const [jobDescription, setJobDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [useKeywords, setUseKeywords] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Resume Library State
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)

  // History State
  const [jobSearches, setJobSearches] = useState<JobSearch[]>([])
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
    })
  }, [])

  useEffect(() => {
    if (user) {
      if (activeTab === 'resumes') {
        loadResumes()
      } else if (activeTab === 'history') {
        loadHistory()
      }
    }
  }, [activeTab, user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? `Bearer ${session.access_token}` : ''
  }

  // Match Functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleMatch = async () => {
    if (files.length === 0) {
      alert('Please upload at least one resume')
      return
    }

    if (!useKeywords && !jobDescription) {
      alert('Please enter a job description')
      return
    }

    if (useKeywords && !keywords) {
      alert('Please enter keywords')
      return
    }

    setLoading(true)
    setSlowLoading(false)
    setShowResults(false)
    
    // Show "slow loading" message only if request takes > 5 seconds
    const slowLoadingTimeout = setTimeout(() => {
      setSlowLoading(true)
    }, 5000)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const formData = new FormData()

      files.forEach(file => {
        formData.append('files', file)
      })

      const jobData = useKeywords 
        ? { keywords: keywords.split(',').map(k => k.trim()) }
        : { description: jobDescription }
      
      formData.append('job_input', JSON.stringify(jobData))

      const authHeader = await getAuthHeader()
      
      // Use the new match-and-save endpoint if user is logged in
      const endpoint = authHeader ? '/api/match-and-save' : '/api/match'
      
      // Create timeout controller (90 seconds for Render free tier cold start)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000)
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: authHeader ? {
          'Authorization': authHeader
        } : {},
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      const result = await response.json()
      
      if (Array.isArray(result)) {
        setResults(result)
      } else if (result.matches && Array.isArray(result.matches)) {
        setResults(result.matches)
      } else if (result.results && Array.isArray(result.results)) {
        setResults(result.results)
      } else {
        setResults([])
        console.error('Unexpected API response format:', result)
      }
      
      setShowResults(true)
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error: any) {
      console.error('Error matching resumes:', error)
      
      if (error.name === 'AbortError') {
        alert('Request timed out. The backend might be waking up (Render free tier). Please try again in 30 seconds.')
      } else if (error.message?.includes('Failed to fetch')) {
        alert('Cannot connect to backend. Please check your internet connection or try again in a moment.')
      } else {
        alert('Failed to match resumes. Error: ' + (error.message || 'Unknown error'))
      }
    } finally {
      clearTimeout(slowLoadingTimeout)
      setLoading(false)
      setSlowLoading(false)
    }
  }

  // Resume Library Functions
  const loadResumes = async () => {
    if (!user) return
    
    setLoadingResumes(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const authHeader = await getAuthHeader()
      
      const response = await fetch(`${apiUrl}/api/resumes`, {
        headers: {
          'Authorization': authHeader
        }
      })
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }
      
      const data = await response.json()
      setResumes(data)
    } catch (error) {
      console.error('Error loading resumes:', error)
      alert('⚠️ Resume Library feature requires database connection which is currently unavailable. Please use the Match Resumes tab instead.')
    } finally {
      setLoadingResumes(false)
    }
  }

  const deleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const authHeader = await getAuthHeader()
      
      await fetch(`${apiUrl}/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader
        }
      })
      
      loadResumes()
    } catch (error) {
      console.error('Error deleting resume:', error)
      alert('Failed to delete resume')
    }
  }

  // History Functions
  const loadHistory = async () => {
    if (!user) return
    
    setLoadingHistory(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const authHeader = await getAuthHeader()
      
      const [jobsRes, matchesRes] = await Promise.all([
        fetch(`${apiUrl}/api/job-searches`, {
          headers: { 'Authorization': authHeader }
        }),
        fetch(`${apiUrl}/api/matches`, {
          headers: { 'Authorization': authHeader }
        })
      ])
      
      const jobs = await jobsRes.json()
      const matches = await matchesRes.json()
      
      setJobSearches(jobs)
      setMatchHistory(matches)
    } catch (error) {
      console.error('Error loading history:', error)
      alert('⚠️ Match History feature requires database connection which is currently unavailable. Please use the Match Resumes tab instead.')
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl border-r border-slate-700">
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Resume Parser</h1>
                <p className="text-xs text-slate-400">AI-Powered HR</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab('match')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'match'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                      : 'hover:bg-slate-700/50'
                  }`}
                >
                  <Target className="h-5 w-5" />
                  <span className="font-medium">Match Resumes</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">AI-powered resume matching</TooltipContent>
            </Tooltip>

            {user && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab('resumes')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === 'resumes'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <FolderOpen className="h-5 w-5" />
                      <span className="font-medium">Library</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Browse saved resumes</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === 'history'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <History className="h-5 w-5" />
                      <span className="font-medium">History</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">View match history</TooltipContent>
                </Tooltip>
              </>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-700/50">
            {user && (
              <div className="mb-3 px-3 py-2 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            )}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start gap-2 text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {activeTab === 'match' && 'Resume Matching'}
                    {activeTab === 'resumes' && 'Resume Library'}
                    {activeTab === 'history' && 'Match History'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {activeTab === 'match' && 'Upload and analyze resumes with AI-powered matching'}
                    {activeTab === 'resumes' && 'Manage your collection of candidate resumes'}
                    {activeTab === 'history' && 'Review past matching sessions and results'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {activeTab !== 'match' && (
                    <Button
                      onClick={activeTab === 'resumes' ? loadResumes : loadHistory}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <ScrollArea className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-6">{renderContent()}</div>
          </ScrollArea>
        </main>
      </div>
    </TooltipProvider>
  )

  function renderContent() {
    if (activeTab === 'match') {
      return <MatchContent />
    } else if (activeTab === 'resumes') {
      return <ResumesContent />
    } else if (activeTab === 'history') {
      return <HistoryContent />
    }
  }

  function MatchContent() {
    return (
      <>
        {/* Quick Stats */}
        {results.length > 0 && showResults && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{results.length}</div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">High Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {results.filter(r => r.score >= 70).length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Matching Form */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Configure Matching</CardTitle>
                  <CardDescription>Set up job requirements and upload candidate resumes</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Toggle Switch */}
            <Label htmlFor="useKeywords" className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${useKeywords ? 'bg-blue-500' : 'bg-slate-400'}`}>
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-base font-semibold cursor-pointer">
                    Keyword Matching Mode
                  </div>
                  <p className="text-sm text-slate-600">Use specific keywords instead of full description</p>
                </div>
              </div>
              <input
                type="checkbox"
                id="useKeywords"
                checked={useKeywords}
                onChange={(e) => setUseKeywords(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </Label>

            {/* Job Input */}
            <div className="space-y-3">
              {useKeywords ? (
                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-base font-semibold">Keywords</Label>
                  <p className="text-sm text-slate-600">Enter skills, technologies, or qualifications (comma-separated)</p>
                  <Input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Python, React, Project Management, Leadership"
                    className="h-12 text-base"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="jobDescription" className="text-base font-semibold">Job Description</Label>
                  <p className="text-sm text-slate-600">Paste the complete job posting or requirements</p>
                  <Textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    placeholder="We are looking for a Senior Software Engineer with experience in..."
                    className="resize-none text-base"
                  />
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* File Upload Area */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Upload Candidate Resumes</Label>
              <div className="relative">
                <label
                  htmlFor="resumes"
                  className="flex flex-col items-center justify-center w-full h-48 border-3 border-dashed rounded-xl cursor-pointer bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 bg-white rounded-full shadow-lg mb-4 group-hover:scale-105 transition-transform">
                      <Upload className="w-10 h-10 text-blue-500" />
                    </div>
                    <p className="mb-2 text-lg font-semibold text-slate-700">
                      Drop files here or <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-sm text-slate-500">Supports PDF formats</p>
                  </div>
                  <input
                    id="resumes"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {files.length > 0 && (
                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {files.length} File{files.length !== 1 ? 's' : ''} Selected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm flex-1 truncate">{file.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {(file.size / 1024).toFixed(1)} KB
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Button */}
            <Button
              onClick={handleMatch}
              disabled={loading}
              className="w-full h-14 text-lg gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing Resumes...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Start AI Matching
                </>
              )}
            </Button>

            {slowLoading && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <p className="font-medium">Processing is taking longer than expected...</p>
                  <p className="text-sm mt-1">
                    The backend service may be starting up. This typically takes 30-60 seconds on first request.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {showResults && results.length > 0 && (
          <div ref={resultsRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-6 w-6 text-amber-500" />
                Top Candidates
              </h3>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {results.length} Results
              </Badge>
            </div>

            <div className="grid gap-4">
              {results.map((result, idx) => (
                <Card 
                  key={idx} 
                  className={`border-l-4 hover:shadow-xl transition-all duration-300 ${
                    result.score >= 70 ? 'border-l-green-500 bg-gradient-to-r from-green-50/30 to-white' :
                    result.score >= 40 ? 'border-l-amber-500 bg-gradient-to-r from-amber-50/30 to-white' :
                    'border-l-red-500 bg-gradient-to-r from-red-50/30 to-white'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                          <CardTitle className="text-xl">{result.filename}</CardTitle>
                        </div>
                        
                        {/* Contact Info */}
                        {(result.extracted_data?.email || result.extracted_data?.phone) && (
                          <div className="flex flex-wrap gap-4 mt-3">
                            {result.extracted_data?.email && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="h-4 w-4" />
                                {result.extracted_data.email}
                              </div>
                            )}
                            {result.extracted_data?.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="h-4 w-4" />
                                {result.extracted_data.phone}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score Display */}
                      <div className="text-center min-w-[120px]">
                        <div className={`text-4xl font-bold mb-1 ${
                          result.score >= 70 ? 'text-green-600' :
                          result.score >= 40 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {result.score}%
                        </div>
                        <Progress 
                          value={result.score} 
                          className={`h-2 ${
                            result.score >= 70 ? '[&>div]:bg-green-500' :
                            result.score >= 40 ? '[&>div]:bg-amber-500' :
                            '[&>div]:bg-red-500'
                          }`}
                        />
                        <p className="text-xs text-slate-500 mt-1">Match Score</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Matched Skills */}
                      {result.matched_skills && result.matched_skills.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-slate-700">Matched Skills</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              {result.matched_skills.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.matched_skills.map((skill, i) => (
                              <Badge 
                                key={i} 
                                className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {result.missing_skills && result.missing_skills.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-semibold text-slate-700">Gap Skills</span>
                            <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                              {result.missing_skills.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.missing_skills.slice(0, 8).map((skill, i) => (
                              <Badge 
                                key={i} 
                                className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {result.missing_skills.length > 8 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.missing_skills.length - 8} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  function ResumesContent() {
    if (loadingResumes) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-600 text-lg">Loading your resume library...</p>
        </div>
      )
    }

    if (resumes.length === 0) {
      return (
        <Card className="text-center py-16 border-dashed border-2">
          <CardContent>
            <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
              <FolderOpen className="h-16 w-16 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Resumes Yet</h3>
            <p className="text-slate-600 mb-6">
              Start matching resumes to automatically save them to your library
            </p>
            <Button onClick={() => setActiveTab('match')} className="gap-2">
              <Target className="h-4 w-4" />
              Go to Matching
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid gap-4">
        {resumes.map((resume) => (
          <Card key={resume.id} className="hover:shadow-lg transition-all duration-300 border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900">{resume.filename}</h3>
                      {resume.name && (
                        <p className="text-slate-700 mt-1">{resume.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {new Date(resume.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  {(resume.email || resume.phone) && (
                    <div className="flex flex-wrap gap-4 p-3 bg-slate-50 rounded-lg">
                      {resume.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-slate-600" />
                          <span className="text-slate-700">{resume.email}</span>
                        </div>
                      )}
                      {resume.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-slate-600" />
                          <span className="text-slate-700">{resume.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skills */}
                  {resume.skills && resume.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Skills & Expertise
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => deleteResume(resume.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  function HistoryContent() {
    if (loadingHistory) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-600 text-lg">Loading match history...</p>
        </div>
      )
    }

    if (matchHistory.length === 0) {
      return (
        <Card className="text-center py-16 border-dashed border-2">
          <CardContent>
            <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
              <History className="h-16 w-16 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No History Available</h3>
            <p className="text-slate-600 mb-6">
              Your matching sessions will appear here once you start analyzing resumes
            </p>
            <Button onClick={() => setActiveTab('match')} className="gap-2">
              <Target className="h-4 w-4" />
              Start Matching
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        {jobSearches?.map((job) => {
          const jobMatches = matchHistory?.filter(m => m.job_search_id === job.id) || []
          if (jobMatches.length === 0) return null

          return (
            <Card key={job.id} className="border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      {job.job_title || 'Matching Session'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3" />
                      {new Date(job.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {jobMatches.length} Matches
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {jobMatches.map((match) => (
                    <Card key={match.id} className="bg-slate-50 border-slate-200">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-semibold text-slate-900">Candidate Match</span>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={match.match_score} 
                              className={`w-24 h-2 ${
                                match.match_score >= 70 ? '[&>div]:bg-green-500' :
                                match.match_score >= 50 ? '[&>div]:bg-amber-500' :
                                '[&>div]:bg-red-500'
                              }`}
                            />
                            <Badge
                              className={
                                match.match_score >= 70
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : match.match_score >= 50
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }
                            >
                              {match.match_score}%
                            </Badge>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Matched Skills */}
                          {match.matched_skills && match.matched_skills.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-slate-700">Matched</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {match.matched_skills.map((skill, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary" 
                                    className="bg-green-100 text-green-700 text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Skills */}
                          {match.missing_skills && match.missing_skills.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-slate-700">Missing</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {match.missing_skills.slice(0, 6).map((skill, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary" 
                                    className="bg-red-100 text-red-700 text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {match.missing_skills.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{match.missing_skills.length - 6}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }
}
