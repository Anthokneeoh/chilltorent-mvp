'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDate, timeAgo } from '@/lib/utils/formatters'
import { Send, CheckCheck, Check, MessageSquare, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Message = Database['public']['Tables']['messages']['Row'] & {
    sender?: { full_name: string }
}

interface ChatWindowProps {
    viewingRequestId: string
    currentUserId: string
    otherPartyName: string
    propertyTitle?: string
    onClose?: () => void
}

export function ChatWindow({
    viewingRequestId,
    currentUserId,
    otherPartyName,
    propertyTitle,
    onClose,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchMessages = async () => {
            setIsLoading(true)
            try {
                const { data, error } = await (supabase
                    .from('messages') as any)
                    .select(`
            *,
            sender:sender_id (full_name)
          `)
                    .eq('viewing_request_id', viewingRequestId)
                    .order('created_at', { ascending: true })

                if (error) throw error
                setMessages(data || [])
            } catch (err) {
                console.error('Failed to hydrate historical chat indexes:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()
    }, [viewingRequestId])

    useEffect(() => {
        const channel = supabase
            .channel(`chat:${viewingRequestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `viewing_request_id=eq.${viewingRequestId}`,
                },
                async (payload) => {
                    const rawMessage = payload.new as Database['public']['Tables']['messages']['Row']

                    const synthesizedMessage: Message = {
                        ...rawMessage,
                        sender: {
                            full_name: rawMessage.sender_id === currentUserId ? 'You' : otherPartyName
                        }
                    }

                    setMessages((prev) => {
                        const dynamicDuplicateGuard = prev.some((m) => m.id === synthesizedMessage.id)
                        if (dynamicDuplicateGuard) return prev
                        return [...prev, synthesizedMessage]
                    })

                    if (synthesizedMessage.sender_id !== currentUserId) {
                        await (supabase.from('messages') as any)
                            .update({ is_read: true })
                            .eq('id', synthesizedMessage.id)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [viewingRequestId, currentUserId, otherPartyName])

    useEffect(() => {
        const markAllAsReadBatched = async () => {
            const unreadIds = messages
                .filter((m) => m.sender_id !== currentUserId && !m.is_read)
                .map((m) => m.id)

            if (unreadIds.length === 0) return

            try {
                const { error } = await (supabase.from('messages') as any)
                    .update({ is_read: true })
                    .in('id', unreadIds)

                if (error) throw error

                setMessages((prev) =>
                    prev.map((m) => (unreadIds.includes(m.id) ? { ...m, is_read: true } : m))
                )
            } catch (err) {
                console.error('Failed to commit transaction batch state updates:', err)
            }
        }

        markAllAsReadBatched()
    }, [messages, currentUserId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!newMessage.trim() || isSending) return

        setIsSending(true)
        const messageBody = newMessage.trim()
        setNewMessage('')

        try {
            const payload: Database['public']['Tables']['messages']['Insert'] = {
                viewing_request_id: viewingRequestId,
                sender_id: currentUserId,
                body: messageBody,
                is_read: false,
            }

            const { error } = await (supabase.from('messages') as any).insert(payload)
            if (error) throw error

            fetch('/api/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chat_nudge',
                    data: { senderName: 'User', propertyTitle: propertyTitle },
                }),
            }).catch(console.error)

        } catch (err) {
            console.error('Failed to commit single text ingestion vector:', err)
            setNewMessage(messageBody)
        } finally {
            setIsSending(false)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const getMessageStatusIcon = (message: Message) => {
        if (message.sender_id !== currentUserId) return null
        return message.is_read ? (
            <CheckCheck className="h-3 w-3 text-sky-connect shrink-0" />
        ) : (
            <Check className="h-3 w-3 text-stone-slate/60 shrink-0" />
        )
    }

    return (
        <div className="flex flex-col h-[550px] bg-pure-white rounded-2xl border border-pale-ash/40 shadow-subtle overflow-hidden text-charcoal-tone">

            {/* Header Panel Layout */}
            <div className="flex items-center justify-between border-b border-pale-ash/40 px-5 py-3.5 bg-cloud-whisper/60">
                <div>
                    <h3 className="font-bold text-sm tracking-tight text-charcoal-tone">{otherPartyName}</h3>
                    {propertyTitle && (
                        <p className="text-[11px] font-semibold text-inkwell-gray mt-0.5">Regarding Listing: {propertyTitle}</p>
                    )}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-xs font-black text-stone-slate hover:text-charcoal-tone h-6 w-6 rounded-full hover:bg-pale-ash/40 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Message Streaming Canvas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-pure-white">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-2 text-xs font-semibold text-sky-connect">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Establishing live channel streams...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-stone-slate p-6">
                        <MessageSquare className="h-8 w-8 mb-2 text-sky-connect opacity-40 animate-pulse" />
                        <p className="text-xs font-bold text-charcoal-tone">Communication channel is initialized</p>
                        <p className="text-[11px] font-medium text-stone-slate mt-0.5">Type your inquiries below to sync conversation logs instantly.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === currentUserId
                        return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm space-y-1 ${isOwn ? 'bg-sky-connect text-pure-white rounded-br-none' : 'bg-cloud-whisper/60 border border-pale-ash/20 text-charcoal-tone rounded-bl-none'
                                    }`}>
                                    <p className="text-xs font-medium leading-relaxed break-words whitespace-pre-wrap">{msg.body}</p>
                                    <div className="flex items-center justify-end gap-1.5 opacity-80 pt-0.5">
                                        <span className="text-[9px] font-semibold tracking-wide uppercase">
                                            {timeAgo(msg.created_at)}
                                        </span>
                                        {getMessageStatusIcon(msg)}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Form Input Frame */}
            <div className="border-t border-pale-ash/40 p-4 bg-pure-white">
                <div className="flex items-center gap-2.5">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message context here..."
                        className="flex-1 px-4 py-3 border border-pale-ash/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-connect/40 bg-pure-white shadow-sm transition-all placeholder:text-stone-slate/60"
                        disabled={isSending}
                        maxLength={1000}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="p-3 bg-sky-connect text-pure-white rounded-xl hover:bg-sky-connect/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}