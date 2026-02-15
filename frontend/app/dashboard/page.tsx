'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

interface DashboardStats {
  total_resumes: number
  total_job_searches: number
  total_matches: number
  average_match_score: number
  recent_activity: any[]
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

  // Analytics State
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

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
      } else if (activeTab === 'analytics') {
        loadStats()
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

  // Analytics Functions
  const loadStats = async () => {
    if (!user) return
    
    setLoadingStats(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const authHeader = await getAuthHeader()
      
      const response = await fetch(`${apiUrl}/api/dashboard/stats`, {
        headers: {
          'Authorization': authHeader
        }
      })
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
      alert('⚠️ Analytics feature requires database connection which is currently unavailable. Please use the Match Resumes tab instead.')
    } finally {
      setLoadingStats(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Resume Parser Dashboard</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('match')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'match'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Match Resumes
            </button>
            {user && (
              <>
                <button
                  onClick={() => setActiveTab('resumes')}
                  className={`px-6 py-3 font-medium transition ${
                    activeTab === 'resumes'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Resume Library
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-3 font-medium transition ${
                    activeTab === 'history'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Match History
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-3 font-medium transition ${
                    activeTab === 'analytics'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
              </>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Match Tab */}
            {activeTab === 'match' && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={useKeywords}
                      onChange={(e) => setUseKeywords(e.target.checked)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Use keywords instead of job description
                    </span>
                  </label>

                  {useKeywords ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keywords (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="e.g., Python, Machine Learning, API"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Description
                      </label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={6}
                        placeholder="Paste job description here..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Resumes
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {files.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      {files.length} file(s) selected
                    </p>
                  )}
                </div>

                <button
                  onClick={handleMatch}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Matching...' : 'Match Resumes'}
                </button>
                
                {slowLoading && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                    <p className="font-medium">⏳ This is taking longer than usual...</p>
                    <p className="text-xs mt-1">The backend might be waking up from sleep (free tier limitation). This can take up to 60 seconds on first load.</p>
                  </div>
                )}

                {showResults && results.length > 0 && (
                  <div ref={resultsRef} className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-6">Matching Results</h2>
                    
                    <div className="space-y-4">
                      {results.map((result, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{result.filename}</h3>
                              <p className="text-sm text-gray-600">
                                Rank: #{idx + 1}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                result.score >= 70 ? 'text-green-600' :
                                result.score >= 40 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {result.score}%
                              </div>
                              <p className="text-xs text-gray-500">Match Score</p>
                            </div>
                          </div>

                          {result.matched_skills && result.matched_skills.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm font-medium mb-1">Matched Skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {result.matched_skills.map((skill, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {result.extracted_data?.email && (
                            <p className="text-sm text-gray-600 mt-2">
                              📧 {result.extracted_data.email}
                            </p>
                          )}

                          {result.extracted_data?.phone && (
                            <p className="text-sm text-gray-600">
                              📞 {result.extracted_data.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resume Library Tab */}
            {activeTab === 'resumes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Resume Library</h2>
                  <button
                    onClick={loadResumes}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Refresh
                  </button>
                </div>

                {loadingResumes ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading resumes...</p>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No resumes saved yet. Upload resumes in the Match tab to save them.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{resume.filename}</h3>
                            {resume.name && <p className="text-gray-700 mt-1">Name: {resume.name}</p>}
                            {resume.email && <p className="text-gray-600 text-sm">Email: {resume.email}</p>}
                            {resume.phone && <p className="text-gray-600 text-sm">Phone: {resume.phone}</p>}
                            
                            {resume.skills && resume.skills.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                                <div className="flex flex-wrap gap-2">
                                  {resume.skills.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-sm rounded">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-3">
                              Uploaded: {new Date(resume.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => deleteResume(resume.id)}
                            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Match History</h2>
                  <button
                    onClick={loadHistory}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Refresh
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading history...</p>
                  </div>
                ) : matchHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No match history yet. Start matching resumes to see history.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {jobSearches?.map((job) => {
                      const jobMatches = matchHistory?.filter(m => m.job_search_id === job.id) || []
                      if (jobMatches.length === 0) return null
                      
                      return (
                        <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {job.job_title || 'Job Search'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {new Date(job.created_at).toLocaleString()}
                          </p>
                          
                          <div className="space-y-3">
                            {jobMatches.map((match) => (
                              <div key={match.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">Resume Match</span>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    match.match_score >= 70 ? 'bg-green-100 text-green-800' :
                                    match.match_score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {match.match_score}% Match
                                  </span>
                                </div>
                                
                                <div className="mt-3 grid md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Matched Skills:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {match.matched_skills?.map((skill, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {match.missing_skills && match.missing_skills.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-1">Missing Skills:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {match.missing_skills.map((skill, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                  <button
                    onClick={loadStats}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Refresh
                  </button>
                </div>

                {loadingStats ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading statistics...</p>
                  </div>
                ) : stats ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Total Resumes</h3>
                      <p className="text-3xl font-bold text-indigo-600">{stats.total_resumes}</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Job Searches</h3>
                      <p className="text-3xl font-bold text-indigo-600">{stats.total_job_searches}</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Total Matches</h3>
                      <p className="text-3xl font-bold text-indigo-600">{stats.total_matches}</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Match Score</h3>
                      <p className="text-3xl font-bold text-indigo-600">
                        {stats.average_match_score ? `${stats.average_match_score.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No analytics data available yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
