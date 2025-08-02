// components/FileUpload.tsx
'use client'

import { useState, FormEvent } from 'react'

interface FileUploadProps {
  onAnalysisComplete: (analysis: string) => void
  setLoading: (loading: boolean) => void
}

export default function FileUpload({
  onAnalysisComplete,
  setLoading,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!file || !jobDescription) {
      setError('Please provide both a resume file and a job description.')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('resume', file)
    formData.append('job_description', jobDescription)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze.')
      }

      onAnalysisComplete(result.analysis)
      // } catch (err: any) {
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label
          htmlFor='resume'
          className='block text-sm font-medium text-gray-200'
        >
          Upload Resume (PDF, DOCX, TXT)
        </label>
        <input
          id='resume'
          type='file'
          accept='.pdf,.docx,.txt'
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          className='mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>
      <div>
        <label
          htmlFor='job-description'
          className='block text-sm font-medium text-gray-200'
        >
          Paste Job Description
        </label>
        <textarea
          id='job-description'
          rows={12}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder='Paste the full job description here...'
          className='mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
        />
      </div>
      {error && <p className='text-sm text-red-400'>{error}</p>}
      <button
        type='submit'
        className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
        disabled={!file || !jobDescription}
      >
        Analyze My Resume
      </button>
    </form>
  )
}
