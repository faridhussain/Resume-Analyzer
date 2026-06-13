import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className='relative min-h-screen w-full bg-[#0A0A0A] text-white overflow-hidden flex items-center justify-center'>
            <div className='absolute pointer-events-none' style={{ top: 0, right: 0, width: '45%', height: '70%', background: 'radial-gradient(ellipse at 100% 0%, rgba(217,169,25,0.15) 0%, transparent 60%)'}} />
            <div className='absolute pointer-events-none' style={{ bottom: 0, left: 0, width: '45%', height: '70%', background: 'radial-gradient(ellipse at 0% 100%, rgba(217,169,25,0.12) 0%, transparent 60%)'}} />
            <svg className='absolute inset-0 w-full h-full pointer-events-none' viewBox='0 0 1000 800' preserveAspectRatio='xMidYMid slice' style={{ opacity: 1 }}>
                {[0,1,2,3,4,5,6].map((i) => (
                    <path
                        key={`tr-${i}`}
                        d={`M ${1000} ${i * 80} Q ${800 - i * 30} ${200 + i * 60} ${600 - i * 40} ${800}`}
                        fill='none'
                        stroke={`rgba(217,169,25,${0.2 - i * 0.02})`}
                        strokeWidth='0.7'
                    />
                ))}
                {[0,1,2,3,4,5,6].map((i) => (
                    <path
                        key={`bl-${i}`}
                        d={`M ${0} ${800 - i * 80} Q ${200 + i * 30} ${600 - i * 60} ${400 + i * 40} ${0}`}
                        fill='none'
                        stroke={`rgba(217,169,25,${0.17 - i * 0.02})`}
                        strokeWidth='0.7'
                    />
                ))}
            </svg>
            <Link to='/' className='group absolute top-6 left-6 flex items-center gap-1.5 text-sm text-[#8a8686] hover:text-[#D9A919] transition-colors duration-200 z-10'><ArrowLeft size={15} className='duration-300 group-hover:-translate-x-0.5 transition-transform' size={15} strokeWidth={2} />Home</Link>
            <div className='relative z-10 w-full max-w-sm mx-4'>
                <div className='text-center mb-7'>
                    <h1 className='text-3xl font-bold tracking-tight'>Log in to <span className='text-[#D9A919]'>Resume Analyser</span></h1>
                    <p className='mt-2 text-base text-[#8a8686]'>
                        Don't have an account?{' '}
                        <Link to='/signup' className='inline-flex items-center gap-1 text-[#D9A919] group'>Sign up <ArrowRight size={16} className='transition-transform duration-300 group-hover:translate-x-0.5' /></Link>
                    </p>
                </div>
                <div className='mb-5'>
                    <button className='w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-sm font-medium text-gray-300 hover:border-[#4a3a10] hover:bg-[#161200] hover:text-white transition-all duration-200'>
                        <svg width='16' height='16' viewBox='0 0 24 24'>
                            <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
                            <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
                            <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'/>
                            <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
                        </svg>
                        Log in with Google
                    </button>
                </div>
                <div className='flex items-center gap-3 mb-5'>
                    <div className='flex-1 h-px bg-[#222]' />
                    <span className='text-sm text-[#555]'>or</span>
                    <div className='flex-1 h-px bg-[#222]' />
                </div>
                <div className='mb-4'>
                    <label className='block text-sm font-medium text-[#aaa] mb-1.5'>Email</label>
                    <div className='relative'>
                        <Mail size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]' />
                        <input
                            type='email'
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder='alan.turing@example.com'
                            className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-sm text-white placeholder-[#444] focus:outline-none hover:border-[#444242] focus:border-[#D9A919] transition-all duration-200'
                        />
                    </div>
                </div>
                <div className='mb-6'>
                    <div className='flex justify-between items-center mb-1.5'>
                        <label className='text-sm font-medium text-[#aaa]'>Password</label>
                        <Link to='/forgot-password' className='text-xs text-[#555] hover:text-[#D9A919] transition-colors duration-200'>Forgot password?</Link>
                    </div>
                    <div className='relative'>
                        <Lock size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]' />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder='••••••••'
                            className='w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-sm text-white placeholder-[#444] focus:outline-none hover:border-[#444242] focus:border-[#D9A919] transition-all duration-200'
                        />
                        <button
                            type='button'
                            onClick={() => setShowPassword(v => !v)}
                            className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#D9A919] transition-colors duration-200'
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                </div>
                <button className='w-full py-2.5 rounded-xl bg-[#D9A919] text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(217,169,25,0.35)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer' disabled={!email || !password}>Log in</button>
                <p className='mt-5 text-center text-xs text-[#444] leading-relaxed'>
                    By signing in, you agree to our{' '}
                    <Link to='/terms' className='text-[#888] hover:text-[#D9A919] transition-colors duration-200'>Terms</Link>
                    {' '}and{' '}
                    <Link to='/privacy' className='text-[#888] hover:text-[#D9A919] transition-colors duration-200'>Privacy Policy</Link>.
                </p>
            </div>
        </div>
    );
}