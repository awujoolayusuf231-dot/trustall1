import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const initialMessages = [
  {
    id: 1,
    author: 'ai',
    text: 'Welcome to Trustall! Looking for a verified seller, or have questions about how orders, payments, or disputes work?',
  },
]

const contactPattern = /([\w.+-]+@[\w-]+\.[\w.-]+)|(\+?\d[\d\s().-]{7,}\d)/g

function getWhatsAppNumber(value) {
  const digitsOnly = value.replace(/[^\d]/g, '')
  if (digitsOnly.startsWith('234')) return digitsOnly
  return `234${digitsOnly.replace(/^0/, '')}`
}

function renderInlineMarkdown(text, keyPrefix = 'inline') {
  const parts = []
  const inlinePattern = /(\*\*[^*]+\*\*)|([\w.+-]+@[\w-]+\.[\w.-]+)|(\+?\d[\d\s().-]{7,}\d)|(https?:\/\/[^\s)]+)/g
  let lastIndex = 0
  let match

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))

    if (match[1]) {
      parts.push(
        <strong key={`${keyPrefix}-bold-${match.index}`}>
          {renderInlineMarkdown(match[1].slice(2, -2), `${keyPrefix}-bold-${match.index}`)}
        </strong>,
      )
    } else if (match[2]) {
      parts.push(
        <a
          key={`${keyPrefix}-email-${match.index}`}
          href={`mailto:${match[2]}`}
          className="underline decoration-white/50 underline-offset-2 hover:text-white"
        >
          {match[2]}
        </a>,
      )
    } else if (match[3]) {
      parts.push(
        <a
          key={`${keyPrefix}-phone-${match.index}`}
          href={`https://wa.me/${getWhatsAppNumber(match[3])}`}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-white/50 underline-offset-2 hover:text-white"
        >
          {match[3]}
        </a>,
      )
    } else if (match[4]) {
      const url = match[4]
      const isInternal = url.startsWith(window.location.origin)
      parts.push(
        <a
          key={`${keyPrefix}-url-${match.index}`}
          href={url}
          {...(isInternal ? {} : { target: '_blank', rel: 'noreferrer' })}
          className="underline decoration-white/50 underline-offset-2 hover:text-white"
        >
          {url.replace(/^https?:\/\//, '')}
        </a>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function renderAiMessage(text) {
  const lines = String(text || '').split(/\r?\n/)
  const blocks = []
  let bulletItems = []

  const flushBullets = () => {
    if (bulletItems.length === 0) return
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {bulletItems.map((item, index) => (
          <li key={`item-${index}`}>{renderInlineMarkdown(item, `list-${blocks.length}-${index}`)}</li>
        ))}
      </ul>,
    )
    bulletItems = []
  }

  lines.forEach((line, index) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/)
    if (bulletMatch) {
      bulletItems.push(bulletMatch[1])
      return
    }

    flushBullets()
    if (line.trim()) {
      blocks.push(
        <p key={`paragraph-${index}`}>{renderInlineMarkdown(line, `paragraph-${index}`)}</p>,
      )
    }
  })

  flushBullets()
  return <div className="space-y-2">{blocks}</div>
}

export default function TrustallChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    console.debug('Supabase env present:', {
      VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    })
  }, [])

  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const appendMessage = (message) => {
    setMessages((current) => [...current, { id: current.length + 1, ...message }])
  }

  const getAiErrorMessage = (error) => {
    const message = error?.message || error?.details || error?.hint || ''
    const lower = message.toLowerCase()

    if (!message) {
      return 'Trustall AI is not responding right now. Please try again in a moment.'
    }

    if (lower.includes('not found') || lower.includes('function not found')) {
      return 'Trustall AI is not deployed yet. Please deploy the ai-matchmaker function in Supabase and try again.'
    }

    if (lower.includes('api key') || lower.includes('no ai api key configured') || lower.includes('gemini') || lower.includes('openai')) {
      return 'Trustall AI is not configured yet. Add GEMINI_API_KEY or OPENAI_API_KEY as a Supabase secret, then deploy the ai-matchmaker function.'
    }

    return message
  }

  const handleSend = async () => {
    const userText = input.trim()
    if (!userText || isLoading) return

    appendMessage({ author: 'user', text: userText })
    setInput('')
    setIsLoading(true)

    try {
      const res = await supabase.functions.invoke('ai-matchmaker', {
        body: { query: userText },
      })
      console.debug('ai-matchmaker response:', res)

      const { data, error } = res || {}
      if (error) {
        console.error('Supabase function error:', error)
        appendMessage({
          author: 'ai',
          text: getAiErrorMessage(error),
        })
      } else if (!data || !data.reply) {
        console.error('Supabase function returned no reply:', res)
        appendMessage({
          author: 'ai',
          text: 'Trustall AI returned an empty response. Please try again in a moment.',
        })
      } else {
        appendMessage({ author: 'ai', text: data.reply })
      }
    } catch (err) {
      console.error('Invoke exception:', err)
      appendMessage({
        author: 'ai',
        text: getAiErrorMessage(err),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  if (pathname.startsWith('/messages')) return null

  return (
    <div className="fixed inset-x-3 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-[60] flex items-end justify-end md:inset-x-auto md:bottom-20 md:right-6">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#CC0000] text-white shadow-xl shadow-red-700/30 transition-transform duration-200 hover:-translate-y-0.5"
          aria-label="Open Trustall Chat"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="flex h-[min(460px,calc(100dvh-12rem))] max-h-[calc(100dvh-12rem)] w-full max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0a]/[0.85] p-3 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-4 md:h-[min(600px,calc(100dvh-8rem))] md:max-h-[calc(100dvh-8rem)] md:max-w-md md:w-[360px]">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Trustall AI Matchmaker</h2>
              <p className="text-sm text-gray-400">Ask about sellers, payments, and marketplace security.</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm text-white sm:pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-4 py-3 shadow-sm ${
                    message.author === 'user'
                      ? 'bg-[#CC0000] text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {message.author === 'ai' ? renderAiMessage(message.text) : message.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-3xl bg-gray-800 px-4 py-3 text-gray-100 shadow-sm">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white" />
                  <span className="h-2.5 w-2.5 animate-[bounce_1s_infinite] rounded-full bg-white animation-delay-150" />
                  <span className="h-2.5 w-2.5 animate-[bounce_1s_infinite] rounded-full bg-white animation-delay-300" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3 flex shrink-0 items-end gap-2 sm:mt-4 sm:gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-[44px] min-w-0 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/20 sm:px-4"
              placeholder="Type a message..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CC0000] text-white transition hover:bg-[#e00000] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
