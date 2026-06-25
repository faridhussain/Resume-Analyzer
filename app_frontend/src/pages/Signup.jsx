import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { verifyEmail, verifyOtp, createAccount } from '../services/authApi';
import { toast } from '../components/Toaster.jsx';

const RULES = {
    fullName: {
        regex: /^[A-Za-z]{2,20}(?:\s[A-Za-z]{2,20}){1,6}$/,
        messages: {
            empty: 'Full name is required.',
            invalid: 'Enter 2-7 words, each 2-20 letters. No numbers or symbols.',
        },
    },
    email: {
        regex: /^[a-zA-Z0-9._%+-]{1,30}@[a-zA-Z0-9.-]{2,30}\.[a-zA-Z]{2,20}$/,
        messages: {
            empty: 'Email address is required.',
            invalid: 'Enter a valid email address (e.g. you@example.com).',
        },
    },
    password: {
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':'\\|,.<>/?]).{8,50}$/,
        messages: {
            empty: 'Password is required.',
            invalid: 'Must be 8-50 characters with uppercase, lowercase, number, and special character.',
        },
    },
};

function validate(field, value, extra = {}) {
    if (field === 'confirmPassword') {
        if (!value) return 'Please confirm your password.';
        if (value !== extra.password) return "Passwords don't match.";
        return null;
    }
    const rule = RULES[field];
    if (!value.trim()) return rule.messages.empty;
    if (!rule.regex.test(value.trim())) return rule.messages.invalid;
    return null;
}

function getStrength(pwd) {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':'\\|,.<>/?]/.test(pwd)) score++;
    if (score <= 2) return { level: score, label: 'Weak', color: '#ef4444' };
    if (score === 3) return { level: score, label: 'Fair', color: '#f59e0b' };
    if (score === 4) return { level: score, label: 'Good', color: '#3b82f6' };
    return { level: score, label: 'Strong', color: '#22c55e' };
}

