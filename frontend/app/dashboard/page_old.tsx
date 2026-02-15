'use client'

import { useEffect, useState } from 'react'
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
  
  // Job input
  const [jobDescription, setJobDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [useKeywords, setUseKeywords] = useState(false)
  
  // Resume upload
  const [files, setFiles] = useState<File[]>([])
  
  // Results
  const [results, setResults] = useState<MatchResult[]>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
      } else {
        router.push('/')
      }
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
      alert('Please enter a job description or keywords')
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

      // Add files
      files.forEach(file => {
        formData.append('files', file)
      })

      // Add job input
      const jobData = useKeywords 
        ? { keywords: keywords.split(',').map(k => k.trim()) }
        : { description: jobDescription }
      
      formData.append('job_input', JSON.stringify(jobData))

      // Call API
      const response = await fetch(`${apiUrl}/api/match`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      // Ensure result is an array
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
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to process resumes. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume Parser Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user.email}</p>
          </div>
          <button onClick={handleSignOut} className="btn-secondary">
            Sign Out
          </button>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Job Input */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Job Requirements</h2>
            
            <div className="mb-4">
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={useKeywords}
                  onChange={(e) => setUseKeywords(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Use Keywords Instead</span>
              </label>
            </div>

            {!useKeywords ? (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="input-field h-64 resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Our NLP system will extract skills, roles, and requirements
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="python, react, machine learning, 5 years"
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter skills, experience, or requirements separated by commas
                </p>
              </div>
            )}
          </div>

          {/* Resume Upload */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Upload Resumes</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                <div className="text-4xl mb-4">📄</div>
                <p className="text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, TXT, DOC, DOCX, JPG, PNG (multiple files supported)
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4">
                <p className="font-medium mb-2">{files.length} file(s) selected:</p>
                <ul className="text-sm space-y-1">
                  {files.map((file, idx) => (
                    <li key={idx} className="text-gray-600">
                      • {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Process Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleMatch}
            disabled={loading}
            className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Match Resumes'}
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Using: Tokenization • Lemmatization • Levenshtein Distance
          </p>
        </div>

        {/* Results */}
        {showResults && (
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Matching Results</h2>
            
            {results.length === 0 ? (
              <p className="text-gray-600">No matches found</p>
            ) : (
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

                    {result.matched_skills.length > 0 && (
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
