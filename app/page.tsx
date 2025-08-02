// app/page.tsx
"use client";
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import { Remarkable } from 'remarkable';

export default function Home() {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const md = new Remarkable();

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <main className="container mx-auto p-4 md:p-8">
                <div className="text-center mb-12">
                    {/* <h1 className="text-4xl md:text-5xl font-extrabold">AI Resume Analyzer</h1> */}
                    <h1 className="text-4xl md:text-5xl font-extrabold">AI Resume Checker Pro</h1>
                    {/* <h1 className="text-4xl md:text-5xl font-extrabold">ResumeSoft AI</h1> */}
                    <p className="text-lg text-gray-400 mt-2">Get instant feedback to land your dream job.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700">
                        <FileUpload onAnalysisComplete={setAnalysis} setLoading={setLoading} />
                    </div>
                    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700">
                        <h2 className="text-2xl font-bold mb-4">Your Analysis Report</h2>
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <p className="text-lg animate-pulse">Analyzing... this may take a moment.</p>
                            </div>
                        ) : analysis ? (
                            <div
                                className="prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: md.render(analysis) }}
                            ></div>
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                <p className="text-gray-400">Your report will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}