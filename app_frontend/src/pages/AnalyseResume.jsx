import { useState, useRef, useEffect } from 'react';
import { JOB_ROLES } from '../data/jobRoles.js';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from '../components/Toaster.jsx';
import { supabase } from '../utils/supabase.js';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, X, AlertCircle, ArrowLeft, TrendingUp, Zap, AlertTriangle, Sparkles, Briefcase, DollarSign, Activity, Award, ShieldCheck, ShieldAlert } from 'lucide-react';

const MAX_SIZE_BYTES = 1 * 1024 * 1024;
const MAX_SIZE_LABEL = '1 MB';
const BUCKET_NAME = 'resume';

const LOADING_MESSAGES = ['Reading your resume...', 'Matching skills to job requirements...', 'Calculating ATS score...', 'Generating action plan...', 'Almost done...'];

const SCORE_ANIM_DURATION = 1400;

function Spinner({ size = 15 }) {
    return (
        <svg className='animate-spin' width={size} height={size} viewBox='0 0 24 24' fill='none'>
            <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' strokeOpacity='0.3' />
            <path d='M12 2a10 10 0 0 1 10 10' stroke='currentColor' strokeWidth='3' strokeLinecap='round' />
        </svg>
    );
}

function Background() {
    return (
        <div className='fixed inset-0 pointer-events-none z-0 overflow-hidden'>
            <div className='absolute inset-0 bg-dot-pattern opacity-40' />
            <div
                className='absolute top-0 right-0'
                style={{
                    width: '40%',
                    height: '60%',
                    background: 'radial-gradient(circle at top right, rgba(217,169,25,0.12), transparent 70%)',
                }}
            />
            <div
                className='absolute bottom-0 left-0'
                style={{
                    width: '40%',
                    height: '60%',
                    background: 'radial-gradient(circle at bottom left, rgba(217,169,25,0.08), transparent 70%)',
                }}
            />
        </div>
    );
}

function scoreColor(ratio) {
    if (ratio >= 0.75) return '#22c55e';
    if (ratio >= 0.5) return '#D9A919';
    return '#ef4444';
}

function priorityStyle(priority) {
    if (priority === 'Critical')
        return {
            bg: 'bg-[#1f0a0a]',
            color: 'text-[#fca5a5]',
            border: 'border-[#3a1515]',
        };
    if (priority === 'Important')
        return {
            bg: 'bg-[#1f1a0a]',
            color: 'text-[#fde68a]',
            border: 'border-[#3a2f10]',
        };
    return {
        bg: 'bg-[#0a1f17]',
        color: 'text-[#6ee7b7]',
        border: 'border-[#14352a]',
    };
}

function importanceStyle(imp) {
    if (imp === 'Must Have')
        return {
            bg: 'bg-[#1a1200]',
            color: 'text-[#D9A919]',
            border: 'border-[#65531e]',
        };
    return {
        bg: 'bg-[#111]',
        color: 'text-[#777]',
        border: 'border-[#2a2a2a]',
    };
}

function FadeSection({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{
                once: true,
                amount: 0.08,
            }}
            transition={{
                duration: 0.5,
                ease: 'easeOut',
            }}
        >
            {children}
        </motion.div>
    );
}

