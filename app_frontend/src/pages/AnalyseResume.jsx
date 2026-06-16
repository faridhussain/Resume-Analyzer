import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { toast } from '../components/Toaster.jsx'
import { supabase } from '../utils/supabase.js'
import { useNavigate } from 'react-router-dom'

const MAX_SIZE_BYTES = 1 * 1024 * 1024
const MAX_SIZE_LABEL = '1 MB'
const BUCKET_NAME = 'resume'

const LOADING_MESSAGES = [
    'Reading your resume...',
    'Matching skills to job requirements...',
    'Calculating ATS score...',
    'Generating action plan...',
    'Almost done...'
]

export default function ResumeUpload() {
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadedUrl, setUploadedUrl] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
    const [analysisResult, setAnalysisResult] = useState(null)
    const inputRef = useRef(null)
    const loadingIntervalRef = useRef(null)

    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('token')

        if (!token) {
            toast('Please login to analyze your resume', 'error')
            navigate('/login')
        }
    }, [navigate])

    function validateFile(f) {
        if (!f) return 'No file selected.'
        if (f.type !== 'application/pdf') return 'Only PDF files are allowed.'
        if (f.size > MAX_SIZE_BYTES)
            return `File too large. Max is ${MAX_SIZE_LABEL}.`
        return null
    }

    function handleFileChange(f) {
        setUploadedUrl('')
        setAnalysisResult(null)
        const err = validateFile(f)
        if (err) {
            setError(err)
            setFile(null)
            return
        }
        setError('')
        setFile(f)
    }

    function handleDrop(e) {
        e.preventDefault()
        setDragOver(false)
        handleFileChange(e.dataTransfer.files[0])
    }

    async function handleUpload() {
        if (!file) {
            setError('Please select a PDF first.')
            return
        }

        setUploading(true)
        setError('')

        const filePath = `${Date.now()}_${file.name.replace(/\s+/g, '-')}`

        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                contentType: 'application/pdf',
                upsert: false,
            })

        if (uploadError) {
            setError(`Upload failed: ${uploadError.message}`)
            setUploading(false)
            return
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path)
        const publicUrl = urlData.publicUrl
        setUploadedUrl(publicUrl)
        setUploading(false)
        console.log(publicUrl)

        // ── Start analysis ────────────────────────────────────────────────────
        setAnalyzing(true)
        setLoadingMsgIndex(0)

        loadingIntervalRef.current = setInterval(() => {
            setLoadingMsgIndex((prev) =>
                prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev,
            )
        }, 2500)

        try {
            let token = localStorage.getItem('token')
            console.log('token: ', token)
            const response = await axios.post(
                'http://localhost:3000/resume/analyze',
                {
                    pdfUrl: publicUrl,
                    jobTitle: 'Software Engineer',
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            )

            clearInterval(loadingIntervalRef.current)
            setAnalysisResult(response.data.data.data)
        } catch (err) {
            clearInterval(loadingIntervalRef.current)
            setError('Analysis failed. Please try again.')
            console.error(err)
        } finally {
            setAnalyzing(false)
        }
    }

    function handleRemove() {
        setFile(null)
        setError('')
        setUploadedUrl('')
        setAnalysisResult(null)
        setAnalyzing(false)
        clearInterval(loadingIntervalRef.current)
        if (inputRef.current) inputRef.current.value = ''
    }

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    function scoreColor(ratio) {
        if (ratio >= 0.75) return '#22c55e'
        if (ratio >= 0.5) return '#f97316'
        return '#ef4444'
    }

    function priorityStyle(priority) {
        if (priority === 'Critical')
            return { bg: '#3a0f0f', color: '#fca5a5', border: '#7f1d1d' }
        if (priority === 'Important')
            return { bg: '#1e1a0f', color: '#fde68a', border: '#78350f' }
        return { bg: '#0d1a1a', color: '#6ee7b7', border: '#065f46' }
    }

    function importanceStyle(imp) {
        if (imp === 'Must Have')
            return { bg: '#1e0f2a', color: '#c4b5fd', border: '#5b21b6' }
        return { bg: '#121218', color: '#64748b', border: '#2a2a35' }
    }

    const atsBig = analysisResult?.hero?.ats_score ?? 0
    const atsColor =
        atsBig >= 75 ? '#22c55e' : atsBig >= 50 ? '#f97316' : '#ef4444'

    return (
        <div style={S.page}>
            <div style={S.card}>
                {/* ── Header ── */}
                <div style={S.header}>
                    <div style={S.iconWrap}>
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="12" x2="12" y2="18" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div>
                        <h1 style={S.title}>Resume Analyzer</h1>
                        <p style={S.subtitle}>
                            Upload your PDF · Get instant ATS feedback
                        </p>
                    </div>
                </div>

                {/* ── Drop zone ── */}
                {!file && !uploadedUrl && (
                    <div
                        style={{
                            ...S.dropzone,
                            ...(dragOver ? S.dropzoneActive : {}),
                        }}
                        onClick={() => inputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => {
                            e.preventDefault()
                            setDragOver(true)
                        }}
                        onDragLeave={() => setDragOver(false)}
                    >
                        <svg
                            width="38"
                            height="38"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#475569"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginBottom: '12px' }}
                        >
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                        </svg>
                        <p style={S.dropText}>Drag & drop your PDF here</p>
                        <p style={S.dropSub}>
                            or click to browse · PDF only · max {MAX_SIZE_LABEL}
                        </p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                                handleFileChange(e.target.files[0])
                            }
                        />
                    </div>
                )}

                {/* ── File preview ── */}
                {file && !uploadedUrl && (
                    <div style={S.fileCard}>
                        <div style={S.fileIcon}>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                        </div>
                        <div style={S.fileInfo}>
                            <p style={S.fileName}>{file.name}</p>
                            <p style={S.fileSize}>
                                {formatSize(file.size)} / {MAX_SIZE_LABEL}
                            </p>
                            <div style={S.sizeBarBg}>
                                <div
                                    style={{
                                        ...S.sizeBarFill,
                                        width: `${Math.min((file.size / MAX_SIZE_BYTES) * 100, 100)}%`,
                                        background:
                                            file.size > MAX_SIZE_BYTES * 0.8
                                                ? '#f97316'
                                                : '#6366f1',
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            style={S.removeBtn}
                            onClick={handleRemove}
                            title="Remove"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div style={S.errorBox}>
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* ── Upload button ── */}
                {file && !uploadedUrl && (
                    <button
                        style={{
                            ...S.uploadBtn,
                            ...(uploading ? S.uploadBtnDisabled : {}),
                        }}
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <>
                                <span style={S.spinner} /> Uploading…
                            </>
                        ) : (
                            <>
                                <svg
                                    width="17"
                                    height="17"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="16 16 12 12 8 16" />
                                    <line x1="12" y1="12" x2="12" y2="21" />
                                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                                </svg>{' '}
                                Upload & Analyze
                            </>
                        )}
                    </button>
                )}

                {/* ── Analyzing loader ── */}
                {analyzing && (
                    <div style={S.analyzingCard}>
                        <div style={S.analyzingTop}>
                            <span style={S.spinner} />
                            <span style={S.analyzingTitle}>
                                Analyzing your resume
                            </span>
                        </div>
                        <p style={S.analyzingMsg}>
                            {LOADING_MESSAGES[loadingMsgIndex]}
                        </p>
                        <div style={S.progressTrack}>
                            <div
                                style={{
                                    ...S.progressBar,
                                    width: `${((loadingMsgIndex + 1) / LOADING_MESSAGES.length) * 100}%`,
                                    transition: 'width 2.4s ease',
                                }}
                            />
                        </div>
                        <div style={S.analyzingSteps}>
                            {LOADING_MESSAGES.map((msg, i) => (
                                <div key={i} style={S.analyzingStep}>
                                    <div
                                        style={{
                                            ...S.stepDot,
                                            background:
                                                i <= loadingMsgIndex
                                                    ? '#6366f1'
                                                    : '#2a2a35',
                                            boxShadow:
                                                i === loadingMsgIndex
                                                    ? '0 0 8px #6366f1'
                                                    : 'none',
                                        }}
                                    />
                                    <span
                                        style={{
                                            ...S.stepLabel,
                                            color:
                                                i <= loadingMsgIndex
                                                    ? '#a5b4fc'
                                                    : '#334155',
                                        }}
                                    >
                                        {msg}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════
            ANALYSIS RESULT
        ══════════════════════════════════════════ */}
                {analysisResult && !analyzing && (
                    <div style={S.resultWrap}>
                        {/* ── Upload another ── */}
                        <button style={S.resetBtn} onClick={handleRemove}>
                            ← Analyze another resume
                        </button>

                        {/* ── Hero score ── */}
                        <div style={S.heroCard}>
                            <div
                                style={{
                                    ...S.atsCircle,
                                    borderColor: atsColor,
                                    color: atsColor,
                                }}
                            >
                                {atsBig}
                            </div>
                            <div style={S.heroRight}>
                                <div style={S.heroRow}>
                                    <span
                                        style={{
                                            ...S.verdictBadge,
                                            color: atsColor,
                                            borderColor: atsColor,
                                        }}
                                    >
                                        {analysisResult.hero.verdict}
                                    </span>
                                    <span style={S.hireBadge}>
                                        {analysisResult.hero.hire_probability}{' '}
                                        hire probability
                                    </span>
                                </div>
                                <p style={S.heroOneLiner}>
                                    {analysisResult.hero.one_liner}
                                </p>
                            </div>
                        </div>

                        {/* ── Score breakdown ── */}
                        <p style={S.sectionLabel}>Score Breakdown</p>
                        <div style={S.breakdownList}>
                            {analysisResult.score_breakdown.map((item) => {
                                const ratio = item.score / item.out_of
                                return (
                                    <div
                                        key={item.label}
                                        style={S.breakdownRow}
                                    >
                                        <div style={S.breakdownHead}>
                                            <span style={S.breakdownName}>
                                                {item.label}
                                            </span>
                                            <span
                                                style={{
                                                    ...S.breakdownScore,
                                                    color: scoreColor(ratio),
                                                }}
                                            >
                                                {item.score}
                                                <span style={S.outOf}>
                                                    /{item.out_of}
                                                </span>
                                            </span>
                                        </div>
                                        <div style={S.barBg}>
                                            <div
                                                style={{
                                                    ...S.barFill,
                                                    width: `${ratio * 100}%`,
                                                    background:
                                                        scoreColor(ratio),
                                                }}
                                            />
                                        </div>
                                        <p style={S.breakdownReason}>
                                            {item.reason}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>

                        {/* ── Candidate snapshot ── */}
                        <p style={S.sectionLabel}>Candidate Snapshot</p>
                        <div style={S.snapshotGrid}>
                            {[
                                {
                                    label: 'Level',
                                    value: analysisResult.candidate.level,
                                },
                                {
                                    label: 'Ready to Apply',
                                    value: analysisResult.candidate
                                        .ready_to_apply
                                        ? 'Yes ✓'
                                        : 'Not Yet',
                                },
                                {
                                    label: 'Salary Range',
                                    value: analysisResult.market.salary_range,
                                },
                                {
                                    label: 'Market Demand',
                                    value: analysisResult.market.demand,
                                },
                            ].map((item) => (
                                <div key={item.label} style={S.snapshotCard}>
                                    <p style={S.snapshotLabel}>{item.label}</p>
                                    <p style={S.snapshotValue}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <div style={S.assetRow}>
                            <div style={S.assetCard}>
                                <p style={S.assetLabel}>💪 Strongest Asset</p>
                                <p style={S.assetText}>
                                    {analysisResult.candidate.strongest_asset}
                                </p>
                            </div>
                            <div
                                style={{
                                    ...S.assetCard,
                                    borderColor: '#3a1515',
                                }}
                            >
                                <p
                                    style={{
                                        ...S.assetLabel,
                                        color: '#fca5a5',
                                    }}
                                >
                                    🚧 Biggest Blocker
                                </p>
                                <p style={S.assetText}>
                                    {analysisResult.candidate.biggest_blocker}
                                </p>
                            </div>
                        </div>

                        {/* ── Top skills market needs ── */}
                        <p style={S.sectionLabel}>Skills the Market Wants</p>
                        <div style={S.tagRow}>
                            {analysisResult.market.top_skills.map((s) => {
                                const imp = importanceStyle(s.importance)
                                return (
                                    <span
                                        key={s.skill}
                                        style={{
                                            ...S.tag,
                                            background: imp.bg,
                                            color: imp.color,
                                            border: `1px solid ${imp.border}`,
                                        }}
                                    >
                                        {s.skill} · {s.importance}
                                    </span>
                                )
                            })}
                        </div>

                        {/* ── Missing skills ── */}
                        <p style={S.sectionLabel}>Missing Skills</p>
                        <div style={S.tagRow}>
                            {analysisResult.skills.missing.map((s) => {
                                const p = priorityStyle(s.priority)
                                return (
                                    <span
                                        key={s.skill}
                                        style={{
                                            ...S.tag,
                                            background: p.bg,
                                            color: p.color,
                                            border: `1px solid ${p.border}`,
                                        }}
                                    >
                                        {s.skill} · {s.priority}
                                    </span>
                                )
                            })}
                        </div>

                        {/* ── ATS keywords missing ── */}
                        {analysisResult.skills.ats_keywords_missing?.length >
                            0 && (
                            <>
                                <p style={S.sectionLabel}>
                                    ATS Keywords to Add
                                </p>
                                <div style={S.tagRow}>
                                    {analysisResult.skills.ats_keywords_missing.map(
                                        (kw) => (
                                            <span
                                                key={kw}
                                                style={{
                                                    ...S.tag,
                                                    background: '#0d1220',
                                                    color: '#93c5fd',
                                                    border: '1px solid #1e3a5f',
                                                }}
                                            >
                                                {kw}
                                            </span>
                                        ),
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── ATS filter ── */}
                        <p style={S.sectionLabel}>ATS Filter Check</p>
                        <div
                            style={{
                                ...S.atsFilterCard,
                                borderColor: analysisResult.ats_filter.will_pass
                                    ? '#166534'
                                    : '#7f1d1d',
                            }}
                        >
                            <div style={S.atsFilterTop}>
                                <span
                                    style={{
                                        ...S.atsBadge,
                                        background: analysisResult.ats_filter
                                            .will_pass
                                            ? '#0d1f14'
                                            : '#1e0f0f',
                                        color: analysisResult.ats_filter
                                            .will_pass
                                            ? '#86efac'
                                            : '#fca5a5',
                                    }}
                                >
                                    {analysisResult.ats_filter.will_pass
                                        ? '✓ Will Pass ATS'
                                        : '✗ Will Likely Fail ATS'}
                                </span>
                            </div>
                            {analysisResult.ats_filter.format_issues.map(
                                (issue, i) => (
                                    <div key={i} style={S.issueRow}>
                                        <p style={S.issueText}>
                                            ⚠ {issue.issue}
                                        </p>
                                        <p style={S.issueFix}>→ {issue.fix}</p>
                                    </div>
                                ),
                            )}
                        </div>

                        {/* ── Resume fixes ── */}
                        <p style={S.sectionLabel}>Resume Fixes</p>
                        {analysisResult.resume_fixes.map((fix, i) => (
                            <div key={i} style={S.fixCard}>
                                <div style={S.fixHead}>
                                    <span
                                        style={{
                                            ...S.fixPriority,
                                            color:
                                                fix.priority === 'High'
                                                    ? '#fca5a5'
                                                    : '#fde68a',
                                            borderColor:
                                                fix.priority === 'High'
                                                    ? '#7f1d1d'
                                                    : '#78350f',
                                            background:
                                                fix.priority === 'High'
                                                    ? '#3a0f0f'
                                                    : '#1e1a0f',
                                        }}
                                    >
                                        {fix.priority}
                                    </span>
                                    <span style={S.fixSection}>
                                        {fix.section}
                                    </span>
                                </div>
                                <p style={S.fixText}>{fix.fix}</p>
                                <p style={S.fixWhy}>Why: {fix.why}</p>
                            </div>
                        ))}

                        {/* ── Action plan ── */}
                        <p style={S.sectionLabel}>Action Plan</p>
                        {analysisResult.action_plan.map((a, i) => (
                            <div key={i} style={S.actionRow}>
                                <div style={S.actionLeft}>
                                    <span style={S.actionTimeline}>
                                        {a.timeline}
                                    </span>
                                    <span
                                        style={{
                                            ...S.actionImpact,
                                            color:
                                                a.impact === 'High'
                                                    ? '#86efac'
                                                    : '#fde68a',
                                        }}
                                    >
                                        {a.impact}
                                    </span>
                                </div>
                                <p style={S.actionText}>{a.action}</p>
                            </div>
                        ))}

                        {/* ── Final verdict ── */}
                        <div style={S.verdictCard}>
                            <p style={S.verdictEyebrow}>Final Verdict</p>
                            <p style={S.verdictText}>
                                {analysisResult.final_verdict}
                            </p>
                        </div>

                        {/* ── Motivation ── */}
                        {analysisResult.motivation && (
                            <div style={S.motivationCard}>
                                <p style={S.motivationText}>
                                    "{analysisResult.motivation}"
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
    page: {
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    card: {
        background: '#111118',
        border: '1px solid #1e1e2a',
        borderRadius: '20px',
        padding: '36px 32px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '28px',
    },
    iconWrap: {
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '14px',
        width: '52px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: '700',
        color: '#f1f5f9',
        letterSpacing: '-0.4px',
    },
    subtitle: { margin: '3px 0 0', fontSize: '13px', color: '#475569' },

    dropzone: {
        border: '2px dashed #1e1e2a',
        borderRadius: '14px',
        padding: '44px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
        marginBottom: '20px',
        background: '#0d0d14',
    },
    dropzoneActive: { borderColor: '#6366f1', background: '#14141f' },
    dropText: {
        margin: '0 0 4px',
        fontSize: '15px',
        fontWeight: '600',
        color: '#cbd5e1',
    },
    dropSub: { margin: 0, fontSize: '12.5px', color: '#334155' },

    fileCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#0d0d14',
        border: '1px solid #1e1e2a',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '16px',
    },
    fileIcon: {
        flexShrink: 0,
        background: '#1e0f0f',
        borderRadius: '8px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #3a1a1a',
    },
    fileInfo: { flex: 1, minWidth: 0 },
    fileName: {
        margin: '0 0 2px',
        fontSize: '13.5px',
        fontWeight: '600',
        color: '#e2e8f0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    fileSize: { margin: '0 0 6px', fontSize: '11.5px', color: '#475569' },
    sizeBarBg: {
        height: '3px',
        borderRadius: '99px',
        background: '#1e1e2a',
        overflow: 'hidden',
    },
    sizeBarFill: {
        height: '100%',
        borderRadius: '99px',
        transition: 'width 0.3s ease',
    },
    removeBtn: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: '#334155',
        padding: '6px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
    },

    errorBox: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        background: '#1a0a0a',
        border: '1px solid #3a1515',
        borderRadius: '8px',
        padding: '12px 14px',
        marginBottom: '16px',
        fontSize: '13px',
        color: '#fca5a5',
    },

    uploadBtn: {
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '0',
        transition: 'opacity 0.2s',
    },
    uploadBtnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
    spinner: {
        width: '15px',
        height: '15px',
        border: '2px solid rgba(255,255,255,0.25)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
        flexShrink: 0,
    },

    // ── Analyzing loader ──────────────────────────────────────────────────────
    analyzingCard: {
        marginTop: '20px',
        padding: '24px',
        background: '#0d0d14',
        border: '1px solid #2a2a3d',
        borderRadius: '14px',
    },
    analyzingTop: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '8px',
    },
    analyzingTitle: { fontSize: '15px', fontWeight: '600', color: '#e2e8f0' },
    analyzingMsg: {
        margin: '0 0 14px',
        fontSize: '13px',
        color: '#6366f1',
        minHeight: '18px',
    },
    progressTrack: {
        height: '3px',
        background: '#1e1e2a',
        borderRadius: '99px',
        overflow: 'hidden',
        marginBottom: '20px',
    },
    progressBar: {
        height: '100%',
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        borderRadius: '99px',
    },
    analyzingSteps: { display: 'flex', flexDirection: 'column', gap: '10px' },
    analyzingStep: { display: 'flex', alignItems: 'center', gap: '10px' },
    stepDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        flexShrink: 0,
        transition: 'background 0.3s, box-shadow 0.3s',
    },
    stepLabel: { fontSize: '12.5px', transition: 'color 0.3s' },

    // ── Result ────────────────────────────────────────────────────────────────
    resultWrap: { marginTop: '24px', animation: 'fadeIn 0.4s ease' },

    resetBtn: {
        background: 'transparent',
        border: '1px solid #1e1e2a',
        borderRadius: '8px',
        color: '#475569',
        fontSize: '12.5px',
        padding: '7px 12px',
        cursor: 'pointer',
        marginBottom: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
    },

    heroCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        background: '#0d0d14',
        border: '1px solid #2a2a3d',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '8px',
    },
    atsCircle: {
        width: '76px',
        height: '76px',
        borderRadius: '50%',
        border: '3px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        fontWeight: '800',
        flexShrink: 0,
    },
    heroRight: { flex: 1, minWidth: 0 },
    heroRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        flexWrap: 'wrap',
    },
    verdictBadge: {
        fontSize: '12px',
        fontWeight: '700',
        border: '1px solid',
        borderRadius: '99px',
        padding: '3px 10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    hireBadge: {
        fontSize: '12px',
        color: '#64748b',
        background: '#1a1a22',
        border: '1px solid #2a2a35',
        borderRadius: '99px',
        padding: '3px 10px',
    },
    heroOneLiner: {
        margin: 0,
        fontSize: '13px',
        color: '#94a3b8',
        lineHeight: '1.5',
    },

    sectionLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#6366f1',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        margin: '24px 0 12px',
    },

    breakdownList: { display: 'flex', flexDirection: 'column', gap: '14px' },
    breakdownRow: {},
    breakdownHead: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '5px',
    },
    breakdownName: { fontSize: '13.5px', color: '#cbd5e1', fontWeight: '500' },
    breakdownScore: { fontSize: '16px', fontWeight: '700' },
    outOf: { fontSize: '12px', color: '#334155', fontWeight: '400' },
    barBg: {
        height: '4px',
        background: '#1e1e2a',
        borderRadius: '99px',
        overflow: 'hidden',
        marginBottom: '4px',
    },
    barFill: {
        height: '100%',
        borderRadius: '99px',
        transition: 'width 0.8s ease',
    },
    breakdownReason: { margin: 0, fontSize: '11.5px', color: '#334155' },

    snapshotGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '10px',
    },
    snapshotCard: {
        background: '#0d0d14',
        border: '1px solid #1e1e2a',
        borderRadius: '10px',
        padding: '12px 14px',
    },
    snapshotLabel: {
        margin: '0 0 4px',
        fontSize: '11px',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    snapshotValue: {
        margin: 0,
        fontSize: '14px',
        fontWeight: '600',
        color: '#e2e8f0',
    },

    assetRow: { display: 'flex', gap: '10px', marginBottom: '4px' },
    assetCard: {
        flex: 1,
        background: '#0d0d14',
        border: '1px solid #1e2a1e',
        borderRadius: '10px',
        padding: '12px 14px',
    },
    assetLabel: {
        margin: '0 0 4px',
        fontSize: '11px',
        color: '#86efac',
        fontWeight: '600',
    },
    assetText: {
        margin: 0,
        fontSize: '12.5px',
        color: '#94a3b8',
        lineHeight: '1.5',
    },

    tagRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '4px',
    },
    tag: {
        fontSize: '12px',
        padding: '5px 12px',
        borderRadius: '99px',
        fontWeight: '500',
    },

    atsFilterCard: {
        background: '#0d0d14',
        border: '1px solid',
        borderRadius: '12px',
        padding: '16px',
    },
    atsFilterTop: { marginBottom: '12px' },
    atsBadge: {
        fontSize: '13px',
        fontWeight: '600',
        padding: '5px 12px',
        borderRadius: '8px',
        display: 'inline-block',
    },
    issueRow: { marginBottom: '10px', paddingLeft: '4px' },
    issueText: { margin: '0 0 3px', fontSize: '13px', color: '#fcd34d' },
    issueFix: { margin: 0, fontSize: '12.5px', color: '#64748b' },

    fixCard: {
        background: '#0d0d14',
        border: '1px solid #1e1e2a',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '10px',
    },
    fixHead: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
    },
    fixPriority: {
        fontSize: '11px',
        fontWeight: '700',
        border: '1px solid',
        borderRadius: '99px',
        padding: '2px 9px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    fixSection: { fontSize: '13px', fontWeight: '600', color: '#a5b4fc' },
    fixText: {
        margin: '0 0 6px',
        fontSize: '13px',
        color: '#cbd5e1',
        lineHeight: '1.55',
    },
    fixWhy: {
        margin: 0,
        fontSize: '12px',
        color: '#475569',
        fontStyle: 'italic',
    },

    actionRow: {
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        marginBottom: '12px',
        padding: '12px',
        background: '#0d0d14',
        border: '1px solid #1e1e2a',
        borderRadius: '10px',
    },
    actionLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0,
        minWidth: '80px',
    },
    actionTimeline: {
        fontSize: '10.5px',
        fontWeight: '700',
        color: '#a5b4fc',
        background: '#1a1a2e',
        border: '1px solid #3a3a55',
        borderRadius: '6px',
        padding: '3px 7px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
    },
    actionImpact: {
        fontSize: '10.5px',
        fontWeight: '600',
        textAlign: 'center',
    },
    actionText: {
        margin: 0,
        fontSize: '13px',
        color: '#94a3b8',
        lineHeight: '1.55',
    },

    verdictCard: {
        marginTop: '20px',
        padding: '18px 20px',
        background: 'linear-gradient(135deg, #13131f, #1a1a2e)',
        border: '1px solid #3a3a55',
        borderRadius: '14px',
    },
    verdictEyebrow: {
        margin: '0 0 8px',
        fontSize: '10.5px',
        fontWeight: '700',
        color: '#6366f1',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    verdictText: {
        margin: 0,
        fontSize: '14px',
        color: '#c7d2fe',
        lineHeight: '1.65',
    },

    motivationCard: {
        marginTop: '12px',
        padding: '16px 20px',
        background: '#0d0d14',
        border: '1px solid #1e1e2a',
        borderRadius: '12px',
    },
    motivationText: {
        margin: 0,
        fontSize: '13px',
        color: '#64748b',
        lineHeight: '1.65',
        fontStyle: 'italic',
    },
}
