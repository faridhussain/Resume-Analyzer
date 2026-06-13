import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false)

    return (
        <div className='relative z-20 w-full sm:w-[97%] md:w-[80%] lg:w-[70%] mx-auto'>
            <div className='bg-[#0A0A0A] flex justify-between px-4 py-4 items-center' style={{ borderBottom: '1px solid transparent', borderImage: 'linear-gradient(to right, transparent, rgba(217,169,25,0.3) 20%, rgba(245,197,23,0.6) 50%, rgba(217,169,25,0.3) 80%, transparent) 1' }}>
                <Link className='font-bold text-xl md:text-xl lg:text-2xl text-[#D9A919]'>Resume Analyser</Link>
                <div className='hidden md:flex gap-2 items-center'>
                    <Link to='/' className='text-base text-[#8a8686] font-medium hover:text-[#D9A919] px-2 py-1 rounded-lg hover:bg-[#1A1200] duration-300'>Home</Link>
                    <Link to='/about' className='text-base text-[#8a8686] font-medium hover:text-[#D9A919] px-2 py-1 rounded-lg hover:bg-[#1A1200] duration-300'>About</Link>
                    <Link to='/login' className='text-base text-[#8a8686] font-medium hover:text-[#D9A919] px-2 py-1 rounded-lg hover:bg-[#1A1200] duration-300'>Login</Link>
                    <Link to='/signup' className='group px-5 py-2 bg-[#1f1d10] flex gap-1 items-center justify-center hover:bg-[#2b280f] rounded-xl text-[#D9A919] duration-300 border border-[#65531e]'>Signup <ArrowRight className='group-hover:translate-x-0.5 transition-transform' size={17} /></Link>
                </div>
                <button className='md:hidden text-[#8a8686] hover:text-[#D9A919] transition-colors duration-200 p-1' onClick={() => setOpen(!open)} aria-label='Toggle menu'>{open ? <X size={22} /> : <Menu size={22} />}</button>
            </div>

            <div className={`md:hidden overflow-hidden transition-all duration-300 bg-[#0A0A0A] border-b border-[#211e12] ${open ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 border-none'}`}>
                <div className='flex flex-col gap-1 px-2 py-3'>
                <Link to='/' onClick={() => setOpen(false)} className='text-base text-[#8a8686] font-medium hover:text-[#D9A919] px-3 py-2 rounded-lg hover:bg-[#1A1200] duration-300'>Home</Link>
                <Link to='/about' onClick={() => setOpen(false)} className='text-base text-[#8a8686] font-medium hover:text-[#D9A919] px-3 py-2 rounded-lg hover:bg-[#1A1200] duration-300'>About</Link>
                <Link to='/login' onClick={() => setOpen(false)} className='text-base text-[#8a8686] font-medium hover:text-[#D9A919] px-3 py-2 rounded-lg hover:bg-[#1A1200] duration-300'>Login</Link>
                <Link to='/signup' onClick={() => setOpen(false)} className='group mt-1 px-4 py-2 bg-[#1f1d10] flex gap-1 items-center justify-center hover:bg-[#2b280f] rounded-xl text-[#D9A919] duration-300 border border-[#65531e] w-full'>Signup <ArrowRight className='group-hover:translate-x-0.5 transition-transform' size={17} /></Link>
                </div>
            </div>
        </div>
    )
}