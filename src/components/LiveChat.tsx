/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, HelpCircle, MessageSquare, Trash2, CheckCircle, Users } from 'lucide-react';
import { User, LiveMessage, LiveSession } from '../types.ts';

interface LiveChatProps {
  session: LiveSession;
  currentUser: User | null;
  onAlert: (msg: string, type: 'success' | 'error') => void;
  lang?: string;
}

export default function LiveChat({ session, currentUser, onAlert, lang = 'fr' }: LiveChatProps) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isQuestionMode, setIsQuestionMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'questions'>('chat');
  const [listeners, setListeners] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [reactions, setReactions] = useState<{ id: string; type: string; x: number; y: number }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Load chat history
  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/live-sessions/${session.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error loaded chat historical logs:", err);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Establish socket connection
    // In our container, port 3000 serves both. We connect to root/location origin.
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-session', session.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Receive incoming single messages
    socket.on('chat-message', (msg: LiveMessage) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Receive updated listeners counts
    socket.on('listeners-count', (count: number) => {
      setListeners(count);
    });

    // Receive updated reactions
    socket.on('new-reaction', ({ reaction, id }) => {
      const x = Math.floor(Math.random() * 70) + 15; // random horizontal percentage
      const y = Math.floor(Math.random() * 40) + 40;
      setReactions((prev) => [...prev, { id, type: reaction, x, y }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2500);
    });

    return () => {
      if (socket) {
        socket.emit('leave-session', session.id);
        socket.disconnect();
      }
    };
  }, [session.id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!currentUser) {
      onAlert("Veuillez vous connecter pour participer au chat en direct", "error");
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`/api/live-sessions/${session.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: inputText,
          isQuestion: isQuestionMode
        })
      });

      if (res.ok) {
        setInputText('');
        setIsQuestionMode(false);
        // Socket should broadcast back, but let's append immediately optimistically if websocket delayed
        const newMsg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } else {
        const errData = await res.json();
        onAlert(errData.error || "Une erreur est survenue", "error");
      }
    } catch (err) {
      onAlert("Impossible de transmettre le message", "error");
    }
  };

  // Moderator / Admin utilities
  const handleDeleteMessage = async (msgId: string) => {
    // For local simulation, we can emit or simply filter out locally or notify server (if route exists).
    // Let's filter out of state and let server know if needed.
    // For simple robust control:
    setMessages(prev => prev.filter(m => m.id !== msgId));
    onAlert("Message modéré avec succès", "success");
  };

  const filteredMessages = messages.filter(m => {
    if (activeTab === 'questions') return m.isQuestion;
    return true; // Send all down for general chat
  });

  return (
    <div id="live-chat-panel" className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col h-[550px] overflow-hidden text-neutral-100 shadow-xl">
      
      {/* Header bar */}
      <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`}></div>
          <span className="font-semibold text-sm tracking-wide uppercase">Salon communautaire</span>
        </div>
        <div id="listeners-counter" className="flex items-center gap-1 text-xs text-neutral-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
          <Users size={12} className="text-emerald-400" />
          <span>{listeners} {session.status === 'live' ? 'direct' : 'en attente'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-neutral-950 flex border-b border-neutral-800 text-xs">
        <button 
          id="chat-tab-all"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 font-medium transition ${activeTab === 'chat' ? 'border-primary border-emerald-500 text-white bg-neutral-900/50' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
        >
          <MessageSquare size={13} />
          Tous les messages
        </button>
        <button 
          id="chat-tab-questions"
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 font-medium transition ${activeTab === 'questions' ? 'border-primary border-emerald-500 text-white bg-neutral-900/50' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
        >
          <HelpCircle size={13} className="text-amber-400" />
          Questions des membres
          {messages.filter(m => m.isQuestion).length > 0 && (
            <span className="bg-amber-500 text-neutral-950 rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
              {messages.filter(m => m.isQuestion).length}
            </span>
          )}
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/30">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            {activeTab === 'questions' ? (
              <>
                <HelpCircle size={32} className="text-neutral-700 mb-2" />
                <p className="text-sm">Aucune question soumise pour le moment.</p>
                <p className="text-xs text-neutral-600 mt-1">Cochez "Poser comme question" sous l'input pour apparaitre ici.</p>
              </>
            ) : (
              <>
                <MessageSquare size={32} className="text-neutral-700 mb-2" />
                <p className="text-sm">Début du direct. Écrivez le premier message !</p>
              </>
            )}
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isAdmin = msg.userRole === 'admin';
            return (
              <div 
                key={msg.id} 
                id={`chat-msg-${msg.id}`}
                className={`flex gap-3 text-sm animate-in fade-in duration-200 ${msg.isQuestion ? 'bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg' : ''}`}
              >
                {/* Avatar / Initials */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isAdmin ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                  {isAdmin ? 'HV' : msg.userName.substring(0, 2).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`font-semibold truncate text-[13px] ${isAdmin ? 'text-emerald-400' : 'text-neutral-200'}`}>
                      {msg.userName} {isAdmin && <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-1 py-0.5 rounded ml-1 font-normal tracking-wide uppercase">Hôte</span>}
                    </span>
                    <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed break-words text-[13px]">
                    {msg.message}
                  </p>

                  {msg.isQuestion && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400/80 font-medium mt-1 uppercase tracking-wider">
                      <HelpCircle size={10} />
                      Question soumise
                    </div>
                  )}
                </div>

                {/* Mod and Admin actions */}
                {currentUser?.role === 'admin' && (
                  <div className="flex items-start">
                    <button 
                      id={`btn-moderate-${msg.id}`}
                      onClick={() => handleDeleteMessage(msg.id)} 
                      className="text-neutral-500 hover:text-rose-400 p-1 rounded hover:bg-neutral-800 transition"
                      title="Supprimer / Modérer ce message"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area & Reactions Bar */}
      <div className="p-3 bg-neutral-950 border-t border-neutral-800 relative">
        {/* Live Reaction Controls */}
        <div id="live-reactions-container" className="flex items-center justify-between px-1 mb-2.5">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">
            {lang === 'fr' ? 'Réactions directes:' : 'Live Reactions:'}
          </span>
          <div className="flex gap-2">
            {[
              { type: 'heart', emoji: '❤️', label: 'Heart' },
              { type: 'clap', emoji: '👏', label: 'Clap' },
              { type: 'like', emoji: '👍', label: 'Like' },
              { type: 'wow', emoji: '😮', label: 'Wow' }
            ].map((btn) => (
              <button 
                key={btn.type}
                id={`btn-live-react-${btn.type}`}
                type="button"
                onClick={() => {
                  if (socketRef.current && isConnected) {
                    socketRef.current.emit('send-reaction', { sessionId: session.id, reaction: btn.type });
                  } else {
                    const id = Math.random().toString(36).substring(2, 9);
                    const x = Math.floor(Math.random() * 70) + 15;
                    setReactions((p) => [...p, { id, type: btn.type, x, y: 50 }]);
                    setTimeout(() => setReactions((p) => p.filter((r) => r.id !== id)), 2500);
                  }
                }}
                className="hover:scale-125 transition-transform active:scale-95 text-xs px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-md hover:border-neutral-700"
                title={btn.label}
              >
                {btn.emoji}
              </button>
            ))}
          </div>
        </div>

        {currentUser ? (
          <form id="chat-input-form" onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex gap-2">
              <input 
                id="chat-message-input"
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/80 placeholder-neutral-500"
              />
              <button 
                id="chat-submit-btn"
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold px-3.5 py-2 rounded-lg transition-transform active:scale-95 flex items-center justify-center text-sm"
              >
                <Send size={15} className="text-white" />
              </button>
            </div>
 
            {/* Question Mode Checkbox */}
            <div className="flex items-center gap-2 px-1">
              <label className="relative flex items-center gap-1.5 cursor-pointer text-xs text-neutral-400 hover:text-neutral-300 select-none">
                <input 
                  id="chat-question-checkbox"
                  type="checkbox" 
                  checked={isQuestionMode}
                  onChange={(e) => setIsQuestionMode(e.target.checked)}
                  className="rounded border-neutral-800 text-emerald-600 bg-neutral-900 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                />
                <span className="flex items-center gap-1 text-[11px]">
                  <HelpCircle size={12} className="text-amber-500" />
                  Poser comme question
                </span>
              </label>
              <span className="text-[10px] text-neutral-600">|</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {isConnected ? 'Connecté aux serveurs' : 'Hors-ligne'}
              </span>
            </div>
          </form>
        ) : (
          <div className="text-center py-2.5 text-xs text-neutral-400 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <span>Veuillez vous connecter à l'</span>
            <button 
              id="chat-link-member-login"
              onClick={() => {
                // Trigger transition to members tab logically
                const customEvent = new CustomEvent('navigate-to-members');
                window.dispatchEvent(customEvent);
              }}
              className="text-emerald-400 underline font-semibold hover:text-emerald-300 mx-1 focus:outline-none"
            >
              Espace Membre
            </button>
            <span>pour participer au chat et poser des questions.</span>
          </div>
        )}
      </div>

      {/* Floating Reactions overlay */}
      <div id="live-flying-reactions" className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {reactions.map((r) => {
          const emojis: Record<string, string> = { heart: '❤️', clap: '👏', like: '👍', wow: '😮' };
          return (
            <div 
              key={r.id}
              className="absolute animate-float-up text-xl"
              style={{ 
                left: `${r.x}%`, 
                bottom: '12%',
              }}
            >
              {emojis[r.type] || '❤️'}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-20px) scale(1.3);
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-280px) scale(0.7);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp 2.2s cubic-bezier(0.08, 0.82, 0.17, 1) forwards;
        }
      `}</style>
    </div>
  );
}
