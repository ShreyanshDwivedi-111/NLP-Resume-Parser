'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface MatchResult {
  filename: string
  score: number
  matched_skills: string[]
  extracted_data: any
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const [jobDescription, setJobDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [useKeywords, setUseKeywords] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
      // Allow guest access - no redirect if no session
      // This enables "Skip Login" functionality for testing
    })
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

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
    setShowResults(false)

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

      const response = await fetch(`${apiUrl}/api/match`, {
        method: 'POST',
        body: formData
      })

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
      
      // Auto-scroll to results after a short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to process resumes. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  // Remove loading screen - allow guest access immediately
  // if (!user) { ... }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Animated Header */}
        <div className="backdrop-blur-xl bg-white border border-gray-200 rounded-2xl p-4 md:p-8 shadow-lg animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                📄 Resume Parser Dashboard
              </h1>
              <p className="text-gray-600 text-sm md:text-lg">
                Welcome back, <span className="text-blue-600 font-semibold">{user?.email || 'Guest User'}</span>
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full sm:w-auto px-6 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm md:text-base whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Job Input Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">💼</span> Job Requirements
            </h2>
            
            <div className="mb-6">
              <label className="flex items-center space-x-3 mb-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useKeywords}
                  onChange={(e) => setUseKeywords(e.target.checked)}
                  className="w-5 h-5 rounded accent-blue-600"
                />
                <span className="text-gray-700 group-hover:text-blue-600 transition-colors">Use Keywords Instead</span>
              </label>
            </div>

            {!useKeywords ? (
              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  📝 Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the complete job description here..."
                  className="w-full h-64 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  🧠 NLP system will extract skills, roles, and requirements
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  🔑 Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="python, react, machine learning, 5 years..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Resume Upload Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">📄</span> Upload Resumes
            </h2>
            
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 cursor-pointer group">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📎</div>
                <p className="text-gray-700 mb-2 font-medium text-lg">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-600">
                  📁 PDF, TXT, DOC, DOCX, JPG, PNG
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  ✨ Multiple files supported
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">✅</span> {files.length} file(s) selected
                </p>
                <ul className="space-y-2">
                  {files.map((file, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-center">
                      <span className="mr-2">📄</span> {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Match Button */}
        <div className="text-center">
          <button
            onClick={handleMatch}
            disabled={loading}
            className="px-12 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Resumes...
              </span>
            ) : (
              <>🚀 Match Resumes</>
            )}
          </button>
        </div>

        {/* Results */}
        {showResults && (
          <div ref={resultsRef} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg animate-fadeIn">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">📊</span> Matching Results
            </h2>
            
            {results.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😕</div>
                <p className="text-gray-600 text-lg">No matches found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl font-bold text-blue-600">#{idx + 1}</span>
                          <h3 className="font-bold text-xl text-gray-800">{result.filename}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          📧 {result.extracted_data?.email || 'No email found'}
                        </p>
                        {result.extracted_data?.experience && (
                          <p className="text-sm text-gray-600">
                            ⏰ Experience: {result.extracted_data.experience}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${
                          result.score >= 70 ? 'text-green-400' :
                          result.score >= 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {result.score}%
                        </div>
                        <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold inline-block" style={{
                          background: result.score >= 70 ? 'rgba(34, 197, 94, 0.2)' :
                                     result.score >= 40 ? 'rgba(234, 179, 8, 0.2)' :
                                     'rgba(239, 68, 68, 0.2)',
                          color: result.score >= 70 ? '#86efac' :
                                result.score >= 40 ? '#fde047' :
                                '#fca5a5'
                        }}>
                          {result.score >= 70 ? '✅ Strong Match' :
                           result.score >= 40 ? '⚠️ Moderate Match' :
                           '❌ Weak Match'}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700/50 rounded-full h-3 mb-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          result.score >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                          result.score >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                          'bg-gradient-to-r from-red-500 to-pink-400'
                        }`}
                        style={{ width: `${result.score}%` }}
                      ></div>
                    </div>

                    {/* Matched Skills */}
                    {result.matched_skills && result.matched_skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          ✅ Matched Skills ({result.matched_skills.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.matched_skills.slice(0, 10).map((skill, skillIdx) => (
                            <span
                              key={skillIdx}
                              className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform duration-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {result.matched_skills.length > 10 && (
                            <span className="px-3 py-1 bg-gray-300 text-gray-700 text-sm font-medium rounded-full">
                              +{result.matched_skills.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
