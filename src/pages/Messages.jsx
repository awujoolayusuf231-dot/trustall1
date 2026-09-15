import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useProfile } from '../lib/useProfile.js'
import { markConversationRead, subscribeToMessageReadUpdates } from '../lib/readReceiptUtils.js'
import { SealMark } from '../components/Navbar.jsx'
import { isOnline, formatLastSeen, subscribeToUserPresence } from '../lib/presenceUtils.js'
import { ensureNotificationPermission, sendBrowserNotification } from '../lib/notifications.js'

export default function Messages() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { session, profile, loading } = useProfile()
  const [isMobileView, setIsMobileView] = useState(false)

  // Detect mobile view on mount and on window resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

  useEffect(() => {
    if (!loading && !session) navigate('/auth', { state: { redirectTo: '/messages' } })
  }, [loading, session, navigate])

  // Request notification permission on mount
  useEffect(() => {
    if (session?.user?.id) {
      ensureNotificationPermission().catch(err => console.warn('Notification permission request failed:', err))
    }
  }, [session?.user?.id])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  if (loading || !profile) return <div className="px-6 py-24 text-center text-muted">Loading…</div>

  const showChatFullscreen = Boolean(isMobileView && conversationId)

  return (
    <section className={showChatFullscreen
      ? "mx-auto flex h-[calc(100dvh-10rem)] min-h-0 w-full max-w-6xl flex-col overflow-hidden px-0 py-0 sm:h-[calc(100dvh-5rem)] sm:px-6 sm:py-10"
      : "mx-auto flex h-[calc(100dvh-10rem)] min-h-0 w-full max-w-6xl flex-col overflow-hidden px-6 py-10 sm:h-[calc(100dvh-5rem)]"}>
      {/* Desktop & Mobile Header */}
      {!showChatFullscreen && (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-seal">Messages</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">Your conversations</h1>
        </>
      )}

      <div className={showChatFullscreen ? "flex h-full min-h-0 flex-1 flex-col" : "mt-6 grid min-h-0 flex-1 gap-4 md:grid-cols-[280px_1fr]"} >
        {/* On mobile, show conversation list only if no conversation selected */}
        {!showChatFullscreen && (
          <ConversationList userId={session.user.id} activeId={conversationId} />
        )}

        {/* Show thread/chat */}
        {conversationId ? (
          <Thread 
            conversationId={conversationId} 
            userId={session.user.id} 
            userEmail={session.user.email}
            isMobileFullscreen={showChatFullscreen}
            onBackClick={() => navigate('/messages')}
          />
        ) : (
          <div className="hidden items-center justify-center rounded-2xl border border-hairline bg-white text-sm text-muted md:flex">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </section>
  )
}

function ConversationList({ userId, activeId }) {
  const [conversations, setConversations] = useState([])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new?.sender_id && payload.new.sender_id !== userId) {
          sendBrowserNotification('New message', payload.new.body || 'You have a new message in your conversation')
        }
        load()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  async function load() {
    const { data: conversationRows } = await supabase
      .from('conversations')
      .select(`
        id, listing_id, created_at,
        buyer:buyer_id(id, business_name, full_name, handle, avatar_url, verified_seller),
        seller:seller_id(id, business_name, full_name, handle, avatar_url, verified_seller),
        listing:listing_id(title)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    const conversationsWithActivity = conversationRows || []
    if (conversationsWithActivity.length === 0) {
      setConversations([])
      return
    }

    const conversationIds = conversationsWithActivity.map((conversation) => conversation.id)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    const lastMessageByConversation = (recentMessages || []).reduce((accumulator, message) => {
      if (!accumulator[message.conversation_id]) {
        accumulator[message.conversation_id] = message
      }
      return accumulator
    }, {})

    const nextConversations = conversationsWithActivity
      .map((conversation) => ({
        ...conversation,
        last_message_at: lastMessageByConversation[conversation.id]?.created_at || conversation.created_at,
        last_message_preview: lastMessageByConversation[conversation.id]?.body || '',
      }))
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))

    setConversations(nextConversations)
  }

  return (
    <div className="h-full min-h-0 overscroll-contain overflow-y-auto rounded-2xl border border-hairline bg-white p-2">
      {conversations.length === 0 && (
        <p className="p-4 text-sm text-muted">No conversations yet — message a seller from a listing to start one.</p>
      )}
      {conversations.map((c) => {
        const isSeller = c.seller.id === userId
        const other = isSeller ? c.buyer : c.seller
        const otherName = other.business_name || other.full_name || 'User'
        const userRole = isSeller ? 'Buyer' : 'Seller'
        const isSellerVerified = !isSeller && other.verified_seller // Show badge only for sellers in the conversation
        
        const lastMessagePreview = (c.last_message_preview || '').trim()

        return (
          <Link
            key={c.id}
            to={`/messages/${c.id}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${
              activeId === c.id ? 'bg-surfacealt' : 'hover:bg-surfacealt/60'
            }`}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-inksoft font-display text-xs font-bold text-surface">
              {other.avatar_url ? (
                <img src={other.avatar_url} alt={otherName} className="h-full w-full object-cover" />
              ) : (
                otherName.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate font-body font-medium text-ink">{otherName}</p>
                  {isSellerVerified && <SealMark size={14} />}
                </div>
                {c.last_message_at && (
                  <span className="shrink-0 font-mono text-[10px] text-muted">
                    {new Date(c.last_message_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                {userRole} {c.listing?.title ? `· ${c.listing.title}` : ''}
              </p>
              {lastMessagePreview && (
                <p className="mt-1 truncate text-xs text-muted">{lastMessagePreview}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function Thread({ conversationId, userId, userEmail, isMobileFullscreen, onBackClick }) {
  const [items, setItems] = useState([])
  const [conversation, setConversation] = useState(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [offerMode, setOfferMode] = useState(false)
  const [reportMode, setReportMode] = useState(false)
  const [latestOrderId, setLatestOrderId] = useState(null)
  const [otherUserLastSeen, setOtherUserLastSeen] = useState(null)
  const [attachmentsByMessageId, setAttachmentsByMessageId] = useState({})
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const messagesRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadThread()
    const channel = supabase
      .channel(`thread-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        // Send browser notification if sender is not current user
        if (payload.new.sender_id !== userId) {
          sendBrowserNotification('New message', payload.new.body || 'You have a new message in your conversation')
        }
        loadThread()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'offers', filter: `conversation_id=eq.${conversationId}` }, loadThread)
      .subscribe()
    
    // Mark conversation as read when opened
    markConversationRead(conversationId)
    
    // Subscribe to read receipt updates
    const unsubscribeReadUpdates = subscribeToMessageReadUpdates(conversationId, (updatedMessage) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === updatedMessage.id && item.kind === 'message'
            ? { ...item, ...updatedMessage }
            : item
        )
      )
    })

    // Subscribe to other user's presence
    let unsubscribePresence = null
    const setupPresenceSubscription = async () => {
      const { data: convo } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', conversationId)
        .single()
      
      if (convo) {
        const otherUserId = convo.buyer_id === userId ? convo.seller_id : convo.buyer_id
        
        // Fetch initial profile data with last_seen_at
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_seen_at')
          .eq('id', otherUserId)
          .single()
        
        if (profile) {
          setOtherUserLastSeen(profile.last_seen_at)
        }
        
        // Subscribe to future updates
        unsubscribePresence = subscribeToUserPresence(otherUserId, (profile) => {
          setOtherUserLastSeen(profile.last_seen_at)
        })
      }
    }
    setupPresenceSubscription()

    return () => {
      supabase.removeChannel(channel)
      if (unsubscribeReadUpdates) unsubscribeReadUpdates()
      if (unsubscribePresence) unsubscribePresence()
    }
  }, [conversationId, userId])

  useEffect(() => {
    const messagePane = messagesRef.current
    if (!messagePane) return
    messagePane.scrollTo({ top: messagePane.scrollHeight, behavior: 'smooth' })
  }, [items])

  async function loadThread() {
    const { data: convo } = await supabase
      .from('conversations')
      .select('*, buyer:buyer_id(id, business_name, full_name, avatar_url, verified_seller), seller:seller_id(id, business_name, full_name, avatar_url, verified_seller, paystack_recipient_code, paystack_subaccount_code)')
      .eq('id', conversationId).single()
    setConversation(convo)

    const [{ data: messages }, { data: offers }] = await Promise.all([
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at'),
      supabase.from('offers').select('*').eq('conversation_id', conversationId).order('created_at'),
    ])

    let attachmentMap = {}
    if ((messages || []).length > 0) {
      const messageIds = messages.map((message) => message.id)
      const { data: attachments } = await supabase.from('message_attachments').select('*').in('message_id', messageIds).order('created_at', { ascending: true })
      console.debug('Loaded message attachments for conversation', conversationId, attachments)
      const invalid = (attachments || []).filter(a => !a.file_url)
      if (invalid.length > 0) console.warn('Attachments missing file_url:', invalid)

      const attachmentsWithSignedUrls = await Promise.all(
        (attachments || []).map(async (attachment) => {
          const { data: signed, error: signError } = await supabase.storage
            .from('message-attachments')
            .createSignedUrl(attachment.file_url, 60 * 60)

          if (signError) {
            console.error('Failed to sign message attachment URL:', attachment.id, signError)
            return { ...attachment, signed_url: null }
          }

          return { ...attachment, signed_url: signed?.signedUrl || null }
        })
      )

      attachmentMap = attachmentsWithSignedUrls.reduce((accumulator, attachment) => {
        accumulator[attachment.message_id] = accumulator[attachment.message_id] || []
        accumulator[attachment.message_id].push(attachment)
        return accumulator
      }, {})
    }
    setAttachmentsByMessageId(attachmentMap)

    const merged = [
      ...(messages || []).map((m) => ({ ...m, kind: 'message' })),
      ...(offers || []).map((o) => ({ ...o, kind: 'offer' })),
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    setItems(merged)

    const acceptedOfferIds = (offers || []).filter((o) => o.status === 'accepted').map((o) => o.id)
    if (acceptedOfferIds.length > 0) {
      const { data: order } = await supabase.from('orders').select('id').in('offer_id', acceptedOfferIds)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      setLatestOrderId(order?.id || null)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!body.trim() && selectedFiles.length === 0) return
    setSending(true)
    setUploadingAttachments(true)
    try {
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: userId, body: body.trim() || '' })
        .select()
        .single()

      if (messageError) throw messageError

      if (selectedFiles.length > 0) {
        const rows = []
        for (const [index, file] of selectedFiles.entries()) {
          const path = `${conversationId}/${Date.now()}_${index}_${file.name.replace(/\s+/g, '_')}`
          const { error: uploadError } = await supabase.storage.from('message-attachments').upload(path, file, { upsert: true })
          if (uploadError) throw uploadError

          let flagged = false
          let flaggedReason = null
          if (file.type.startsWith('image/')) {
            const { data: moderation, error: moderationError } = await supabase.functions.invoke('moderate-chat-image', {
              body: { path, file_type: 'image' },
            })
            if (moderationError) {
              console.error('Chat image moderation failed:', moderationError)
            } else {
              flagged = Boolean(moderation?.flagged)
              flaggedReason = moderation?.reason || null
            }
          }

          rows.push({
            message_id: message.id,
            file_url: path,
            file_type: file.type.startsWith('video/') ? 'video' : 'image',
            flagged,
            flagged_reason: flaggedReason,
          })
        }

        if (rows.length > 0) {
          const { error: attachmentError } = await supabase.from('message_attachments').insert(rows)
          if (attachmentError) {
            console.error('message_attachments insert failed:', attachmentError)
            throw new Error(
              'Chat media could not be saved because the database policy is not set up for message attachments. Run the migration 0017_message_attachments.sql in Supabase.'
            )
          }
        }
      }

      setBody('')
      setSelectedFiles([])
      await loadThread()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert(error.message || 'Failed to send message.')
    } finally {
      setSending(false)
      setUploadingAttachments(false)
    }
  }

  if (!conversation) return <div className="rounded-2xl border border-hairline bg-white p-6 text-muted">Loading…</div>

  const isSeller = conversation.seller.id === userId
  const other = isSeller ? conversation.buyer : conversation.seller

  const isSellerInThread = !isSeller && other.verified_seller // Show badge only for sellers
  
  return (
    <div className={isMobileFullscreen ? "flex h-full min-h-0 flex-col overflow-hidden bg-white" : "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-white"}>
      <div className="flex flex-col gap-2 border-b border-hairline p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Back button for mobile */}
          {isMobileFullscreen && (
            <button
              onClick={onBackClick}
              className="flex-shrink-0 rounded-full p-2 hover:bg-surfacealt transition"
              aria-label="Back to conversations"
            >
              <svg className="h-5 w-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Profile Picture */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-inksoft font-display text-xs font-bold text-surface">
            {other.avatar_url ? (
              <img src={other.avatar_url} alt={other.business_name || other.full_name} className="h-full w-full object-cover" />
            ) : (
              (other.business_name || other.full_name || '?').slice(0, 2).toUpperCase()
            )}
          </div>
          {/* Name and Badge */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-body text-sm font-semibold text-ink">
                {other.business_name || other.full_name}
              </p>
              {isSellerInThread && <SealMark size={16} />}
            </div>
            {/* Online Status */}
            <div className="mt-0.5 flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${isOnline(otherUserLastSeen) ? 'bg-seal' : 'bg-muted'}`} />
              <p className="text-xs text-muted">
                {isOnline(otherUserLastSeen) ? 'Online' : formatLastSeen(otherUserLastSeen)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setReportMode(!reportMode)}
            className="whitespace-nowrap rounded-full border border-hairline px-3 py-1.5 font-mono text-[11px] text-muted hover:border-marigold-deep hover:text-marigold-deep sm:px-4 sm:text-xs"
          >
            {latestOrderId ? 'Report / Dispute' : 'Report'}
          </button>
          {isSeller && (
            <button
              onClick={() => setOfferMode(!offerMode)}
              className="whitespace-nowrap rounded-full bg-marigold px-3 py-1.5 font-mono text-[11px] font-semibold text-ink hover:bg-marigold-deep sm:px-4 sm:text-xs"
            >
              {offerMode ? 'Cancel' : '+ Create offer'}
            </button>
          )}
        </div>
      </div>

      {reportMode && (
        <ReportForm
          reporterId={userId}
          reportedId={other.id}
          orderId={latestOrderId}
          onDone={() => setReportMode(false)}
        />
      )}

      <div ref={messagesRef} className="flex-1 space-y-2 overscroll-contain overflow-y-auto px-3 py-3 sm:px-4" style={{ minHeight: 0 }}>
        {items.map((item) =>
          item.kind === 'offer' ? (
            <OfferCard
              key={item.id}
              offer={item}
              isSeller={isSeller}
              conversationId={conversationId}
              userId={userId}
              buyerEmail={userEmail}
              sellerRecipientCode={conversation.seller.paystack_recipient_code}
              sellerSubaccount={conversation.seller.paystack_subaccount_code}
            />
          ) : (
            <MessageBubble key={item.id} message={item} isMine={item.sender_id === userId} attachments={attachmentsByMessageId[item.id] || []} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {offerMode ? (
        <OfferForm conversationId={conversationId} sellerId={userId} onDone={() => setOfferMode(false)} />
      ) : (
        <form onSubmit={sendMessage} className="shrink-0 border-t border-hairline bg-white px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:py-3 sm:pb-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
              className="text-xs text-muted"
            />
            {selectedFiles.length > 0 && (
              <span className="text-[10px] uppercase tracking-widest text-seal">{selectedFiles.length} media selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-full bg-surfacealt px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-seal focus:ring-offset-0"
            />
            <button
              type="submit" disabled={sending || uploadingAttachments}
              className="flex-shrink-0 rounded-full bg-seal px-4 sm:px-5 py-2 sm:py-2.5 font-body text-xs sm:text-sm font-semibold text-surface hover:bg-seal/90 disabled:opacity-50 transition-colors"
            >
              {uploadingAttachments ? 'Uploading…' : sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function MessageBubble({ message, isMine, attachments = [] }) {
  const getStatusDisplay = () => {
    if (!isMine) return null
    if (!message.read_at && !message.delivered_at) {
      return <span className="text-xs text-muted">⏱️</span>
    }
    if (!message.read_at) {
      return <span className="text-xs text-muted">✓</span>
    }
    return <span className="text-xs text-seal">✓✓</span>
  }

  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-1.5 max-w-[70%]`}>
        {/* Message bubble */}
        <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
          isMine 
            ? 'rounded-3xl rounded-br-sm bg-seal text-surface' 
            : 'rounded-3xl rounded-bl-sm bg-surfacealt text-ink'
        }`}>
          {message.flagged ? (
            <p className="italic text-marigold-deep">
              ⚠️ This message was hidden — it looked like it contained bank account details. For your
              safety, keep payments inside Trustall checkout.
            </p>
          ) : (
            <>
              {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
              {attachments.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="overflow-hidden rounded-xl border border-current/15 bg-white/10">
                      {attachment.flagged ? (
                        <div className="p-3 text-xs italic text-marigold-deep">
                          ⚠️ This image was hidden — it looked like it contained contact or bank details. For your safety, keep payments and contact inside Trustall.
                        </div>
                      ) : !attachment.signed_url ? (
                        <div className="flex h-36 w-full items-center justify-center bg-black/10 text-xs text-current/60">
                          Media unavailable
                        </div>
                      ) : attachment.file_type === 'video' ? (
                        <video controls src={attachment.signed_url} className="h-36 w-full object-cover" />
                      ) : (
                        <img src={attachment.signed_url} alt="Shared media" className="h-36 w-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Status indicator */}
        {isMine && (
          <div className="flex-shrink-0 pb-0.5">
            {getStatusDisplay()}
          </div>
        )}
      </div>
    </div>
  )
}

function OfferCard({ offer, isSeller, userId, buyerEmail, sellerRecipientCode, sellerSubaccount }) {
  const [paying, setPaying] = useState(false)
  const itemTotal = Number(offer.price) + Number(offer.delivery_fee)
  const sellerFee = Math.min(itemTotal * 0.05, 5000) // 5%, capped at ₦5,000
  const buyerFee = 100 // flat escrow protection fee
  const totalCharged = itemTotal + buyerFee
  const hasConnectedPayout = Boolean(sellerRecipientCode || sellerSubaccount)

  function acceptAndPay() {
    if (!window.PaystackPop) {
      alert("Payment isn't available right now — please refresh and try again.")
      return
    }
    if (!hasConnectedPayout) {
      alert("This seller hasn't connected a payout account yet — checkout isn't available for this offer.")
      return
    }
    setPaying(true)
    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: buyerEmail,
      amount: Math.round(totalCharged * 100), // kobo — buyer's full charge, including the ₦100 fee
      currency: 'NGN',
      ref: `trustall_${offer.id}_${Date.now()}`,
      bearer: 'account', // Trustall's main account bears the Paystack processing fee, not the seller
      callback: (response) => {
        ;(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ reference: response.reference, offer_id: offer.id }),
              }
            )
            const result = await res.json()
            
            if (result.error) {
              setPaying(false)
              alert(`Payment received but couldn't be confirmed: ${result.error}. Contact ${supportEmail} with reference ${response.reference}`)
              return
            }

            // Payment verified, now record it as pending
            if (result.order_id) {
              const { error: pendingError } = await supabase.rpc('record_payment_as_pending', {
                p_order_id: result.order_id,
              })

              if (pendingError) {
                setPaying(false)
                alert(`Payment confirmed but couldn't be recorded: ${pendingError.message}. Contact ${supportEmail} with reference ${response.reference}`)
                return
              }
            }

            setPaying(false)
            alert('Payment secured. Funds will be released to the seller once you confirm delivery.')
          } catch (err) {
            setPaying(false)
            console.error('Payment callback error:', err)
            alert(`Payment processing error: ${err.message}`)
          }
        })()
      },
      onClose: () => setPaying(false),
    })
    handler.openIframe()
  }

  return (
    <div className="max-w-[85%] rounded-2xl border border-marigold/30 bg-gradient-to-br from-marigold/5 to-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-mono text-[9px] uppercase tracking-widest text-marigold-deep font-semibold">Offer</p>
          <p className="mt-2 font-display text-base font-bold text-ink">{offer.item_title}</p>
          {offer.item_description && <p className="mt-1 text-xs text-muted leading-relaxed">{offer.item_description}</p>}
        </div>
      </div>
      
      <div className="mt-4 space-y-3 border-t border-marigold/20 pt-3">
        {/* Pricing Summary */}
        <div className="flex items-baseline justify-between rounded-lg bg-seal/5 px-3 py-2">
          <span className="text-xs text-muted">Total cost:</span>
          <span className="font-display text-xl font-bold text-seal">
            ₦{(isSeller ? itemTotal - sellerFee : totalCharged).toLocaleString()}
          </span>
        </div>

        {/* Price Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white border border-hairline p-2">
            <span className="text-muted">Item:</span>
            <p className="font-semibold text-ink">₦{Number(offer.price).toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-white border border-hairline p-2">
            <span className="text-muted">Delivery:</span>
            <p className="font-semibold text-ink">₦{Number(offer.delivery_fee).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2 bg-white rounded-lg p-3 border border-hairline/50">
          <div className="flex gap-2 text-xs">
            <span className="font-semibold text-seal">🚚</span>
            <div>
              <p className="text-muted">Delivery Method</p>
              <p className="font-medium text-ink">
                {offer.delivery_type === 'fast' ? '⚡ Fast Delivery' : 'Normal Delivery'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {!isSeller && offer.status === 'pending' && (
        <>
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            🔒 Safe Pay: Your ₦{totalCharged.toLocaleString()} will be held in escrow. The seller only gets paid after you receive your item and approve it.
          </div>
          <button
            onClick={acceptAndPay}
            disabled={paying}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-seal to-seal-deep py-3 font-body text-sm font-semibold text-surface hover:shadow-lg hover:shadow-seal/20 disabled:opacity-60 disabled:cursor-not-allowed transition transform hover:-translate-y-0.5"
          >
            {paying ? 'Processing…' : `Accept & Pay ₦${totalCharged.toLocaleString()}`}
          </button>
        </>
      )}
      {offer.status !== 'pending' && (
        <div className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium" style={{
          backgroundColor: offer.status === 'accepted' ? '#10b98130' : offer.status === 'declined' ? '#ef444430' : '#f5a62230',
          color: offer.status === 'accepted' ? '#047857' : offer.status === 'declined' ? '#991b1b' : '#b45309'
        }}>
          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
        </div>
      )}
    </div>
  )
}

function OfferForm({ conversationId, sellerId, onDone }) {
  const [itemTitle, setItemTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [deliveryType, setDeliveryType] = useState('normal')
  const [fastDeliveryPrice, setFastDeliveryPrice] = useState('')
  const [normalDeliveryPrice, setNormalDeliveryPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const displayDeliveryFee = deliveryType === 'fast' ? Number(fastDeliveryPrice || 500) : Number(normalDeliveryPrice || 0)
  const totalPrice = Number(price) + displayDeliveryFee

  async function submit(e) {
    e.preventDefault()

    if (deliveryType === 'normal' && !normalDeliveryPrice) {
      alert('Please enter a normal delivery price')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        conversation_id: conversationId,
        seller_id: sellerId,
        item_title: itemTitle,
        item_description: description,
        price: Number(price),
        delivery_fee: displayDeliveryFee,
      }

      const { data: offer, error: offerError } = await supabase.from('offers').insert(payload).select().single()

      if (offerError) throw offerError

      // Create notification for the buyer
      const { data: conversation } = await supabase
        .from('conversations')
        .select('buyer_id')
        .eq('id', conversationId)
        .single()
      
      if (conversation) {
        await supabase.from('notifications').insert({
          recipient_id: conversation.buyer_id,
          sender_id: sellerId,
          type: 'offer_received',
          title: 'New offer from seller',
          message: `${itemTitle} — ₦${Number(price).toLocaleString()} (Delivery: ₦${displayDeliveryFee.toLocaleString()})`,
          related_conversation_id: conversationId,
          related_offer_id: offer.id,
        })
      }

      setSubmitting(false)
      onDone()
    } catch (err) {
      setSubmitting(false)
      console.error('Error creating offer:', err)
      alert(`Failed to create offer: ${err.message}`)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-hairline bg-gradient-to-br from-seal/5 to-surface p-4">
      <input 
        required 
        placeholder="Item title" 
        value={itemTitle} 
        onChange={(e) => setItemTitle(e.target.value)}
        className="w-full rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-seal focus:ring-1 focus:ring-seal/20 outline-none transition"
      />

      <textarea 
        placeholder="Description (optional)" 
        value={description} 
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-seal focus:ring-1 focus:ring-seal/20 outline-none transition resize-none"
      />

      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Price (₦)</label>
        <input 
          required 
          type="number" 
          min="0" 
          step="0.01"
          placeholder="0" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-seal focus:ring-1 focus:ring-seal/20 outline-none transition"
        />
      </div>

      <div className="bg-white rounded-lg p-3 border border-hairline/50 space-y-2">
        <label className="block text-xs font-semibold text-muted">Delivery Options</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-seal/5 transition">
            <input 
              type="radio" 
              name="delivery" 
              value="normal" 
              checked={deliveryType === 'normal'} 
              onChange={(e) => setDeliveryType(e.target.value)} 
              className="cursor-pointer"
            />
            <span className="flex-1 text-xs font-medium text-ink">Normal Delivery</span>
          </label>
          {deliveryType === 'normal' && (
            <input 
              required 
              type="number" 
              min="0" 
              step="0.01"
              placeholder="Delivery price ₦" 
              value={normalDeliveryPrice} 
              onChange={(e) => setNormalDeliveryPrice(e.target.value)}
              className="ml-6 w-[calc(100%-24px)] rounded-lg border border-hairline bg-seal/5 px-2.5 py-1.5 text-xs text-ink placeholder:text-muted focus:border-seal outline-none"
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-seal/5 transition">
            <input 
              type="radio" 
              name="delivery" 
              value="fast" 
              checked={deliveryType === 'fast'} 
              onChange={(e) => setDeliveryType(e.target.value)} 
              className="cursor-pointer"
            />
            <span className="flex-1 text-xs font-medium text-ink">⚡ Fast Delivery</span>
          </label>
          {deliveryType === 'fast' && (
            <input 
              type="number" 
              min="0" 
              step="0.01"
              placeholder="Fast delivery price (default: ₦500)" 
              value={fastDeliveryPrice} 
              onChange={(e) => setFastDeliveryPrice(e.target.value)}
              className="ml-6 w-[calc(100%-24px)] rounded-lg border border-hairline bg-seal/5 px-2.5 py-1.5 text-xs text-ink placeholder:text-muted focus:border-seal outline-none"
            />
          )}
        </div>
      </div>

      <div className="rounded-lg bg-gradient-to-r from-seal/10 to-seal/5 p-3 border border-seal/20">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted">Total for buyer:</span>
          <span className="font-display text-lg font-bold text-seal">₦{totalPrice.toLocaleString()}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Item: ₦{Number(price || 0).toLocaleString()} + Delivery: ₦{displayDeliveryFee.toLocaleString()}
        </p>
      </div>

      <button 
        type="submit" 
        disabled={submitting} 
        className="w-full rounded-lg bg-gradient-to-r from-seal to-seal-deep py-3 font-body text-sm font-semibold text-surface hover:shadow-lg hover:shadow-seal/20 disabled:opacity-60 disabled:cursor-not-allowed transition transform hover:-translate-y-0.5"
      >
        {submitting ? 'Sending…' : 'Send Offer'}
      </button>
    </form>
  )
}

function ReportForm({ reporterId, reportedId, orderId, onDone }) {
  const [reason, setReason] = useState(orderId ? 'Item/service not as described' : 'Suspicious behavior')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    await supabase.from('reports').insert({
      reporter_id: reporterId, reported_id: reportedId, reason, details,
      order_id: orderId || null,
      is_dispute: !!orderId,
    })
    setSubmitting(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="border-t border-hairline p-4 text-sm text-seal">
        {orderId
          ? 'Dispute submitted — Trustall will review it and reach out via WhatsApp or the platform to help resolve this between you and the other party.'
          : 'Report submitted — the Trustall team will review it.'}
        <button onClick={onDone} className="ml-2 font-mono text-xs text-muted underline">Close</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-hairline bg-marigold/5 p-4">
      {orderId && (
        <p className="text-xs text-marigold-deep">
          Disputes on an order can be raised within 2 days of receiving the item or service.
        </p>
      )}
      <select
        value={reason} onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:border-seal outline-none"
      >
        {orderId && <option>Item/service not as described</option>}
        {orderId && <option>Never received item/service</option>}
        <option>Suspicious behavior</option>
        <option>Requested payment outside Trustall</option>
        <option>Harassment or abuse</option>
        <option>Other</option>
      </select>
      <textarea
        placeholder="Add any details that would help us look into this"
        rows={2} value={details} onChange={(e) => setDetails(e.target.value)}
        className="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-seal outline-none"
      />
      <button
        type="submit" disabled={submitting}
        className="w-full rounded-full bg-marigold-deep py-2.5 font-body text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : orderId ? 'Submit dispute' : 'Submit report'}
      </button>
    </form>
  )
}
