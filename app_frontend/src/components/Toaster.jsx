import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react'

let toasterHandler = null

export function toast(message, type = 'success') {
    if (toasterHandler) toasterHandler(message, type)
}

const ICONS = {
    success: <CheckCircle2 size={15} />,
    error: <AlertCircle size={15} />,
    info: <Info size={15} />
}

const STYLES = {
    success: {
        border: 'rgba(217,169,25,0.3)',
        bg: 'rgba(217,169,25,0.06)',
        color: '#D9A919',
        glow: 'rgba(217,169,25,0.12)'
    },
    error: {
        border: 'rgba(239,68,68,0.3)',
        bg: 'rgba(239,68,68,0.06)',
        color: '#f87171',
        glow: 'rgba(239,68,68,0.1)'
    },
    info: {
        border: 'rgba(139,139,139,0.3)',
        bg: 'rgba(139,139,139,0.06)',
        color: '#aaaaaa',
        glow: 'transparent'
    }
}

export default function Toaster() {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type) => {
        const id = Date.now()
        setToasts(prev => [ ...prev, { id, message, type, visible: true } ])
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false }: t))
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, 350);
        }, 3500);
    }, [])

    useEffect(() => {
        toasterHandler = addToast
        return () => { toasterHandler = null }
    }, [addToast])

    const dismiss = (id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 350);
    }

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            {toasts.map(({ id, message, type, visible }) => {
                const s = STYLES[type] || STYLES.info
                return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '14px', background: '#0e0e0e', border: `1px solid ${s.border}`, boxShadow: `0 0 20px ${s.glow}, 0 4px 24px rgba(0,0,0,0.4)`, color: s.color, fontSize: '13px', fontWeight: 500, maxWidth: '320px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.97)', transition: 'opacity 0.3s ease, transform 0.3s ease', backdropFilter: 'blur(8px)'}}>
                        <span style={{ color: s.color, flexShrink: 0 }}>{ICONS[type]}</span>
                        <span style={{ color: '#ddd', lineHeight: 1.4 }}>{message}</span>
                        <button onClick={() => dismiss(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '2px', marginLeft: '4px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                            <X size={13} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}