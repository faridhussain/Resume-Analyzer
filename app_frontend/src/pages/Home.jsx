import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { toast } from '../components/Toaster.jsx'
import ResumeBackground from '../components/HeroBackground.jsx'

export default function Home() {
    const navigate = useNavigate()

    const handleAnalyzeResume = () => {
        const token = localStorage.getItem('token')

        if (!token) {
            localStorage.setItem('redirectAfterLogin', '/analyseresume')
            toast('Please login to analyze your resume', 'error')
            navigate('/login')
            return
        }

        navigate('/analyseresume')
    }

    return (
        <div className='relative h-screen w-full bg-[#0A0A0A] text-white flex flex-col overflow-hidden'>
            <div className='absolute inset-0 bg-dot-pattern mask-[radial-gradient(circle_at_center,black_40%,transparent_90%)] opacity-70 pointer-events-none' />
            <ResumeBackground />
            <div className='absolute inset-0 pointer-events-none select-none' style={{ zIndex: 1 }}>
                <div className='hidden md:block' style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '75%', height: '60%', background: 'radial-gradient(circle at center, rgba(217,169,25,0.09) 0%, rgba(180,130,10,0.03) 40%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className='md:hidden' style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '110%', height: '70%', background: 'radial-gradient(circle at center, rgba(217,169,25,0.18) 0%, rgba(180,130,10,0.07) 45%, transparent 70%)', filter: 'blur(50px)' }} />
            </div>
            <Navbar />
            <div className='relative z-10 h-[75vh] w-[90%] sm:w-[85%] md:w-[80%] mx-auto flex justify-center items-center flex-col gap-8 md:gap-10'>
                <div className='relative z-10 flex flex-col gap-4 md:gap-5 items-center'>
                    <h1 className='text-3xl sm:text-4xl md:text-5xl font-black text-center leading-tight'>
                        Know what your Resume is <span className='text-[#F5C517]'>missing</span>
                    </h1>
                    <h4 className='text-base sm:text-lg md:text-xl text-gray-400 text-center'>
                        Upload your Resume — get instant AI feedback on <br className='hidden sm:block' /> skills, gaps, and what companies want.
                    </h4>
                </div>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-5 w-full sm:w-auto items-center'>
                    <button onClick={handleAnalyzeResume} className='w-full sm:w-auto group px-5 py-2.5 bg-[#D9A919] font-medium inline-flex items-center justify-center gap-1 rounded-xl hover:shadow-[0_0_15px_rgba(193,143,19,0.6)] duration-300 hover:-translate-y-0.5 text-black text-base md:text-lg cursor-pointer'>Analyze Your Resume</button>
                    <Link to='/' className='w-full sm:w-auto relative overflow-hidden group px-5 py-2.5 bg-[#0E0D09] border border-[#383733] rounded-xl text-gray-300 font-medium text-base md:text-lg hover:border-[#5a4a19] hover:shadow-[0_0_15px_rgba(217,169,25,0.4)] hover:-translate-y-0.5 transition-all duration-300' >
                        <span className='absolute top-0 -left-full h-full w-1/3 skew-x-12 bg-linear-to-r from-transparent via-[#D9A919]/50 to-transparent transition-all duration-700 group-hover:left-[130%]' />
                        <span className='relative z-10 flex justify-center items-center gap-1'>Ask about Your Resume <ArrowRight size={18} className='group-hover:translate-x-1 transition-transform duration-300' /></span>
                    </Link>
                </div>
            </div>

            <div className='relative z-10 flex-1 flex items-center justify-center'>
                <div className='flex flex-wrap gap-1.5 md:gap-3 justify-center px-3'>
                    {[
                        { short: 'Resume score', full: 'Scores your resume' },
                        { short: 'Skill gaps', full: 'Finds skill gaps' },
                        { short: 'ATS check', full: 'Checks ATS compatibility' },
                        { short: 'Improvements', full: 'Suggests improvements' },
                        { short: 'Q&A on resume', full: 'Answers questions about it' },
                    ].map(({ short, full }) => (
                        <div key={full} className='group flex items-center gap-1.5 px-2.5 md:px-4 py-1 md:py-2 rounded-full border border-[#2a2a2a] bg-[#111111] hover:border-[#3a3020] transition-colors duration-300'>
                            <span className='relative w-2 h-2 md:w-3 md:h-3 flex items-center justify-center'>
                                <span className='absolute text-[#D9A919] text-[6px] md:text-[8px] transition-all duration-300 group-hover:opacity-0 group-hover:scale-0'>●</span>
                                <span className='absolute text-[#D9A919] text-[10px] md:text-xs opacity-0 scale-0 rotate-180 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0'>✦</span>
                            </span>
                            <span className='md:hidden text-[11px] text-gray-400 group-hover:text-gray-300 transition-colors duration-300 whitespace-nowrap'>{short}</span>
                            <span className='hidden md:inline text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300'>{full}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}