function Field({ label, error, touched, children }) {
    return (
        <div className='mb-3 sm:mb-4'>
            <label className='block text-sm font-medium text-[#aaa] mb-1 sm:mb-1.5'>{label}</label>
            {children}
            <div style={{ maxHeight: error && touched ? '40px' : '0', opacity: error && touched ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease, opacity 0.2s ease' }}>
                <p className='flex items-center gap-1.5 mt-1.5 text-xs text-[#ef4444]'>
                    <AlertCircle size={12} className='shrink-0' />
                    {error}
                </p>
            </div>
        </div>
    );
}

function ApiErrorBanner({ error }) {
    return (
        <div style={{ maxHeight: error ? '60px' : '0', opacity: error ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease, opacity 0.25s ease', marginBottom: error ? '16px' : '0' }}>
            <div className='flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-[#1a0a0a] border border-[#3d1515] text-xs text-[#f87171]'>
                <AlertCircle size={13} className='shrink-0 mt-0.5' />
                {error}
            </div>
        </div>
    );
}

function Spinner() {
    return (
        <svg className='animate-spin' width='14' height='14' viewBox='0 0 24 24' fill='none'>
            <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' strokeOpacity='0.3' />
            <path d='M12 2a10 10 0 0 1 10 10' stroke='currentColor' strokeWidth='3' strokeLinecap='round' />
        </svg>
    );
}

const STEP_LABELS = ['Your info', 'Verify', 'Password'];

function StepCircle({ done, active, number }) {
    if (done) {
        return (
            <svg width='24' height='24' viewBox='0 0 24 24' style={{ flexShrink: 0 }}>
                <circle cx='12' cy='12' r='11.5' fill='none' stroke='#D9A919' strokeWidth='1' />
                <polyline points='7,12 10.5,15.5 17,9' fill='none' stroke='#D9A919' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        );
    }
    return (
        <svg width='24' height='24' viewBox='0 0 24 24' style={{ flexShrink: 0 }}>
            <circle cx='12' cy='12' r='12' fill={active ? '#D9A919' : '#1a1a1a'} />
            {!active && <circle cx='12' cy='12' r='11.5' fill='none' stroke='#2a2a2a' strokeWidth='1' />}
            <text x='12' y='12' textAnchor='middle' dominantBaseline='central' fontSize='11' fontWeight='700' fill={active ? '#000' : '#555'} fontFamily='inherit'>
                {number}
            </text>
        </svg>
    );
}

function StepIndicator({ step }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {STEP_LABELS.map((label, i) => {
                const done = i < step;
                const active = i === step;
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {i > 0 && <div style={{ width: '32px', height: '1px', background: done || active ? 'rgba(217,169,25,0.4)' : '#2a2a2a', transition: 'background 0.5s' }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <StepCircle done={done} active={active} number={i + 1} />
                            <span style={{ fontSize: '12px', fontWeight: 500, color: active ? '#D9A919' : '#555', transition: 'color 0.3s' }}>{label}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function Background() {
    return (
        <>
            <div
                className='absolute pointer-events-none'
                style={{ top: 0, right: 0, width: '45%', height: '70%', background: 'radial-gradient(ellipse at 100% 0%, rgba(217,169,25,0.15) 0%, transparent 60%)' }}
            />
            <div
                className='absolute pointer-events-none'
                style={{ bottom: 0, left: 0, width: '45%', height: '70%', background: 'radial-gradient(ellipse at 0% 100%, rgba(217,169,25,0.12) 0%, transparent 60%)' }}
            />
            <svg className='absolute inset-0 w-full h-full pointer-events-none' viewBox='0 0 1000 800' preserveAspectRatio='xMidYMid slice'>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <path
                        key={`tr-${i}`}
                        d={`M ${1000} ${i * 80} Q ${800 - i * 30} ${200 + i * 60} ${600 - i * 40} ${800}`}
                        fill='none'
                        stroke={`rgba(217,169,25,${0.2 - i * 0.02})`}
                        strokeWidth='0.7'
                    />
                ))}
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <path
                        key={`bl-${i}`}
                        d={`M ${0} ${800 - i * 80} Q ${200 + i * 30} ${600 - i * 60} ${400 + i * 40} ${0}`}
                        fill='none'
                        stroke={`rgba(217,169,25,${0.17 - i * 0.02})`}
                        strokeWidth='0.7'
                    />
                ))}
            </svg>
        </>
    );
}

function Panel({ index, step, children }) {
    const isActive = step === index;
    const isPast = step > index;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateX(0px)' : isPast ? 'translateX(-32px)' : 'translateX(32px)',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
                pointerEvents: isActive ? 'auto' : 'none',
                visibility: isActive ? 'visible' : 'hidden',
            }}
        >
            {children}
        </div>
    );
}

function StepInfo({ values, setValues, onNext }) {
    const [activeErrorField, setActiveErrorField] = useState(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const set = (field) => (e) => {
        setValues((v) => ({ ...v, [field]: e.target.value }));
        if (activeErrorField === field) setActiveErrorField(null);
        if (apiError) setApiError('');
    };
    const errorFor = (field) => (activeErrorField === field ? validate(field, values[field]) : null);

    const isValid = values.fullName && values.email;

    const handleContinue = async () => {
        for (const field of ['fullName', 'email']) {
            const err = validate(field, values[field]);
            if (err) {
                setActiveErrorField(field);
                return;
            }
        }
        setActiveErrorField(null);
        try {
            setLoading(true);
            const data = await verifyEmail({
                email: values.email.trim(),
                name: 'farid',
            });
            if (data.success) {
                toast('OTP sent to your email.', 'success');
                onNext();
            }
        } catch (error) {
            setApiError(error.response?.data?.message || error.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='w-full'>
            <div className='text-center mb-4 sm:mb-7'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight whitespace-nowrap'>
                    Sign up for <span className='text-[#D9A919]'>Resume Analyser</span>
                </h1>
                <p className='mt-1.5 sm:mt-2 text-sm sm:text-base text-[#8a8686]'>
                    Already have an account?{' '}
                    <Link to='/login' className='inline-flex items-center gap-1 text-[#D9A919] group'>
                        Log in <ArrowRight size={15} className='transition-transform duration-300 group-hover:translate-x-0.5' />
                    </Link>
                </p>
            </div>

            <div className='mb-4 sm:mb-5'>
                <button className='w-full flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-sm font-medium text-gray-300 hover:border-[#4a3a10] hover:bg-[#161200] hover:text-white transition-all duration-200 cursor-pointer'>
                    <svg width='16' height='16' viewBox='0 0 24 24'>
                        <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
                        <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
                        <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z' />
                        <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
                    </svg>
                    Sign up with Google
                </button>
            </div>

            <div className='flex items-center gap-3 mb-4 sm:mb-5'>
                <div className='flex-1 h-px bg-[#222]' />
                <span className='text-sm text-[#555]'>or</span>
                <div className='flex-1 h-px bg-[#222]' />
            </div>

            <ApiErrorBanner error={apiError} />

            <Field label='Full Name' error={errorFor('fullName')} touched={activeErrorField === 'fullName'}>
                <div className='relative'>
                    <User size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]' />
                    <input
                        type='text'
                        value={values.fullName}
                        onChange={set('fullName')}
                        placeholder='Negan Smith'
                        className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-[#111] border text-sm text-white placeholder-[#444] focus:outline-none transition-all duration-200 ${activeErrorField === 'fullName' ? 'border-[#ef4444] focus:border-[#ef4444]' : 'border-[#2a2a2a] hover:border-[#444242] focus:border-[#D9A919]'}`}
                    />
                </div>
            </Field>

            <Field label='Email' error={errorFor('email')} touched={activeErrorField === 'email'}>
                <div className='relative'>
                    <Mail size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]' />
                    <input
                        type='email'
                        value={values.email}
                        onChange={set('email')}
                        placeholder='negan.smith@example.com'
                        className={`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-[#111] border text-sm text-white placeholder-[#444] focus:outline-none transition-all duration-200 ${activeErrorField === 'email' ? 'border-[#ef4444] focus:border-[#ef4444]' : 'border-[#2a2a2a] hover:border-[#444242] focus:border-[#D9A919]'}`}
                    />
                </div>
            </Field>

            <button
                onClick={handleContinue}
                disabled={!isValid || loading}
                className='w-full mt-2 py-2 sm:py-2.5 rounded-xl bg-[#D9A919] text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(217,169,25,0.35)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer'
            >
                {loading ? (
                    <span className='flex items-center justify-center gap-2'>
                        <Spinner />
                        Sending OTP…
                    </span>
                ) : (
                    <span className='flex items-center justify-center gap-1.5'>
                        Continue <ArrowRight size={15} />
                    </span>
                )}
            </button>

            <p className='mt-4 sm:mt-5 text-center text-xs text-[#444] leading-relaxed'>
                By signing up, you agree to our{' '}
                <Link to='/terms' className='text-[#888] hover:text-[#D9A919] transition-colors duration-200'>
                    Terms
                </Link>{' '}
                and{' '}
                <Link to='/privacy' className='text-[#888] hover:text-[#D9A919] transition-colors duration-200'>
                    Privacy Policy
                </Link>
                .
            </p>
        </div>
    );
}

function StepOtp({ email, onNext, onBack, active }) {
    const OTP_LENGTH = 4;

    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const [activeError, setActiveError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0); // start at 0
    const [resendSuccess, setResendSuccess] = useState(false);

    const inputRefs = useRef([]);

    const prevActiveRef = useRef(false);

    useEffect(() => {
        if (active && !prevActiveRef.current) {
            setResendTimer(30);
            setOtp(Array(OTP_LENGTH).fill(''));
            setActiveError('');
            setResendSuccess(false);
        }
        prevActiveRef.current = active;
    }, [active]);

    useEffect(() => {
        if (active) {
            const id = setTimeout(() => inputRefs.current[0]?.focus(), 350);
            return () => clearTimeout(id);
        }
    }, [active]);

    useEffect(() => {
        if (resendTimer === 0) return;
        const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
        return () => clearTimeout(id);
    }, [resendTimer]);

    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        setActiveError('');
        setResendSuccess(false);
        if (val && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (activeError) setActiveError('');
        if (e.key === 'Backspace' && !otp[i] && i > 0) {
            inputRefs.current[i - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;
        const next = [...otp];
        pasted.split('').forEach((ch, i) => {
            next[i] = ch;
        });
        setOtp(next);
        inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < OTP_LENGTH) {
            setActiveError(`Please enter the full ${OTP_LENGTH}-digit code.`);
            return;
        }
        try {
            setLoading(true);
            const data = await verifyOtp({ email, otp: code });
            if (data.success) onNext();
        } catch (error) {
            setActiveError(error.response?.data?.error || 'Invalid or expired OTP. Please try again.');
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setResendLoading(true);
            await verifyEmail({ email });
            setResendTimer(60);
            setResendSuccess(true);
            toast('New OTP sent successfully.', 'success');
            setActiveError('');
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } catch (error) {
            setActiveError(error.response?.data?.error || 'Failed to resend. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    const maskedEmail = email ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c) : '';
    const filled = otp.every((d) => d !== '');

    return (
        <div className='w-full'>
            <div className='text-center mb-6 sm:mb-8'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Check your email</h1>
                <p className='mt-2 text-sm text-[#8a8686] leading-relaxed'>
                    We sent a {OTP_LENGTH}-digit code to <span className='text-[#D9A919] font-medium'>{maskedEmail}</span>
                </p>
            </div>

            <div className='flex justify-center gap-2 sm:gap-3 mb-2' onPaste={handlePaste}>
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type='text'
                        inputMode='numeric'
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className={`w-12 h-13 sm:w-14 sm:h-14 text-center text-lg font-bold rounded-xl bg-[#111] border transition-all duration-200 focus:outline-none
                        ${activeError ? 'border-[#ef4444] text-[#ef4444]' : digit ? 'border-[#D9A919] text-white' : 'border-[#2a2a2a] text-white focus:border-[#D9A919]'}`}
                    />
                ))}
            </div>

            <div style={{ maxHeight: activeError ? '40px' : '0', opacity: activeError ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease, opacity 0.2s ease' }}>
                <p className='flex items-center justify-center gap-1.5 mt-2 text-xs text-[#ef4444]'>
                    <AlertCircle size={12} className='shrink-0' />
                    {activeError}
                </p>
            </div>

            <div style={{ maxHeight: resendSuccess ? '40px' : '0', opacity: resendSuccess ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease, opacity 0.2s ease' }}>
                <p className='flex items-center justify-center gap-1.5 mt-2 text-xs text-[#22c55e]'>
                    <CheckCircle2 size={12} className='shrink-0' />
                    New code sent successfully.
                </p>
            </div>

            <button
                onClick={handleVerify}
                disabled={!filled || loading}
                className='w-full mt-5 py-2 sm:py-2.5 rounded-xl bg-[#D9A919] text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(217,169,25,0.35)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer'
            >
                {loading ? (
                    <span className='flex items-center justify-center gap-2'>
                        <Spinner />
                        Verifying…
                    </span>
                ) : (
                    'Verify'
                )}
            </button>

            <p className='mt-4 text-center text-sm text-[#555]'>
                Didn't receive it?{' '}
                {resendTimer > 0 ? (
                    <span className='text-[#444]'>
                        Resend in <span className='text-[#888]'>{resendTimer}s</span>
                    </span>
                ) : (
                    <button onClick={handleResend} disabled={resendLoading} className='text-[#D9A919] hover:underline disabled:opacity-50 cursor-pointer transition-opacity duration-200'>
                        {resendLoading ? 'Sending…' : 'Resend code'}
                    </button>
                )}
            </p>

            <p className='mt-3 text-center text-xs text-[#444]'>
                Wrong email?{' '}
                <button onClick={onBack} className='text-[#888] hover:text-[#D9A919] transition-colors duration-200 cursor-pointer'>
                    Go back and change it
                </button>
            </p>
        </div>
    );
}

function StepPassword({ name, email, onDone }) {
    const [values, setValues] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [activeErrorField, setActiveErrorField] = useState(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const set = (field) => (e) => {
        setValues((v) => ({ ...v, [field]: e.target.value }));
        if (activeErrorField === field) setActiveErrorField(null);
        if (apiError) setApiError('');
    };

    const strength = getStrength(values.password);
    const errorFor = (field) => (activeErrorField === field ? validate(field, values[field], { password: values.password }) : null);
    const isValid = values.password && values.confirmPassword;

    const handleCreate = async () => {
        for (const field of ['password', 'confirmPassword']) {
            const err = validate(field, values[field], { password: values.password });
            if (err) {
                setActiveErrorField(field);
                return;
            }
        }
        setActiveErrorField(null);
        try {
            setLoading(true);
            const data = await createAccount({ email, password: values.password });
            console.log(data);
            console.log(data.user.token);
            if (data.success) {
                localStorage.setItem('token', data.user.token);

                localStorage.setItem(
                    'toastAfterRedirect',
                    JSON.stringify({
                        message: 'Account created successfully.',
                        type: 'success',
                    }),
                );

                const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
                localStorage.removeItem('redirectAfterLogin');
                onDone(redirectPath);
            }
        } catch (error) {
            setApiError(error.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='w-full'>
            <div className='text-center mb-6 sm:mb-8'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Set your password</h1>
                <p className='mt-2 text-sm text-[#8a8686]'>
                    Almost there, <span className='text-[#D9A919] font-medium'>{name.split(' ')[0]}</span>
                </p>
            </div>

            <ApiErrorBanner error={apiError} />

            <Field label='Password' error={errorFor('password')} touched={activeErrorField === 'password'}>
                <div className='relative'>
                    <Lock size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]' />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={values.password}
                        onChange={set('password')}
                        placeholder='••••••••'
                        autoComplete='new-password'
                        className={`w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-xl bg-[#111] border text-sm text-white placeholder-[#444] focus:outline-none transition-all duration-200 ${activeErrorField === 'password' ? 'border-[#ef4444] focus:border-[#ef4444]' : 'border-[#2a2a2a] hover:border-[#444242] focus:border-[#D9A919]'}`}
                    />
                    <button
                        type='button'
                        onClick={() => setShowPassword((v) => !v)}
                        className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#D9A919] transition-colors duration-200'
                    >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                </div>
                {values.password && (
                    <div className='mt-2'>
                        <div className='flex gap-1 mb-1'>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className='flex-1 h-0.5 rounded-full transition-all duration-300' style={{ backgroundColor: i <= strength.level ? strength.color : '#222' }} />
                            ))}
                        </div>
                        <p className='text-xs' style={{ color: strength.color }}>
                            {strength.label}
                        </p>
                    </div>
                )}
            </Field>

            <div className='mb-5 sm:mb-6'>
                <Field label='Confirm Password' error={errorFor('confirmPassword')} touched={activeErrorField === 'confirmPassword'}>
                    <div className='relative'>
                        <Lock size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]' />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={values.confirmPassword}
                            onChange={set('confirmPassword')}
                            autoComplete='new-password'
                            placeholder='••••••••'
                            className={`w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-xl bg-[#111] border text-sm text-white placeholder-[#444] focus:outline-none transition-all duration-200 ${
                                activeErrorField === 'confirmPassword'
                                    ? 'border-[#ef4444] focus:border-[#ef4444]'
                                    : values.confirmPassword && values.confirmPassword === values.password
                                      ? 'border-[#22c55e] focus:border-[#22c55e]'
                                      : 'border-[#2a2a2a] hover:border-[#444242] focus:border-[#D9A919]'
                            }`}
                        />
                        <button
                            type='button'
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#D9A919] transition-colors duration-200'
                        >
                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        {values.confirmPassword && values.confirmPassword === values.password && (
                            <CheckCircle2 size={14} className='absolute right-9 top-1/2 -translate-y-1/2 text-[#22c55e] pointer-events-none' />
                        )}
                    </div>
                </Field>
            </div>

            <button
                onClick={handleCreate}
                disabled={!isValid || loading}
                className='w-full py-2 sm:py-2.5 rounded-xl bg-[#D9A919] text-black font-semibold text-sm hover:shadow-[0_0_20px_rgba(217,169,25,0.35)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer'
            >
                {loading ? (
                    <span className='flex items-center justify-center gap-2'>
                        <Spinner />
                        Creating account…
                    </span>
                ) : (
                    'Create account'
                )}
            </button>
            <p className='mt-4 sm:mt-5 text-center text-xs text-[#444] leading-relaxed'>
                By signing up, you agree to our{' '}
                <Link to='/terms' className='text-[#888] hover:text-[#D9A919] transition-colors duration-200'>
                    Terms
                </Link>{' '}
                and{' '}
                <Link to='/privacy' className='text-[#888] hover:text-[#D9A919] transition-colors duration-200'>
                    Privacy Policy
                </Link>
                .
            </p>
        </div>
    );
}

const STEP_HEIGHTS = ['auto', '340px', '420px'];

export default function Signup() {
    const [step, setStep] = useState(0);
    const [info, setInfo] = useState({ fullName: '', email: '' });

    const navigate = useNavigate();

    const goTo = (nextStep) => setStep(nextStep);

    return (
        <div className='relative min-h-screen w-full bg-[#0A0A0A] text-white overflow-hidden flex items-center justify-center'>
            <Background />

            {step === 0 ? (
                <Link to='/' className='group absolute top-6 left-6 flex items-center gap-1.5 text-sm md:text-base text-[#8a8686] hover:text-[#D9A919] transition-colors duration-200 z-10'>
                    <ArrowLeft className='duration-300 group-hover:-translate-x-0.5 transition-transform' size={15} strokeWidth={2} />
                    Home
                </Link>
            ) : (
                <button
                    onClick={() => {
                        if (step === 2) {
                            goTo(0);
                        } else {
                            goTo(step - 1);
                        }
                    }}
                    className='group absolute top-6 left-6 flex items-center gap-1.5 text-sm md:text-base text-[#8a8686] hover:text-[#D9A919] transition-colors duration-200 z-10 cursor-pointer'
                >
                    <ArrowLeft className='duration-300 group-hover:-translate-x-0.5 transition-transform' size={15} strokeWidth={2} />
                    Back
                </button>
            )}
            <div className='relative z-10 w-full max-w-sm mx-4 py-10 sm:py-12'>
                <StepIndicator step={step} />

                <div style={{ position: 'relative', minHeight: step === 0 ? undefined : STEP_HEIGHTS[step], transition: 'min-height 0.35s ease' }}>
                    <div
                        style={{
                            opacity: step === 0 ? 1 : 0,
                            transform: step === 0 ? 'translateX(0px)' : 'translateX(-32px)',
                            transition: 'opacity 0.35s ease, transform 0.35s ease',
                            pointerEvents: step === 0 ? 'auto' : 'none',
                            visibility: step === 0 ? 'visible' : 'hidden',
                        }}
                    >
                        <StepInfo values={info} setValues={setInfo} onNext={() => goTo(1)} />
                    </div>

                    <Panel index={1} step={step}>
                        <StepOtp email={info.email} active={step === 1} onNext={() => goTo(2)} onBack={() => goTo(0)} />
                    </Panel>

                    <Panel index={2} step={step}>
                        <StepPassword name={info.fullName} email={info.email} onDone={(path) => navigate(path, { replace: true })} />
                    </Panel>
                </div>
            </div>
        </div>
    );
}
