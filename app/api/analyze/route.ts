// app/api/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import prisma from '@/lib/prisma';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';
import { cookies } from 'next/headers';

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

function createPrompt(resumeText: string, jobDescription: string): string {
    return `
    Analyze the following resume based on the provided job description. Provide your analysis in clear, well-formatted Markdown.

    **Resume Text:**
    ${resumeText}

    **Job Description:**
    ${jobDescription}

    **Analysis Required:**
    1.  **Summary:** Provide a brief, 2-3 sentence summary of the candidate's profile and suitability for the role.
    2.  **Keyword Match:** Identify keywords from the job description found in the resume. List them and rate the match from 1-10.
    3.  **Missing Skills:** What key skills or qualifications from the job description are missing? Be specific.
    4.  **Formatting & Readability Score:** Rate the resume's formatting on a scale of 1-10 and provide one concrete suggestion for improvement.
    5.  **Actionable Suggestions:** Give 3-5 bullet-pointed, actionable suggestions to improve the resume for this specific job application.
    `;
}

export async function POST(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;
    const jobDescription = formData.get('job_description') as string;

    if (!resumeFile || !jobDescription) {
        return NextResponse.json({ error: 'File and job description are required.' }, { status: 400 });
    }

    try {
        // Step 1: Upload file to Supabase Storage
        const filePath = `${user.id}/${Date.now()}-${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, resumeFile);
        if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

        // Step 2: Extract text from file buffer
        const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());
        let resumeText = '';
        if (resumeFile.type === 'application/pdf') {
            const data = await pdf(fileBuffer);
            resumeText = data.text;
        } else if (resumeFile.type.includes('wordprocessingml')) {
            const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
            resumeText = value;
        } else {
            resumeText = fileBuffer.toString('utf-8');
        }

        // Step 3: Call Gemini API
        const prompt = createPrompt(resumeText, jobDescription);
        const geminiResponse = await axios.post(GEMINI_API_URL, {
            contents: [{ parts: [{ text: prompt }] }],
        });
        const analysisReport = geminiResponse.data.candidates[0].content.parts[0].text;

        // Step 4: Save analysis to your PostgreSQL database via Prisma
        await prisma.analysis.create({
            data: {
                userId: user.id,
                jobDescription: jobDescription,
                report: analysisReport,
            },
        });

        return NextResponse.json({ analysis: analysisReport });
    } catch (error) {
        console.error('Full error object:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        } // <-- The closing brace for the 'if' was added here.
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}