function fixAccent(priority) {
    if (priority === 'High') return '#ef4444';
    if (priority === 'Medium') return '#D9A919';
    return '#6b7280';
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function ScoreRing({ displayScore, color, size = 152, stroke = 10 }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const fraction = Math.min(Math.max(displayScore, 0), 100) / 100;
    const dashOffset = -circumference * (1 - fraction);

    return (
        <div className='relative' style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill='none' stroke='#1f1f1f' strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill='none' stroke={color} strokeWidth={stroke} strokeLinecap='round' strokeDasharray={circumference} strokeDashoffset={dashOffset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            </svg>
            <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-[46px] font-extrabold' style={{ color }}>
                    {displayScore}
                </span>
            </div>
        </div>
    );
}

export default function ResumeUpload() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [roleInput, setRoleInput] = useState('');
    const [targetRoles, setTargetRoles] = useState([]);
    const [selectedRoleIndex, setSelectedRoleIndex] = useState(-1);
    const suggestionRefs = useRef([]);
    const filteredRoles = roleInput.trim() === '' ? [] : JOB_ROLES.filter((role) => role.toLowerCase().startsWith(roleInput.toLowerCase()) && !targetRoles.includes(role)).slice(0, 8);

    useEffect(() => {
        if (selectedRoleIndex >= 0) {
            suggestionRefs.current[selectedRoleIndex]?.scrollIntoView({
                block: 'nearest',
            });
        }
    }, [selectedRoleIndex]);
    const roleInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const loadingIntervalRef = useRef(null);

    const [progress, setProgress] = useState(0);
    const rafRef = useRef(null);

    const atsBig = analysisResult?.hero?.ats_score ?? 0;
    const atsColor = atsBig >= 75 ? '#22c55e' : atsBig >= 50 ? '#D9A919' : '#ef4444';
    const hasResult = analysisResult && !analyzing;

    const navigate = useNavigate();

    useEffect(() => {
        if (!hasResult) {
            return;
        }

        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            const t = Math.min(elapsed / SCORE_ANIM_DURATION, 1);
            setProgress(easeOutCubic(t));
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        }

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [hasResult, analysisResult]);

    const isAnimatingScores = progress < 1;
    const displayScore = Math.round(atsBig * progress);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            toast('Please login to analyze your resume', 'error');
            navigate('/login');
        }
    }, [navigate]);

    function validateFile(f) {
        if (!f) return 'No file selected.';
        if (f.type !== 'application/pdf') return 'Only PDF files are allowed.';
        if (f.size > MAX_SIZE_BYTES) return `File too large. Max is ${MAX_SIZE_LABEL}.`;
        return null;
    }

    function handleFileChange(f) {
        setUploadedUrl('');
        setAnalysisResult(null);
        const err = validateFile(f);
        if (err) {
            setError(err);
            setFile(null);
            return;
        }
        setError('');
        setFile(f);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        handleFileChange(e.dataTransfer.files[0]);
    }

    function addRole(role) {
        if (targetRoles.includes(role)) {
            toast('Role already added.', 'error');
            return;
        }

        if (targetRoles.length >= 3) {
            toast('You can select up to 3 target roles.', 'error');
            return;
        }

        const newCount = targetRoles.length + 1;

        setTargetRoles((prev) => [...prev, role]);
        setRoleInput('');
        setSelectedRoleIndex(-1);

        requestAnimationFrame(() => {
            if (newCount < 3) {
                roleInputRef.current?.focus();
            } else {
                roleInputRef.current?.blur();
            }
        });
    }

    function removeRole(role) {
        setTargetRoles((prev) => prev.filter((r) => r !== role));

        requestAnimationFrame(() => {
            roleInputRef.current?.focus();
        });
    }

    async function handleUpload() {
        if (!file) {
            setError('Please select a PDF first.');
            toast('Please select a PDF first.', 'error');
            return;
        }
        if (targetRoles.length === 0) {
            toast('Please add at least one target role.', 'error');
            return;
        }
        setUploading(true);
        setError('');

        const filePath = `${Date.now()}_${file.name.replace(/\s+/g, '-')}`;

        const { data, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
            contentType: 'application/pdf',
            upsert: false,
        });

        if (uploadError) {
            setError(`Upload failed: ${uploadError.message}`);
            toast('Failed to upload resume.', 'error');
            setUploading(false);
            return;
        }

        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
        const publicUrl = urlData.publicUrl;
        setUploadedUrl(publicUrl);
        toast('Resume uploaded successfully.', 'success');
        setUploading(false);
        setAnalyzing(true);
        setLoadingMsgIndex(0);

        loadingIntervalRef.current = setInterval(() => {
            setLoadingMsgIndex((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
        }, 2500);

        try {
            setProgress(0);
            let token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:3000/resume/analyze',
                {
                    pdfUrl: publicUrl,
                    jobTitle: targetRoles.join(', '),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            clearInterval(loadingIntervalRef.current);
            setAnalysisResult(response.data.data.data);
            toast('Resume analyzed successfully.', 'success');
        } catch (err) {
            clearInterval(loadingIntervalRef.current);

            console.log('ERROR RESPONSE:', err.response);
            console.log('ERROR DATA:', err.response?.data);

            setError('Analysis failed. Please try again.');
            toast('Failed to analyze resume.', 'error');
        } finally {
            setAnalyzing(false);
        }
    }

    function handleRemove() {
        setProgress(0);
        setFile(null);
        setError('');
        setUploadedUrl('');
        setAnalysisResult(null);
        setAnalyzing(false);
        setTargetRoles([]);
        setRoleInput('');
        clearInterval(loadingIntervalRef.current);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return (
        <div className='relative min-h-screen w-full bg-[#0A0A0A] text-white overflow-x-hidden'>
            <Background />
            <div className='relative z-10'>
                {!hasResult && (
                    <div className='absolute top-6 left-6 z-20'>
                        <button onClick={() => navigate('/')} className='group inline-flex items-center gap-2 text-[#999] hover:text-[#D9A919] transition-colors duration-200 cursor-pointer'>
                            <ArrowLeft size={18} className='transition-transform duration-200 group-hover:-translate-x-1' />
                            <span>Home</span>
                        </button>
                    </div>
                )}
                {!hasResult && (
                    <div className='relative z-10 flex items-start justify-center py-12 px-4 min-h-screen'>
                        <div className='w-full max-w-xl mt-8'>
                            <div className='flex items-center gap-4 mb-7'>
                                <div className='w-12 h-12 rounded-2xl bg-[#1a1200] border border-[#65531e] flex items-center justify-center shrink-0'>
                                    <FileText size={22} className='text-[#D9A919]' />
                                </div>
                                <div>
                                    <h1 className='text-2xl font-bold tracking-tight'>
                                        Resume <span className='text-[#D9A919]'>Analyzer</span>
                                    </h1>
                                    <p className='text-sm text-[#8a8686] mt-0.5'>Upload your PDF · Get instant ATS feedback</p>
                                </div>
                            </div>

                            <div className='bg-[#0e0e0e] border border-[#1f1f1f] rounded-2xl p-6 sm:p-7'>
                                <div className='mb-6'>
                                    <label className='block text-sm font-semibold text-[#ddd] mb-3'>Target Roles</label>

                                    <div className='relative'>
                                        <input
                                            ref={roleInputRef}
                                            value={roleInput}
                                            disabled={targetRoles.length >= 3}
                                            onChange={(e) => {
                                                setRoleInput(e.target.value);
                                                setSelectedRoleIndex(-1);
                                            }}
                                            placeholder={targetRoles.length >= 3 ? 'Maximum 3 roles selected' : 'Search target roles...'}
                                            className={`w-full rounded-xl px-4 py-3 outline-none text-sm border transition-colors ${targetRoles.length >= 3 ? 'bg-[#0d0d0d] border-[#1f1f1f] text-[#555] cursor-not-allowed' : 'bg-[#111] border-[#2a2a2a] focus:border-[#D9A919]'}`}
                                            onKeyDown={(e) => {
                                                if (!filteredRoles.length) return;

                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    setSelectedRoleIndex((prev) => (prev < filteredRoles.length - 1 ? prev + 1 : 0));
                                                }

                                                if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    setSelectedRoleIndex((prev) => (prev > 0 ? prev - 1 : filteredRoles.length - 1));
                                                }

                                                if (e.key === 'Enter') {
                                                    e.preventDefault();

                                                    if (selectedRoleIndex >= 0) {
                                                        addRole(filteredRoles[selectedRoleIndex]);
                                                    }
                                                }

                                                if (e.key === 'Escape') {
                                                    setRoleInput('');
                                                }
                                            }}
                                        />

                                        {targetRoles.length < 3 && filteredRoles.length > 0 && (
                                            <div className='absolute left-0 right-0 mt-2 bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden z-30 shadow-xl'>
                                                {filteredRoles.map((role, index) => (
                                                    <button key={role} ref={(el) => (suggestionRefs.current[index] = el)} type='button' onClick={() => addRole(role)} className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedRoleIndex === index ? 'bg-[#1a1200] text-[#D9A919]' : 'text-[#ddd] hover:bg-[#1a1200] hover:text-[#D9A919]'}`}>
                                                        {role}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <p className='text-xs text-[#666] mt-2'>{targetRoles.length >= 3 ? 'Maximum roles selected. Remove one to add another.' : 'Search and select up to 3 target roles.'}</p>

                                    {targetRoles.length > 0 && (
                                        <div className='flex flex-wrap gap-2 mt-4'>
                                            {targetRoles.map((role) => (
                                                <div key={role} className='flex items-center gap-2 bg-[#1a1200] border border-[#65531e] text-[#D9A919] rounded-full px-4 py-2 text-sm'>
                                                    {role}

                                                    <button onClick={() => removeRole(role)} className='hover:text-white cursor-pointer'>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {!file && !uploadedUrl && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOver(true);
                                        }}
                                        onDragLeave={() => setDragOver(false)}
                                        className={`rounded-xl border-2 border-dashed text-center py-12 px-6 cursor-pointer transition-all duration-200 ${dragOver ? 'border-[#D9A919] bg-[#161200]' : 'border-[#2a2a2a] bg-[#111] hover:border-[#4a3a10] hover:bg-[#161200]'}`}
                                    >
                                        <div className='w-14 h-14 mx-auto mb-4 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center'>
                                            <Upload size={22} className='text-[#555]' />
                                        </div>
                                        <p className='text-[15px] font-semibold text-[#ddd] mb-1'>Drag & drop your PDF here</p>
                                        <p className='text-xs text-[#555]'>or click to browse · PDF only · max {MAX_SIZE_LABEL}</p>
                                        <input ref={fileInputRef} type='file' accept='.pdf,application/pdf' className='hidden' onChange={(e) => handleFileChange(e.target.files[0])} />
                                    </div>
                                )}

                                {file && !uploadedUrl && (
                                    <div className='flex items-center gap-3 bg-[#111] border border-[#2a2a2a] rounded-xl p-3.5 mb-4'>
                                        <div className='w-10 h-10 rounded-lg bg-[#1f0a0a] border border-[#3a1515] flex items-center justify-center shrink-0'>
                                            <FileText size={18} className='text-[#ef4444]' />
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm font-semibold text-[#ddd] truncate'>{file.name}</p>
                                            <p className='text-xs text-[#555] mb-1.5'>
                                                {formatSize(file.size)} / {MAX_SIZE_LABEL}
                                            </p>
                                            <div className='h-1 rounded-full bg-[#222] overflow-hidden'>
                                                <div
                                                    className='h-full rounded-full transition-all duration-300'
                                                    style={{
                                                        width: `${Math.min((file.size / MAX_SIZE_BYTES) * 100, 100)}%`,
                                                        background: file.size > MAX_SIZE_BYTES * 0.8 ? '#f97316' : '#D9A919',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button onClick={handleRemove} title='Remove' className='text-[#555] hover:text-[#D9A919] transition-colors duration-200 p-1.5 shrink-0'>
                                            <X size={15} />
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <div className='flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1a0a0a] border border-[#3d1515] text-xs text-[#f87171] mb-4'>
                                        <AlertCircle size={13} className='shrink-0' />
                                        <span className='translate-y-px'>{error}</span>
                                    </div>
                                )}

                                {file && !uploadedUrl && (
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className='w-full py-2.5 rounded-xl bg-[#D9A919] text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(217,169,25,0.35)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer flex items-center justify-center gap-2'
                                    >
                                        {uploading ? (
                                            <>
                                                <Spinner />
                                                Uploading…
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Upload & Analyze
                                            </>
                                        )}
                                    </button>
                                )}

                                {analyzing && (
                                    <div className='bg-[#111] border border-[#2a2a2a] rounded-xl p-5'>
                                        <div className='flex items-center gap-2.5 mb-2 text-[#D9A919]'>
                                            <Spinner />
                                            <span className='text-sm font-semibold text-[#ddd]'>Analyzing your resume</span>
                                        </div>
                                        <p className='text-xs text-[#D9A919] mb-3.5 min-h-4'>{LOADING_MESSAGES[loadingMsgIndex]}</p>
                                        <div className='h-0.75 bg-[#222] rounded-full overflow-hidden mb-5'>
                                            <div
                                                className='h-full rounded-full bg-[#D9A919] transition-all duration-2400 ease-out'
                                                style={{
                                                    width: `${((loadingMsgIndex + 1) / LOADING_MESSAGES.length) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <div className='flex flex-col gap-2.5'>
                                            {LOADING_MESSAGES.map((msg, i) => (
                                                <div key={i} className='flex items-center gap-2.5'>
                                                    <div
                                                        className='w-2 h-2 rounded-full shrink-0 transition-all duration-300'
                                                        style={{
                                                            background: i <= loadingMsgIndex ? '#D9A919' : '#2a2a2a',
                                                            boxShadow: i === loadingMsgIndex ? '0 0 8px #D9A919' : 'none',
                                                        }}
                                                    />
                                                    <span
                                                        className='text-xs transition-colors duration-300'
                                                        style={{
                                                            color: i <= loadingMsgIndex ? '#D9A919' : '#444',
                                                        }}
                                                    >
                                                        {msg}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {hasResult && (
                    <div className='relative z-10 w-[95%] mx-auto py-10'>
                        <div className='flex items-center justify-between mb-9 flex-wrap gap-3'>
                            <div className='flex items-center gap-3'>
                                <div className='w-11 h-11 rounded-2xl bg-[#1a1200] border border-[#65531e] flex items-center justify-center shrink-0'>
                                    <FileText size={20} className='text-[#D9A919]' />
                                </div>
                                <div>
                                    <h1 className='text-2xl font-bold tracking-tight'>Resume Analysis Report</h1>
                                    <p className='text-xs text-[#666]'>Generated by Resume Analyser AI</p>
                                </div>
                            </div>
                            <button onClick={handleRemove} className='inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-[#D9A919] border border-[#2a2a2a] hover:border-[#4a3a10] rounded-lg px-4 py-2 transition-colors duration-200 cursor-pointer'>
                                <ArrowLeft size={14} /> Analyze another resume
                            </button>
                        </div>
                        <FadeSection>
                            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7'>
                                <div className='lg:col-span-1 bg-[#0e0e0e] border border-[#1f1f1f] rounded-2xl p-7 flex flex-col items-center justify-center text-center'>
                                    <div className='mb-3'>
                                        <ScoreRing displayScore={displayScore} color={atsColor} />
                                    </div>
                                    <p className='text-[12px] text-[#666] uppercase tracking-widest mb-4'>out of 100 · ATS Match Score</p>
                                    <span
                                        className='text-sm font-bold border rounded-full px-3.5 py-1.5 uppercase tracking-wide mb-4'
                                        style={{
                                            color: atsColor,
                                            borderColor: atsColor,
                                        }}
                                    >
                                        {analysisResult.hero.verdict}
                                    </span>
                                    <p className='text-[15px] text-[#999] leading-relaxed mb-4'>{analysisResult.hero.one_liner}</p>
                                    <span className='text-sm text-[#777] bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-4 py-1.5'>{analysisResult.hero.hire_probability} hire probability</span>
                                </div>
                                <div className='lg:col-span-2 bg-[#0e0e0e] border border-[#1f1f1f] rounded-2xl p-7'>
                                    <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest mb-1.5 flex items-center gap-1.5'>
                                        <TrendingUp size={13} /> Score Breakdown
                                    </p>
                                    <p className='text-sm text-[#666] mb-10'>How each part of your resume contributed to the score above</p>
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6'>
                                        {analysisResult.score_breakdown.map((item) => {
                                            const ratio = item.score / item.out_of;
                                            const color = scoreColor(ratio);
                                            const displayedScore = Math.round(item.score * progress);
                                            const displayedRatio = ratio * progress;
                                            const displayedPercent = Math.round((displayedScore / item.out_of) * 100);

                                            return (
                                                <div key={item.label}>
                                                    <div className='flex justify-between items-baseline mb-2'>
                                                        <span className='text-sm text-[#ccc] font-medium'>{item.label}</span>
                                                        <span className='text-base font-bold' style={{ color }}>
                                                            {displayedScore}
                                                            <span className='text-xs text-[#666] font-normal'> / {item.out_of} pts</span>
                                                            <span className='ml-2 text-xs font-medium text-[#888]'>({displayedPercent}%)</span>
                                                        </span>
                                                    </div>
                                                    <div className='h-2 bg-[#222] rounded-full overflow-hidden mb-2'>
                                                        <div
                                                            className='h-full rounded-full origin-left'
                                                            style={{
                                                                width: `${displayedRatio * 100}%`,
                                                                background: color,
                                                                boxShadow: isAnimatingScores ? `0 0 8px ${color}` : 'none',
                                                            }}
                                                        />
                                                    </div>
                                                    <p className='text-xs text-[#555] leading-snug'>{item.reason}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <FadeSection>
                                <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest ml-1.5 mb-3.5'>Candidate Snapshot</p>

                                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7 items-start'>
                                    {[
                                        {
                                            icon: Award,
                                            label: 'Experience Level',
                                            value: analysisResult.candidate.level,
                                        },
                                        {
                                            icon: ShieldCheck,
                                            label: 'Ready to Apply Now?',
                                            value: analysisResult.candidate.ready_to_apply ? 'Yes ✓' : 'Not Yet',
                                        },
                                        {
                                            icon: DollarSign,
                                            label: 'Expected Salary Range',
                                            value: analysisResult.market.salary_range,
                                        },
                                        {
                                            icon: Activity,
                                            label: 'Current Market Demand',
                                            value: analysisResult.market.demand,
                                        },
                                    ].map((item) => (
                                        <div key={item.label} className='bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-5'>
                                            <div className='flex items-center gap-2 mb-4'>
                                                <item.icon size={18} className='text-[#D9A919] shrink-0' />
                                                <p className='text-xs text-[#555] uppercase tracking-wide leading-none'>{item.label}</p>
                                            </div>

                                            <p className='text-lg font-semibold text-[#eee] leading-snug wrap-break-word'>{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                                    <div className='lg:col-span-2 flex flex-col gap-6'>
                                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                                            <div className='bg-[#0e0e0e] border border-[#1a2e1a] rounded-xl p-5'>
                                                <p className='text-sm text-[#86efac] font-semibold mb-2'>💪 What's working well for you</p>
                                                <p className='text-sm text-[#999] leading-relaxed'>{analysisResult.candidate.strongest_asset}</p>
                                            </div>
                                            <div className='bg-[#0e0e0e] border border-[#3a1515] rounded-xl p-5'>
                                                <p className='text-sm text-[#fca5a5] font-semibold mb-2'>🚧 What's holding you back</p>
                                                <p className='text-sm text-[#999] leading-relaxed'>{analysisResult.candidate.biggest_blocker}</p>
                                            </div>
                                        </div>

                                        <FadeSection>
                                            <div className='flex flex-col gap-5'>
                                                <div className='bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-6'>
                                                    <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest mb-1.5 flex items-center gap-1.5'>
                                                        <Zap size={13} /> Will Your Resume Pass the Robot Filter?
                                                    </p>
                                                    <p className='text-sm text-[#666] mb-4'>Most companies use software (an "ATS") to auto-reject resumes before a human ever sees them</p>
                                                    <span
                                                        className='inline-flex items-center gap-1.5 text-base font-semibold rounded-lg px-4 py-2 mb-4'
                                                        style={{
                                                            background: analysisResult.ats_filter.will_pass ? '#0a1a10' : '#1f0a0a',
                                                            color: analysisResult.ats_filter.will_pass ? '#86efac' : '#fca5a5',
                                                        }}
                                                    >
                                                        {analysisResult.ats_filter.will_pass ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                                        {analysisResult.ats_filter.will_pass ? 'Yes — it will pass' : 'No — it will likely get rejected'}
                                                    </span>
                                                    <div className='flex flex-col gap-3'>
                                                        {analysisResult.ats_filter.format_issues.map((issue, i) => (
                                                            <div key={i} className='bg-[#111] border border-[#2a2a2a] rounded-lg p-4'>
                                                                <p className='text-sm text-[#fcd34d] mb-1'>⚠ Problem: {issue.issue}</p>
                                                                <p className='text-sm text-[#666]'>✓ Fix: {issue.fix}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className='bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-6'>
                                                    <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest mb-1.5 flex items-center gap-1.5'>
                                                        <AlertTriangle size={13} /> Things to Fix in Your Resume
                                                    </p>
                                                    <p className='text-sm text-[#666] mb-2'>Ordered by what will make the biggest difference — scan top to bottom</p>
                                                    <div className='flex flex-col'>
                                                        {analysisResult.resume_fixes.map((fix, i) => {
                                                            const accent = fixAccent(fix.priority);
                                                            const isLast = i === analysisResult.resume_fixes.length - 1;
                                                            return (
                                                                <div key={i} className={`flex gap-4 py-4 ${!isLast ? 'border-b border-[#1f1f1f]' : ''}`}>
                                                                    <div
                                                                        className='shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 mt-0.5'
                                                                        style={{
                                                                            borderColor: accent,
                                                                            color: accent,
                                                                        }}
                                                                    >
                                                                        {i + 1}
                                                                    </div>

                                                                    <div className='flex-1 min-w-0'>
                                                                        <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                                                            <span className='text-[11px] font-bold text-[#D9A919] uppercase tracking-wide'>{fix.section}</span>
                                                                            <span
                                                                                className='text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded'
                                                                                style={{
                                                                                    color: accent,
                                                                                    background: `${accent}1a`,
                                                                                }}
                                                                            >
                                                                                {fix.priority}
                                                                            </span>
                                                                        </div>
                                                                        <p className='text-[15px] text-[#eee] font-medium leading-snug mb-1.5'>{fix.fix}</p>
                                                                        <p className='text-xs text-[#666] leading-snug flex items-start gap-1.5'>
                                                                            <span className='text-[#444] shrink-0'>↳</span>
                                                                            <span>{fix.why}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div className='p-6 rounded-xl bg-[#161200] border border-[#3a2f10]'>
                                                    <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest mb-2.5'>Bottom Line</p>
                                                    <p className='text-base text-[#e5d9b0] leading-relaxed'>{analysisResult.final_verdict}</p>
                                                </div>

                                                {analysisResult.motivation && (
                                                    <div className='p-5 rounded-xl bg-[#0e0e0e] border border-[#1f1f1f]'>
                                                        <p className='text-sm text-[#666] italic leading-relaxed'>"{analysisResult.motivation}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </FadeSection>
                                    </div>
                                    <div className='lg:col-span-1 flex flex-col gap-6'>
                                        <div className='bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-6'>
                                            <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest mb-1.5 flex items-center gap-1.5'>
                                                <Briefcase size={13} /> Skills Employers Are Looking For
                                            </p>
                                            <p className='text-sm text-[#666] mb-4'>"Must Have" means you really should learn this soon</p>
                                            <div className='flex flex-wrap gap-2.5'>
                                                {analysisResult.market.top_skills.map((s) => {
                                                    const imp = importanceStyle(s.importance);
                                                    return (
                                                        <span key={s.skill} className={`text-sm px-3.5 py-1.5 rounded-full font-medium border ${imp.bg} ${imp.color} ${imp.border}`}>
                                                            {s.skill} · {s.importance}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className='bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-6'>
                                            <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest mb-1.5'>Skills Missing From Your Resume</p>
                                            <p className='text-sm text-[#666] mb-4'>"Critical" should be fixed before applying anywhere</p>
                                            <div className='flex flex-wrap gap-2.5'>
                                                {analysisResult.skills.missing.map((s) => {
                                                    const p = priorityStyle(s.priority);
                                                    return (
                                                        <span key={s.skill} className={`text-sm px-3.5 py-1.5 rounded-full font-medium border ${p.bg} ${p.color} ${p.border}`}>
                                                            {s.skill} · {s.priority}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {analysisResult.skills.ats_keywords_missing?.length > 0 && (
                                            <div className='bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-6'>
                                                <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest mb-1.5'>Words to Add to Your Resume</p>
                                                <p className='text-sm text-[#666] mb-4'>Add these exact words so the robot filter recognizes your skills</p>
                                                <div className='flex flex-wrap gap-2.5'>
                                                    {analysisResult.skills.ats_keywords_missing.map((kw) => (
                                                        <span key={kw} className='text-sm px-3.5 py-1.5 rounded-full font-medium border bg-[#0a1018] text-[#93c5fd] border-[#1e3a5f]'>
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <FadeSection>
                                            <div className='bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-6'>
                                                <p className='text-xs font-bold text-[#D9A919] uppercase tracking-widest mb-1.5 flex items-center gap-1.5'>
                                                    <Sparkles size={13} /> What to Do Next
                                                </p>
                                                <p className='text-sm text-[#666] mb-4'>Step-by-step, in order of priority</p>
                                                <div className='flex flex-col gap-3.5'>
                                                    {analysisResult.action_plan.map((a, i) => (
                                                        <div key={i} className='bg-[#111] border border-[#2a2a2a] rounded-lg p-4'>
                                                            <div className='flex items-center gap-2 mb-2'>
                                                                <span className='text-[11px] font-bold text-[#D9A919] bg-[#1a1200] border border-[#3a2f10] rounded-md px-2 py-1 whitespace-nowrap'>{a.timeline}</span>
                                                                <span
                                                                    className='text-[11px] font-semibold'
                                                                    style={{
                                                                        color: a.impact === 'High' ? '#86efac' : '#fde68a',
                                                                    }}
                                                                >
                                                                    {a.impact} impact
                                                                </span>
                                                            </div>
                                                            <p className='text-sm text-[#999] leading-relaxed'>{a.action}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </FadeSection>
                                    </div>
                                </div>
                            </FadeSection>
                        </FadeSection>
                    </div>
                )}

                <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            </div>
        </div>
    );
}
