'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
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
  AlertCircle
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Resume Parser</h1>
                <p className="text-xs text-slate-500">HR Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:block text-sm text-slate-600">
                  {user.email}
                </div>
              )}
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="match" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Match Resumes</span>
              <span className="sm:hidden">Match</span>
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="resumes" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Resume Library</span>
                  <span className="sm:hidden">Library</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Match History</span>
                  <span className="sm:hidden">History</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Match Resumes Tab */}
          <TabsContent value="match" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Resume Matching
                </CardTitle>
                <CardDescription>
                  Upload resumes and match them against job requirements using AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Keyword Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useKeywords"
                    checked={useKeywords}
                    onChange={(e) => setUseKeywords(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <Label htmlFor="useKeywords" className="text-sm font-medium cursor-pointer">
                    Use keywords instead of job description
                  </Label>
                </div>

                {/* Job Input */}
                {useKeywords ? (
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="e.g., Python, Machine Learning, API Development"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="jobDescription">Job Description</Label>
                    <Textarea
                      id="jobDescription"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={6}
                      placeholder="Paste the complete job description here..."
                      className="resize-none"
                    />
                  </div>
                )}

                <Separator />

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="resumes">Upload Resumes</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="resumes"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 border-slate-300 hover:border-slate-400 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-slate-500" />
                        <p className="mb-2 text-sm text-slate-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">PDF, DOC, or DOCX files</p>
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
                    <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Selected Files ({files.length}):
                      </p>
                      <div className="space-y-1">
                        {files.map((file, idx) => (
                          <div key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            {file.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleMatch}
                  disabled={loading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing Resumes...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Match Resumes
                    </>
                  )}
                </Button>

                {slowLoading && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">This is taking longer than usual...</p>
                      <p className="text-xs mt-1">
                        The backend might be waking up from sleep (free tier). This can take up to 60 seconds on first load.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Results Section */}
            {showResults && results.length > 0 && (
              <div ref={resultsRef}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Matching Results
                    </CardTitle>
                    <CardDescription>
                      Found {results.length} candidate{results.length !== 1 ? 's' : ''} ranked by match score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.map((result, idx) => (
                        <Card key={idx} className="border-l-4" style={{
                          borderLeftColor: result.score >= 70 ? 'rgb(34, 197, 94)' : 
                                         result.score >= 40 ? 'rgb(234, 179, 8)' : 
                                         'rgb(239, 68, 68)'
                        }}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{result.filename}</CardTitle>
                                <CardDescription>Rank #{idx + 1}</CardDescription>
                              </div>
                              <div className="text-right">
                                <div className={`text-3xl font-bold ${
                                  result.score >= 70 ? 'text-green-600' :
                                  result.score >= 40 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {result.score}%
                                </div>
                                <p className="text-xs text-slate-500">Match Score</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Contact Info */}
                            {(result.extracted_data?.email || result.extracted_data?.phone) && (
                              <div className="flex flex-wrap gap-4 text-sm">
                                {result.extracted_data?.email && (
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Mail className="h-4 w-4" />
                                    {result.extracted_data.email}
                                  </div>
                                )}
                                {result.extracted_data?.phone && (
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Phone className="h-4 w-4" />
                                    {result.extracted_data.phone}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Matched Skills */}
                            {result.matched_skills && result.matched_skills.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <p className="text-sm font-semibold text-slate-700">Matched Skills</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {result.matched_skills.map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Missing Skills */}
                            {result.missing_skills && result.missing_skills.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <p className="text-sm font-semibold text-slate-700">Missing Skills</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {result.missing_skills.slice(0, 10).map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {result.missing_skills.length > 10 && (
                                    <Badge variant="outline">
                                      +{result.missing_skills.length - 10} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Resume Library Tab */}
          <TabsContent value="resumes" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Resume Library
                    </CardTitle>
                    <CardDescription>
                      All saved resumes from previous matches
                    </CardDescription>
                  </div>
                  <Button onClick={loadResumes} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingResumes ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-slate-600">Loading resumes...</p>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No resumes saved yet</p>
                    <p className="text-sm text-slate-500">
                      Upload resumes in the Match tab to save them to your library
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resumes.map((resume) => (
                      <Card key={resume.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">{resume.filename}</h3>
                                {resume.name && (
                                  <p className="text-sm text-slate-700 mt-1">Name: {resume.name}</p>
                                )}
                              </div>

                              {/* Contact Information */}
                              {(resume.email || resume.phone) && (
                                <div className="flex flex-wrap gap-4 text-sm">
                                  {resume.email && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Mail className="h-4 w-4" />
                                      {resume.email}
                                    </div>
                                  )}
                                  {resume.phone && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Phone className="h-4 w-4" />
                                      {resume.phone}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Skills */}
                              {resume.skills && resume.skills.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-slate-700 mb-2">Skills:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {resume.skills.map((skill, idx) => (
                                      <Badge key={idx} variant="secondary">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                Uploaded: {new Date(resume.created_at).toLocaleDateString()}
                              </div>
                            </div>

                            <Button
                              onClick={() => deleteResume(resume.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Match History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Match History
                    </CardTitle>
                    <CardDescription>
                      View all previous resume matching sessions
                    </CardDescription>
                  </div>
                  <Button onClick={loadHistory} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-slate-600">Loading history...</p>
                  </div>
                ) : matchHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No match history yet</p>
                    <p className="text-sm text-slate-500">
                      Start matching resumes to see your history here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {jobSearches?.map((job) => {
                      const jobMatches = matchHistory?.filter(m => m.job_search_id === job.id) || []
                      if (jobMatches.length === 0) return null

                      return (
                        <Card key={job.id} className="border-slate-200">
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {job.job_title || 'Job Search'}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {new Date(job.created_at).toLocaleString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {jobMatches.map((match) => (
                                <Card key={match.id} className="bg-slate-50">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                      <span className="font-medium text-slate-900">Resume Match</span>
                                      <Badge
                                        variant="secondary"
                                        className={
                                          match.match_score >= 70
                                            ? 'bg-green-100 text-green-800'
                                            : match.match_score >= 50
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }
                                      >
                                        {match.match_score}% Match
                                      </Badge>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                      {/* Matched Skills */}
                                      {match.matched_skills && match.matched_skills.length > 0 && (
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <p className="text-sm font-medium text-slate-700">Matched Skills:</p>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {match.matched_skills.map((skill, idx) => (
                                              <Badge key={idx} variant="secondary" className="bg-green-100 text-green-700 text-xs">
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
                                            <p className="text-sm font-medium text-slate-700">Missing Skills:</p>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {match.missing_skills.slice(0, 8).map((skill, idx) => (
                                              <Badge key={idx} variant="secondary" className="bg-red-100 text-red-700 text-xs">
                                                {skill}
                                              </Badge>
                                            ))}
                                            {match.missing_skills.length > 8 && (
                                              <Badge variant="outline" className="text-xs">
                                                +{match.missing_skills.length - 8} more
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
