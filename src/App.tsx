/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  BookOpen, Clock, Music, Calendar, Radio, LogOut, 
  Search, Send, Trash2, Edit2, Star, Bell, Plus, Settings, Check, 
  Mail, ChevronRight, Globe, AlertCircle, ShieldAlert, Heart, Eye
} from 'lucide-react';
import { 
  User, Article, News, PodcastEpisode, LiveSession, LiveMessage, Comment, ContactMessage 
} from './types.ts';
import { translations } from './translations.ts';
import AudioPlayer from './components/AudioPlayer.tsx';
import LiveChat from './components/LiveChat.tsx';
import journalistProfilePhoto from './assets/images/journalist_avatar_1781948099950.jpg';

export default function App() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const t = translations[lang];

  // Application Views / Routing
  const [currentTab, setCurrentTab] = useState<'home' | 'about' | 'articles' | 'news' | 'podcasts' | 'live' | 'member' | 'contact' | 'admin'>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [selectedArticleLang, setSelectedArticleLang] = useState<'all' | 'fr' | 'en'>('all');
  const [articlePage, setArticlePage] = useState(1);

  // States
  const [articles, setArticles] = useState<Article[]>([]);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastEpisode[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [favorites, setFavorites] = useState<Article[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userBioFr, setUserBioFr] = useState('');
  const [userBioEn, setUserBioEn] = useState('');
  const [userProfileImage, setUserProfileProfileImage] = useState(journalistProfilePhoto);

  useEffect(() => {
    const savedBioFr = localStorage.getItem('user-bio-fr');
    const savedBioEn = localStorage.getItem('user-bio-en');
    const savedImage = localStorage.getItem('user-profile-image');
    if (savedBioFr) setUserBioFr(savedBioFr);
    else setUserBioFr(translations.fr.about.bioText);
    if (savedBioEn) setUserBioEn(savedBioEn);
    else setUserBioEn(translations.en.about.bioText);
    if (savedImage) setUserProfileProfileImage(savedImage);
  }, []);

  // Filters & Interactivity
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  // Auth Inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authIsSignUp, setAuthIsSignUp] = useState(false);

  // User Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    articles: true,
    podcasts: true,
    live: true,
  });
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  // Push Notification Logs (In-app center)
  const [receivedNotifs, setReceivedNotifs] = useState<{
    id: string;
    type: 'article' | 'podcast' | 'live';
    title: string;
    message: string;
    itemId: string;
    timestamp: string;
    read: boolean;
  }[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [activeToast, setActiveToast] = useState<{
    id: string;
    type: 'article' | 'podcast' | 'live';
    title: string;
    message: string;
    itemId: string;
  } | null>(null);

  // Admin CRUD inputs
  const [artForm, setArtForm] = useState({ titleFr: '', titleEn: '', contentFr: '', contentEn: '', category: 'Réseaux Sociaux', image: '', readTime: 5 });
  const [newsForm, setNewsForm] = useState({ titleFr: '', titleEn: '', contentFr: '', contentEn: '' });
  const [podForm, setPodForm] = useState({ titleFr: '', titleEn: '', descriptionFr: '', descriptionEn: '', audioUrl: '', imageUrl: '', guests: '', duration: '30:00' });
  const [liveForm, setLiveForm] = useState({ titleFr: '', titleEn: '', descriptionFr: '', descriptionEn: '', date: '', time: '', audioUrl: '' });

  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  // Toast simple alerts
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Check notification permission upon mount
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
    const savedPrefs = localStorage.getItem('push-preferences');
    if (savedPrefs) {
      setNotifPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const savePreferences = (newPrefs: typeof notifPreferences) => {
    setNotifPreferences(newPrefs);
    localStorage.setItem('push-preferences', JSON.stringify(newPrefs));
    showAlert("Préférences mis à jour !", "success");
  };

  const requestBrowserNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showAlert("Votre navigateur ne supporte pas les notifications push", "error");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        showAlert("Notifications système activées avec succès !", "success");
        new window.Notification("Telia Tv", {
          body: "Félicitations, vous recevrez de vraies alertes de publication !",
          icon: "/favicon.ico"
        });
      } else {
        showAlert("Autorisation refusée ou ignorée.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch initial core data
  const fetchData = async () => {
    try {
      const [artRes, newsRes, podRes, liveRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/news'),
        fetch('/api/podcasts'),
        fetch('/api/live-sessions')
      ]);
      if (artRes.ok) setArticles(await artRes.json());
      if (newsRes.ok) setNewsList(await newsRes.json());
      if (podRes.ok) setPodcasts(await podRes.json());
      if (liveRes.ok) setLiveSessions(await liveRes.json());
    } catch (err) {
      console.error("Error retrieving site data:", err);
    }
  };

  useEffect(() => {
    fetchData();

    // Connect to websocket to capture news, live broadcast start and articles publishing alerts
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('push-notification', (notif: {
      id: string;
      type: 'article' | 'podcast' | 'live';
      titleFr: string;
      titleEn: string;
      messageFr: string;
      messageEn: string;
      itemId: string;
      timestamp: string;
    }) => {
      // Determine if preference is subscribed
      const isSubscribed = 
        (notif.type === 'article' && notifPreferences.articles) ||
        (notif.type === 'podcast' && notifPreferences.podcasts) ||
        (notif.type === 'live' && notifPreferences.live);

      if (!isSubscribed) return;

      const title = lang === 'fr' ? notif.titleFr : notif.titleEn;
      const msg = lang === 'fr' ? notif.messageFr : notif.messageEn;

      // 1. Show browser level banner if allowed
      if (Notification.permission === 'granted') {
        new window.Notification(title, {
          body: msg,
          icon: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=100"
        });
      }

      // 2. State addition to Notification Center history log
      const newHistoryItem = {
        id: notif.id,
        type: notif.type,
        title,
        message: msg,
        itemId: notif.itemId,
        timestamp: notif.timestamp,
        read: false
      };
      setReceivedNotifs(prev => [newHistoryItem, ...prev]);

      // 3. Show high-impact sliding toast matching Geometric Balance color accents
      setActiveToast({
        id: notif.id,
        type: notif.type,
        title,
        message: msg,
        itemId: notif.itemId
      });

      // Clear alert timer
      setTimeout(() => {
        setActiveToast(prev => prev?.id === notif.id ? null : prev);
      }, 7000);

      // Refresh corresponding dataset
      fetchData();
    });

    // Handle global live session updates
    socket.on('live-session-updated', () => {
      fetchData();
    });

    // Listen to custom navigation events
    const navListener = () => {
      setCurrentTab('member');
    };
    window.addEventListener('navigate-to-members', navListener);

    return () => {
      socket.disconnect();
      window.removeEventListener('navigate-to-members', navListener);
    };
  }, [lang, notifPreferences]);

  // Auth fetch and persist profile token
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then(data => {
          setCurrentUser(data.user);
          loadFavorites(token);
        })
        .catch(() => {
          localStorage.removeItem('auth-token');
        });
    }
  }, []);

  const loadFavorites = async (token: string) => {
    try {
      const res = await fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setFavorites(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e: any) => {
    e.preventDefault();
    const endpoint = authIsSignUp ? '/api/auth/register' : '/api/auth/login';
    const payload = authIsSignUp 
      ? { email: authEmail, password: authPassword, name: authName }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('auth-token', data.token);
        setCurrentUser(data.user);
        loadFavorites(data.token);
        showAlert(authIsSignUp ? "Compte créé !" : "Bienvenue !", "success");
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
      } else {
        showAlert(data.error || "Erreur de connexion", "error");
      }
    } catch (err) {
      showAlert("Connexion impossible", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    setCurrentUser(null);
    setFavorites([]);
    showAlert("Vous avez été déconnecté", "success");
  };

  // Bookmark Toggle
  const toggleFavorite = async (artId: string) => {
    if (!currentUser) {
      showAlert("Veuillez vous connecter pour sauvegarder cet article", "error");
      return;
    }
    const token = localStorage.getItem('auth-token');
    const isFav = favorites.some(f => f.id === artId);
    const method = isFav ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`/api/favorites/${artId}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadFavorites(token!);
        showAlert(isFav ? "Favori retiré" : "Article sauvegardé !", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Contact Submit
  const handleContactSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        showAlert(t.contact.success, "success");
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        showAlert("Une erreur s'est produite lors de la transmission", "error");
      }
    } catch (err) {
      showAlert("Une erreur s'est produite", "error");
    }
  };

  // Comments Retrieval
  const loadComments = async (artId: string) => {
    try {
      const res = await fetch(`/api/comments/article/${artId}`);
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const postComment = async (e: any) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert("Veuillez vous connecter pour commenter", "error");
      return;
    }
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`/api/comments/article/${selectedArticleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      });
      if (res.ok) {
        setCommentText('');
        loadComments(selectedArticleId!);
        showAlert("Commentaire publié !", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const result = event.target?.result as string;
        setUserProfileProfileImage(result);
        localStorage.setItem('user-profile-image', result);
        showAlert("Photo de profil mise à jour !", "success");
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
      localStorage.setItem('user-bio-fr', userBioFr);
      localStorage.setItem('user-bio-en', userBioEn);
      setIsEditing(false);
      showAlert("Informations mises à jour !", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'article-image' | 'podcast-image' | 'podcast-audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showAlert("Le fichier est trop volumineux (max 50 Mo)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (type === 'article-image') {
          setArtForm(prev => ({ ...prev, image: result }));
        } else if (type === 'podcast-image') {
          setPodForm(prev => ({ ...prev, imageUrl: result }));
        } else if (type === 'podcast-audio') {
          setPodForm(prev => ({ ...prev, audioUrl: result }));
        }
        showAlert(`Fichier "${file.name}" chargé avec succès !`, "success");
      }
    };
    reader.onerror = () => {
      showAlert("Erreur lors de la lecture du fichier", "error");
    };
    reader.readAsDataURL(file);
  };

  // Admin CRUD helper requests
  const adminAddArticle = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(artForm)
      });
      if (res.ok) {
        showAlert("Article publié et push envoyé aux membres !", "success");
        setArtForm({ titleFr: '', titleEn: '', contentFr: '', contentEn: '', category: 'Réseaux Sociaux', image: '', readTime: 5 });
        fetchData();
      }
    } catch (err) {
      showAlert("Erreur lors de la création", "error");
    }
  };

  const adminAddNews = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newsForm)
      });
      if (res.ok) {
        showAlert("Actualité brève ajoutée avec succès", "success");
        setNewsForm({ titleFr: '', titleEn: '', contentFr: '', contentEn: '' });
        fetchData();
      }
    } catch (err) {
      showAlert("Erreur de création", "error");
    }
  };

  const adminAddPodcast = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('auth-token');
    const guestsArr = podForm.guests.split(',').map(s => s.trim()).filter(Boolean);
    const updatedPod = {
      ...podForm,
      titleEn: podForm.titleEn || podForm.titleFr,
      descriptionEn: podForm.descriptionEn || podForm.descriptionFr,
      imageUrl: podForm.imageUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=300',
      guests: guestsArr
    };
    try {
      const res = await fetch('/api/podcasts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPod)
      });
      if (res.ok) {
        showAlert("Épisode de podcast publié !", "success");
        setPodForm({ titleFr: '', titleEn: '', descriptionFr: '', descriptionEn: '', audioUrl: '', imageUrl: '', guests: '', duration: '30:00' });
        fetchData();
      }
    } catch (err) {
      showAlert("Erreur de publication", "error");
    }
  };

  const toggleLiveStatus = async (sessionId: string, currentStatus: string) => {
    const token = localStorage.getItem('auth-token');
    const newStatus = currentStatus === 'live' ? 'ended' : 'live';
    try {
      const res = await fetch(`/api/live-sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showAlert(newStatus === 'live' ? "Le direct commence !" : "Le direct est terminé", "success");
        fetchData();
      }
    } catch (err) {
      showAlert("Impossible de modifier l'état", "error");
    }
  };

  const adminAddLive = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch('/api/live-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(liveForm)
      });
      if (res.ok) {
        showAlert("Session de direct planifiée", "success");
        setLiveForm({ titleFr: '', titleEn: '', descriptionFr: '', descriptionEn: '', date: '', time: '', audioUrl: '' });
        fetchData();
      }
    } catch (err) {
      showAlert("Erreur", "error");
    }
  };

  const deleteArticle = async (id: string) => {
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showAlert("Article supprimé", "success");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePodcast = async (id: string) => {
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch(`/api/podcasts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showAlert("Podcast supprimé des ondes", "success");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadContacts = async () => {
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch('/api/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setContacts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin' && currentTab === 'admin') {
      loadContacts();
    }
  }, [currentUser, currentTab]);

  const readContact = async (id: string) => {
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch(`/api/contacts/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) loadContacts();
    } catch (err) {
      console.error(err);
    }
  };

  // Nav actions
  const selectArticle = (art: Article) => {
    setSelectedArticleId(art.id);
    setCurrentTab('articles');
    loadComments(art.id);
  };

  // Filter lists
  const filteredArticles = articles.filter(a => {
    const title = lang === 'fr' ? a.titleFr : a.titleEn;
    const body = lang === 'fr' ? a.contentFr : a.contentEn;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesLanguage = selectedArticleLang === 'all' || 
                            (selectedArticleLang === 'fr' && a.titleFr && a.contentFr) ||
                            (selectedArticleLang === 'en' && a.titleEn && a.contentEn);
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const featuredArticle = articles[0];
  const liveSession = liveSessions.find(s => s.status === 'live') || liveSessions[0];

  return (
    <div id="geometric-balance-viewport" className="flex flex-col h-screen w-full bg-[#fafaf9] font-sans text-[#1a1a1a] overflow-hidden select-none">
      
      {/* 1. TOAST COMPONENT */}
      {alert && (
        <div id="app-alert-toast" className={`fixed bottom-6 right-6 z-50 px-5 py-3 shadow-[4px_4px_0px_#1a1a1a] flex items-center gap-2 border-2 ${alert.type === 'success' ? 'bg-white border-emerald-500' : 'bg-red-50 border-red-500'} animate-bounce`}>
          {alert.type === 'success' ? <Check className="text-emerald-600" size={16} /> : <AlertCircle className="text-red-600" size={16} />}
          <span className="text-xs font-bold font-mono tracking-wider text-[#1a1a1a]">{alert.msg}</span>
        </div>
      )}

      {/* 2. SLIDING REAL-TIME PUSH TOAST */}
      {activeToast && (
        <div id="sliding-push-toast" className="fixed top-6 right-6 z-50 bg-white border-l-4 border-l-[#b91c1c] border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-4 w-80 animate-in slide-in-from-right duration-300">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#b91c1c] uppercase font-sans">
              <Bell size={10} className="animate-wiggle" />
              <span>{activeToast.title}</span>
            </div>
            <button id="close-push-toast" onClick={() => setActiveToast(null)} className="text-[#6b6b6b] hover:text-black font-bold text-xs">×</button>
          </div>
          <h5 className="font-serif font-black text-sm text-[#1a1a1a] leading-tight mb-2">{activeToast.message}</h5>
          <div className="flex justify-between items-center mt-3">
            <span className="text-[10px] font-mono text-[#6b6b6b] uppercase">{activeToast.type}</span>
            <button 
              id="view-push-notif-element"
              onClick={() => {
                if (activeToast.type === 'article') {
                  const art = articles.find(a => a.id === activeToast.itemId);
                  if (art) selectArticle(art);
                } else if (activeToast.type === 'podcast') {
                  setCurrentTab('podcasts');
                } else if (activeToast.type === 'live') {
                  setCurrentTab('live');
                }
                setActiveToast(null);
              }}
              className="px-3 py-1 bg-[#1a1a1a] text-white text-[9px] font-bold tracking-widest uppercase hover:bg-[#b91c1c] transition-colors"
            >
              Consulter →
            </button>
          </div>
        </div>
      )}

      {/* HEADER NAVIGATION */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#e5e5e2] bg-white flex-shrink-0">
        <div className="flex items-center gap-8">
          <div 
            id="site-identity-logo"
            onClick={() => { setCurrentTab('home'); setSelectedArticleId(null); }}
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div className="relative">
              {/* Crescent pink swoosh overlay */}
              <svg className="absolute -right-5 -top-2 w-[130px] h-[50px] text-[#ec4899]/20 pointer-events-none" viewBox="0 0 130 50" fill="none">
                <path d="M5,42 C70,52 120,42 120,4 C120,32 95,45 5,42" fill="currentColor" />
              </svg>
              <div className="flex flex-col leading-[1.05] z-10 relative">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-sans font-black tracking-tighter text-[#be185d] group-hover:text-[#db2777] transition-colors">
                    TELIA TV
                  </span>
                  <span className="px-1.5 py-0.5 text-[7px] bg-gradient-to-r from-[#db2777] to-[#4f46e5] text-white rounded font-bold font-mono tracking-widest uppercase">
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] font-black text-[#1e1b4b] tracking-wider leading-none">
                  <span>NEWS</span>
                  <span className="w-1 h-1 bg-[#be185d] rounded-full"></span>
                  <span className="text-[#6b6b6b] font-sans text-[8px] tracking-normal font-black uppercase">M. Thérèse</span>
                </div>
              </div>
            </div>
          </div>
          <nav className="hidden lg:flex gap-6 text-[11px] font-black uppercase tracking-widest text-[#6b6b6b]">
            <button 
              id="nav-tab-about"
              onClick={() => { setCurrentTab('about'); setSelectedArticleId(null); }} 
              className={`pb-1 transition hover:text-black ${currentTab === 'about' ? 'text-[#1a1a1a] border-b-2 border-[#be185d]' : ''}`}
            >
              {t.nav.about}
            </button>
            <button 
              id="nav-tab-articles"
              onClick={() => { setCurrentTab('articles'); setSelectedArticleId(null); }} 
              className={`pb-1 transition hover:text-black ${currentTab === 'articles' ? 'text-[#1a1a1a] border-b-2 border-[#be185d]' : ''}`}
            >
              {t.nav.articles}
            </button>
            <button 
              id="nav-tab-news"
              onClick={() => { setCurrentTab('news'); setSelectedNewsId(null); }} 
              className={`pb-1 transition hover:text-black ${currentTab === 'news' ? 'text-[#1a1a1a] border-b-2 border-[#be185d]' : ''}`}
            >
              {t.nav.news}
            </button>
            <button 
              id="nav-tab-podcasts"
              onClick={() => setCurrentTab('podcasts')} 
              className={`pb-1 transition hover:text-black ${currentTab === 'podcasts' ? 'text-[#1a1a1a] border-b-2 border-[#be185d]' : ''}`}
            >
              {t.nav.podcasts}
            </button>
            <button 
              id="nav-tab-live"
              onClick={() => setCurrentTab('live')} 
              className={`pb-1 transition hover:text-black ${currentTab === 'live' ? 'text-[#1a1a1a] border-b-2 border-[#be185d]' : ''}`}
            >
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#be185d] rounded-full animate-ping"></span>
                {t.nav.live}
              </span>
            </button>
            <button 
              id="nav-tab-contact"
              onClick={() => setCurrentTab('contact')} 
              className={`pb-1 transition hover:text-black ${currentTab === 'contact' ? 'text-[#1a1a1a] border-b-2 border-[#be185d]' : ''}`}
            >
              {t.nav.contact}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          
          {/* LANGAUGE SELECTOR */}
          <div className="flex bg-[#f0f0ee] p-1 rounded border border-[#e5e5e2]">
            <button 
              id="lang-fr-toggle"
              onClick={() => setLang('fr')} 
              className={`px-2 py-1 text-[10px] font-black transition-all ${lang === 'fr' ? 'bg-white text-black shadow-sm' : 'text-[#6b6b6b] hover:text-black'}`}
            >
              FR
            </button>
            <button 
              id="lang-en-toggle"
              onClick={() => setLang('en')} 
              className={`px-2 py-1 text-[10px] font-black transition-all ${lang === 'en' ? 'bg-white text-black shadow-sm' : 'text-[#6b6b6b] hover:text-black'}`}
            >
              EN
            </button>
          </div>

          {/* IN-APP NOTIFICATIONS INBOX TRIGGER */}
          <button 
            id="notifications-inbox-trigger"
            onClick={() => setShowNotificationCenter(!showNotificationCenter)}
            className="p-1 px-2.5 rounded bg-[#f0f0ee] border border-[#e5e5e2] text-[#1a1a1a] hover:bg-neutral-200 transition-colors relative flex items-center gap-1 text-[10px] font-black tracking-widest uppercase"
          >
            <Bell size={13} className="text-[#be185d]" />
            {receivedNotifs.filter(n => !n.read).length > 0 && (
              <span className="bg-[#be185d] text-white font-mono px-1 rounded-sm text-[9px]">
                {receivedNotifs.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {/* MEMBER PORTAL */}
          {currentUser ? (
            <div className="flex items-center gap-3">
              {currentUser.role === 'admin' && (
                <button 
                  id="header-admin-dashboard"
                  onClick={() => setCurrentTab('admin')}
                  className="px-3.5 py-1.5 text-[10px] font-black bg-white hover:bg-neutral-100 text-black border border-[#1a1a1a] uppercase tracking-wider transition-colors"
                >
                  Admin
                </button>
              )}
              <button 
                id="header-member-profile"
                onClick={() => setCurrentTab('member')}
                className="text-[10px] uppercase tracking-widest font-bold underline text-[#1a1a1a] hover:opacity-85"
              >
                {t.nav.member}
              </button>
              <button 
                id="header-auth-logout"
                onClick={handleLogout} 
                className="text-[#6b6b6b] hover:text-black transition"
                title="Déconnexion"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button 
              id="header-auth-login-trigger"
              onClick={() => setCurrentTab('member')}
              className="px-4 py-2 text-[10px] font-black bg-[#1a1a1a] hover:bg-[#be185d] text-white uppercase tracking-widest transition"
            >
              {t.nav.member}
            </button>
          )}

        </div>
      </header>

      {/* MOBILE SCROLL NAVIGATION BAR */}
      <nav id="mobile-scroll-nav" className="flex lg:hidden bg-[#fbfbf9] px-4 py-2.5 border-b border-[#e5e5e2] gap-5 overflow-x-auto whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-[#6b6b6b] scrollbar-none select-none flex-shrink-0">
        {currentUser?.role === 'admin' && (
          <button 
            id="mobile-nav-admin"
            onClick={() => { setCurrentTab('admin'); setSelectedArticleId(null); }}
            className={`pb-0.5 transition uppercase font-black text-pink-700 flex items-center gap-1.5 ${currentTab === 'admin' ? 'text-black border-b border-black' : ''}`}
          >
            <ShieldAlert size={11} className="text-[#be185d]" />
            Console Admin
          </button>
        )}
        <button 
          id="mobile-nav-about"
          onClick={() => { setCurrentTab('about'); setSelectedArticleId(null); }}
          className={`pb-0.5 transition ${currentTab === 'about' ? 'text-black border-b border-black' : ''}`}
        >
          {t.nav.about}
        </button>
        <button 
          id="mobile-nav-articles"
          onClick={() => { setCurrentTab('articles'); setSelectedArticleId(null); }}
          className={`pb-0.5 transition ${currentTab === 'articles' ? 'text-black border-b border-black' : ''}`}
        >
          {t.nav.articles}
        </button>
        <button 
          id="mobile-nav-news"
          onClick={() => { setCurrentTab('news'); setSelectedNewsId(null); }}
          className={`pb-0.5 transition ${currentTab === 'news' ? 'text-black border-b border-black' : ''}`}
        >
          {t.nav.news}
        </button>
        <button 
          id="mobile-nav-podcasts"
          onClick={() => setCurrentTab('podcasts')}
          className={`pb-0.5 transition ${currentTab === 'podcasts' ? 'text-black border-b border-black' : ''}`}
        >
          {t.nav.podcasts}
        </button>
        <button 
          id="mobile-nav-live"
          onClick={() => setCurrentTab('live')}
          className={`pb-0.5 transition ${currentTab === 'live' ? 'text-black border-b border-black' : ''}`}
        >
          {t.nav.live}
        </button>
        <button 
          id="mobile-nav-contact"
          onClick={() => setCurrentTab('contact')}
          className={`pb-0.5 transition ${currentTab === 'contact' ? 'text-black border-b border-black' : ''}`}
        >
          {t.nav.contact}
        </button>
      </nav>

      {/* NOTIFICATION CENTER INBOX SIDEBAR OVERLAY */}
      {showNotificationCenter && (
        <div id="notification-center-drawer" className="absolute top-[65px] right-8 z-40 bg-white border border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] w-80 max-h-[450px] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#e5e5e2] bg-[#fafaf9] flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
              <Bell size={12} className="text-[#b91c1c]" />
              Alertes & Flash Info
            </span>
            <button 
              id="clear-all-notifs"
              onClick={() => {
                setReceivedNotifs([]);
                setShowNotificationCenter(false);
              }}
              className="text-[9px] font-bold uppercase underline hover:text-[#b91c1c]"
            >
              Vider
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {receivedNotifs.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#6b6b6b] italic font-serif">
                Aucune alerte reçue durant cette session.
              </div>
            ) : (
              receivedNotifs.map((item) => (
                <div 
                  key={item.id} 
                  id={`notif-item-${item.id}`}
                  onClick={() => {
                    // Mark as read
                    setReceivedNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                    if (item.type === 'article') {
                      const art = articles.find(a => a.id === item.itemId);
                      if (art) selectArticle(art);
                    } else if (item.type === 'podcast') {
                      setCurrentTab('podcasts');
                    } else if (item.type === 'live') {
                      setCurrentTab('live');
                    }
                    setShowNotificationCenter(false);
                  }}
                  className={`p-3 text-left border cursor-pointer hover:bg-[#fafaf9] transition ${item.read ? 'border-[#e5e5e2]' : 'border-[#1a1a1a] bg-amber-50/20'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#b91c1c]">{item.title}</span>
                    <span className="text-[8px] text-neutral-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h6 className="text-[11px] font-black text-black leading-snug line-clamp-2">{item.message}</h6>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-[#e5e5e2] text-center bg-[#fafaf9]">
            <button 
              id="footer-go-members"
              onClick={() => { setCurrentTab('member'); setShowNotificationCenter(false); }}
              className="text-[9px] font-black uppercase tracking-widest underline hover:text-black text-[#6b6b6b]"
            >
              Gérer mes abonnements push →
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT LAYOUT */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-[#fafaf9]">
        
        {/* LEFT COLUMN: INTRO & CURRENT LIVE WIDGET */}
        <section id="sidebar-left" className="col-span-3 border-r border-[#e5e5e2] hidden md:flex flex-col p-6 overflow-y-auto">
          
          <div className="mb-6 pb-6 border-b border-[#e5e5e2]">
             <div className="bg-[#d1d5db] overflow-hidden mb-4 relative group">
               <img 
                 id="journalist-main-photo"
                 src={userProfileImage}
                 alt="Mangwa Thérèse" 
                 className="w-full h-auto object-contain transition duration-500"
               />
               <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black to-transparent">
                  <span className="text-white text-[10px] font-mono uppercase tracking-widest font-black">Mangwa Thérèse</span>
               </div>
             </div>
            
            <p className="text-xs leading-relaxed text-[#4a4a4a] font-serif italic mb-4">
              {t.home.aboutBriefText}
            </p>
            
            <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]">
              <button onClick={() => setCurrentTab('contact')} className="underline hover:text-[#b91c1c] transition-colors">Prendre Contact</button>
              <span className="text-[#e5e5e2]">|</span>
              <button 
                id="sidebar-about-btn"
                onClick={() => {
                  // Simulate biography reading
                  showAlert("Biographie : 15 ans d'enquêtes pour Le Monde, NYT & BBC. Prix Albert Londres 2021 (Simulé).");
                }} 
                className="underline hover:text-[#b91c1c] transition-colors"
              >
                Parcours
              </button>
            </div>
          </div>

          <div className="mt-auto">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b91c1c] mb-3 flex items-center gap-1.5">
              <Radio size={12} className="animate-pulse" />
              {t.nav.live}
            </h3>
            
            {liveSession ? (
              <div id="sidebar-live-widget" className="bg-white border-2 border-[#1a1a1a] p-4 flex flex-col gap-2 relative bg-[radial-gradient(#f0f0ee_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="flex items-center justify-between">
                  {liveSession.status === 'live' ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#b91c1c]">
                      <span className="w-1.5 h-1.5 bg-[#b91c1c] rounded-full animate-ping"></span>
                      EN DIRECT
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#6b6b6b]">À VENIR</span>
                  )}
                  <span className="text-[8px] font-mono text-[#6b6b6b]">{liveSession.date} à {liveSession.time}</span>
                </div>
                <h4 className="font-serif font-black text-xs text-[#1a1a1a] leading-tight line-clamp-2">
                  {lang === 'fr' ? liveSession.titleFr : liveSession.titleEn}
                </h4>
                <p className="text-[10px] text-[#6b6b6b] font-serif italic line-clamp-2">
                  {lang === 'fr' ? liveSession.descriptionFr : liveSession.descriptionEn}
                </p>
                <button 
                  id="sidebar-join-live-btn"
                  onClick={() => setCurrentTab('live')}
                  className="w-full text-center py-1.5 border border-[#1a1a1a] hover:bg-neutral-900 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest"
                >
                  {liveSession.status === 'live' ? "Rejoindre le Direct" : "Réserver mon alerte"}
                </button>
              </div>
            ) : (
              <p className="text-xs font-serif text-[#6b6b6b]">Aucune émission prévue.</p>
            )}
          </div>
        </section>

        {/* MIDDLE COLUMN: DYNAMIC CORE APP CONTENT */}
        <section id="content-middle" className="col-span-1 md:col-span-6 flex flex-col p-6 border-r border-[#e5e5e2] overflow-y-auto bg-white">
          
          {/* ABOUT TAB */}
          {currentTab === 'about' && (
            <div id="tab-about-view" className="space-y-8 animate-fade-in text-left">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between pb-3 border-b border-[#e5e5e2] gap-4">
                <h1 className="text-3xl font-serif font-black text-[#1a1a1a]">
                  {t.about.title}
                </h1>                <div className="flex gap-2">
                    <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-mono text-[#be185d] underline">
                        {isEditing ? "Annuler" : "Modifier"}
                    </button>
                    {isEditing && (
                        <button onClick={saveProfile} className="text-xs font-mono bg-[#be185d] text-white px-3 py-1 rounded">
                            Sauvegarder
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-stone-600">
                  <span className="flex items-center gap-1.5 border-r border-[#e5e5e2] pr-4">
                    <span className="text-[#be185d]">Tel:</span> +237 693 643 580
                  </span>
                  <span className="flex items-center gap-1.5 border-r border-[#e5e5e2] pr-4">
                    <span className="text-[#be185d]">Email:</span> theresemangwa2376@gmail.com
                  </span>
                  <span className="flex items-center gap-1.5 pb-0.5">
                    <span className="text-[#be185d]">Loc:</span> Yaoundé, Cameroun (Née le 15 Oct. 2001)
                  </span>
                </div>
              </div>

              {/* Biography Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#be185d] font-mono">
                  {t.about.bioTitle}
                </h3>
                <div className="prose prose-stone leading-relaxed font-serif text-stone-700 space-y-4 text-sm">
                  {isEditing ? (
                    <div className="space-y-4">
                        <textarea 
                            className="w-full h-40 p-2 border border-stone-300 rounded"
                            value={lang === 'fr' ? userBioFr : userBioEn}
                            onChange={(e) => lang === 'fr' ? setUserBioFr(e.target.value) : setUserBioEn(e.target.value)}
                        />
                        <div>
                            <label className="block text-xs font-mono text-stone-600 mb-1">Changer la photo de profil</label>
                            <input type="file" accept="image/*" onChange={handleProfileImageChange} />
                        </div>
                    </div>
                  ) : (
                    <p>{lang === 'fr' ? userBioFr : userBioEn}</p>
                  )}
                  <p>
                    {lang === 'fr' 
                      ? "Mon objectif professionnel est de mettre mes compétences journalistiques au service de la promotion de l'information fiable, du développement social et de la valorisation des initiatives locales."
                      : "My professional objective is to dedicate my journalistic skills to promoting reliable, public-interest news, fostering social development, and highlighting local grassroots initiatives."}
                  </p>
                </div>
              </div>

              {/* Professional Journey (Parcours) & Experience & Expertise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#be185d] font-mono">
                    {lang === 'fr' ? "Expérience Professionnelle" : "Professional Experience"}
                  </h3>
                  <div className="space-y-6 font-serif text-stone-700">
                    <div className="border-l-2 border-[#be185d] pl-4 space-y-1">
                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-mono bg-pink-50 text-[#be185d] px-1.5 py-0.5 rounded font-black font-sans uppercase">12/2025 - Présent (3 mois)</span>
                        <span className="text-[10px] tracking-widest text-[#be185d] font-sans font-bold uppercase">CDD Principal</span>
                      </div>
                      <h4 className="font-bold text-xs tracking-tight text-neutral-950 uppercase font-sans mt-1">
                        {lang === 'fr' ? "Journaliste Présentatrice" : "Journalist Host & Presenter"}
                      </h4>
                      <div className="text-xs text-neutral-800 font-sans font-semibold mb-1">ONG PICHNET | Yaoundé</div>
                      <ul className="text-xs text-stone-600 list-disc list-inside space-y-1 font-sans pl-1">
                        <li>{lang === 'fr' ? "Présentatrice officielle du projet de formation \"Pays Protection Sociale\"." : "Official host of the \"Pays Protection Sociale\" training show project."}</li>
                        <li>{lang === 'fr' ? "Journaliste active au sein de la cellule de communication interne et externe." : "Active journalist inside the corporate communications and media unit."}</li>
                      </ul>
                    </div>

                    <div className="border-l-2 border-[#be185d]/40 pl-4 space-y-1">
                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-black font-sans uppercase">01/2022 - Présent (4 ans et 2 mois)</span>
                      </div>
                      <h4 className="font-bold text-xs tracking-tight text-neutral-950 uppercase font-sans mt-1">
                        {lang === 'fr' ? "Encadreuse en Communication" : "Communication Officer & Mentor"}
                      </h4>
                      <div className="text-xs text-neutral-800 font-sans font-semibold mb-1">ONG PICHNET | Yaoundé</div>
                      <ul className="text-xs text-stone-600 list-disc list-inside space-y-1 font-sans pl-1">
                        <li>{lang === 'fr' ? "Supervision et accompagnement pédagogique de stagiaires dans la production de documentaires." : "Supervision and career support of media interns during documentary films production."}</li>
                        <li>{lang === 'fr' ? "Initiation, tutorat et encadrement pratique aux techniques d'interview de terrain." : "Training and tutoring in field interviewing methodologies and formats."}</li>
                      </ul>
                    </div>

                    <div className="border-l-2 border-[#be185d]/40 pl-4 space-y-1">
                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-black font-sans uppercase">07/2025 - 09/2025 & 07/2024 - 08/2024</span>
                      </div>
                      <h4 className="font-bold text-xs tracking-tight text-neutral-950 uppercase font-sans mt-1">
                        {lang === 'fr' ? "Stagiaire en Journalisme" : "Journalism Intern"}
                      </h4>
                      <div className="text-xs text-neutral-800 font-sans font-semibold mb-1">Radio Royal FM 88.4 | Yaoundé, Cameroun</div>
                      <ul className="text-xs text-stone-600 list-disc list-inside space-y-1 font-sans pl-1">
                        <li>{lang === 'fr' ? "Propositions d'articles et rédaction de sujets adaptés aux grilles de la station." : "Pitching, editing, and drafting audio items matching program rubrics."}</li>
                        <li>{lang === 'fr' ? "Participation active aux conférences de rédaction quotidiennes et régulières." : "Full participation in editorial planning and daily review panel sessions."}</li>
                      </ul>
                    </div>

                    <div className="border-l-2 border-[#be185d]/40 pl-4 space-y-1">
                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-black font-sans uppercase">08/2023 - 08/2023</span>
                      </div>
                      <h4 className="font-bold text-xs tracking-tight text-neutral-950 uppercase font-sans mt-1">
                        {lang === 'fr' ? "Stagiaire en Journalisme" : "Journalism Trainee"}
                      </h4>
                      <div className="text-xs text-neutral-800 font-sans font-semibold mb-1">Quotidien L'Économie | Yaoundé</div>
                      <ul className="text-xs text-stone-600 list-disc list-inside space-y-1 font-sans pl-1">
                        <li>{lang === 'fr' ? "Utilisation stratégique des médias sociaux pour promouvoir le contenu du journal." : "Strategic management of social platforms to engage readers and lift brand visibility."}</li>
                        <li>{lang === 'fr' ? "Recherche approfondie et minutieuse de sources de données fiables." : "Rigorous source tracking and investigative cross-referencing."}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* DOMAINES D'EXPERTISE, FORMATION & COMPETENCES */}
                <div className="space-y-6">
                  {/* Formation Section */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#be185d] font-mono">
                      {lang === 'fr' ? "Formation & Diplômes" : "Education & Academic Degrees"}
                    </h3>
                    <div className="space-y-4 font-serif text-stone-700">
                      <div className="border-l-2 border-stone-300 pl-4 space-y-1">
                        <span className="text-[9px] font-mono bg-stone-100 text-stone-800 px-1 py-0.5 rounded font-bold font-sans">01/2024 - 01/2025</span>
                        <h4 className="font-bold text-xs tracking-tight text-neutral-950 uppercase font-sans">
                          Licence Professionnelle en Journalisme
                        </h4>
                        <div className="text-xs text-[#be185d] font-sans font-semibold">ESSTIC | Ecole Supérieure des Sciences et Techniques de l'Information et de la Communication</div>
                        <p className="text-xs text-stone-500 mt-1 font-sans">
                          {lang === 'fr' ? "Formation d'excellence en journalisme de terrain, éthique média, techniques d'enquête et de fact-checking à Yaoundé." : "Comprehensive practical studies in field-interviewing, investigation methods, and media laws in Yaoundé."}
                        </p>
                      </div>

                      <div className="border-l-2 border-stone-300 pl-4 space-y-1">
                        <span className="text-[9px] font-mono bg-stone-100 text-stone-800 px-1 py-0.5 rounded font-bold font-sans">2020 - 2021</span>
                        <h4 className="font-bold text-xs tracking-tight text-neutral-950 uppercase font-sans">
                          Baccalauréat Littéraire (A4 ALL)
                        </h4>
                        <div className="text-xs text-stone-600 font-sans font-semibold">Collège Île Éducative | Yaoundé</div>
                        <p className="text-xs text-stone-500 mt-0.5 font-sans">
                          {lang === 'fr' ? "Spécialisation en lettres, langues vivantes et philosophie." : "Specialization in literature, modern languages, and communication."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills tags selection from CV */}
                  <div className="space-y-3 pt-4 border-t border-[#e5e5e2]">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#be185d] font-mono">
                      {t.about.expertiseTitle}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        lang === 'fr' ? "Présentation événementielle" : "Event Hosting & Hosting",
                        lang === 'fr' ? "Animation Télé & Radio" : "TV & Radio Presenting",
                        lang === 'fr' ? "Techniques d'interview" : "Interviewing Techniques",
                        lang === 'fr' ? "Production Documentaire" : "Documentary Film Coaching",
                        lang === 'fr' ? "Fact-checking & Enquêtes" : "Fact-checking & Investigations",
                        lang === 'fr' ? "Stratégie Médias Sociaux" : "Social Media Outreach",
                        lang === 'fr' ? "Rigueur administrative & professionnelle" : "Professional Rigor",
                        lang === 'fr' ? "Microsoft Word / Excel" : "MS Word & Excel",
                        lang === 'fr' ? "Esprit d'équipe & Intégrité" : "Team Player & Absolute Integrity",
                        lang === 'fr' ? "Assiduité irréprochable" : "Assiduous Commitment",
                      ].map((item, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-pink-50/50 border border-pink-100/60 text-[#be185d] text-[10px] font-sans font-semibold rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Languages from CV */}
                  <div className="space-y-3 pt-4 border-t border-[#e5e5e2]">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#be185d] font-mono">
                      {lang === 'fr' ? "Langues" : "Languages"}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="bg-stone-50 p-2 border border-stone-200">
                        <span className="font-bold block uppercase text-[10px] text-stone-800">{lang === 'fr' ? "Français" : "French"}</span>
                        <span className="text-stone-500 font-mono text-[10px]">{lang === 'fr' ? "Bilingue" : "Bilingual"}</span>
                      </div>
                      <div className="bg-stone-50 p-2 border border-stone-200">
                        <span className="font-bold block uppercase text-[10px] text-stone-800">{lang === 'fr' ? "Anglais" : "English"}</span>
                        <span className="text-stone-500 font-mono text-[10px]">{lang === 'fr' ? "Intermédiaire" : "Intermediate"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interests from CV */}
                  <div className="space-y-2 pt-4 border-t border-[#e5e5e2]">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#be185d] font-mono">
                      {lang === 'fr' ? "Centres d'intérêt" : "Interests"}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs font-sans">
                      {[
                        lang === 'fr' ? "🎵 Musique" : "🎵 Music",
                        lang === 'fr' ? "📚 Lecture" : "📚 Reading",
                        lang === 'fr' ? "✈️ Voyages" : "✈️ Travel",
                        lang === 'fr' ? "🍳 Cuisine" : "🍳 Cooking"
                      ].map((interest, idx) => (
                        <span key={idx} className="px-3 py-1 bg-stone-100 rounded-full font-medium text-stone-700">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HOME TAB */}
          {currentTab === 'home' && (
            <div id="tab-home-view" className="space-y-8 animate-fade-in">
              
              <div className="block md:hidden border-b border-[#e5e5e2] pb-6 space-y-6 text-left">
                <div className="flex gap-4 items-center bg-[#fafaf9] p-3 border border-stone-200">
                  <div className="w-14 h-14 flex-shrink-0 relative border border-[#e5e5e2]">
                    <img 
                      src={userProfileImage} 
                      alt="Mangwa Thérèse" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h2 className="text-xs font-sans font-black tracking-tight text-[#1a1a1a] uppercase">Mangwa Thérèse</h2>
                    <p className="text-[10px] font-serif italic text-stone-600 leading-snug">
                      {t.home.aboutBriefText}
                    </p>
                    <div className="flex gap-2 text-[8px] font-black uppercase tracking-widest text-[#be185d] pt-0.5">
                      <button onClick={() => setCurrentTab('contact')} className="underline hover:text-[#b91c1c] transition-colors">Prendre Contact</button>
                      <span className="text-stone-300">|</span>
                      <button onClick={() => setCurrentTab('about')} className="underline hover:text-[#b91c1c] transition-colors">{t.nav.about}</button>
                    </div>
                  </div>
                </div>

                {/* Mobile version of active live radio widget */}
                <div className="bg-white border text-left p-4 flex flex-col gap-2 relative bg-[radial-gradient(#f0f0ee_1px,transparent_1px)] [background-size:16px_16px] border-[#1a1a1a] border-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-[#be185d]">
                      <span className="w-1.5 h-1.5 bg-[#be185d] rounded-full animate-ping"></span>
                      {liveSession?.status === 'live' ? "EN DIRECT" : "PROCHAINE ÉMISSION"}
                    </span>
                    <span className="text-[8px] font-mono text-[#6b6b6b]">{liveSession?.date} {liveSession?.time}</span>
                  </div>
                  <h4 className="font-serif font-black text-xs text-[#1a1a1a] leading-tight">
                    {liveSession ? (lang === 'fr' ? liveSession.titleFr : liveSession.titleEn) : "Pas de séance de radio live programmée"}
                  </h4>
                  {liveSession && (
                    <p className="text-[10px] text-[#6b6b6b] font-serif italic line-clamp-2">
                      {lang === 'fr' ? liveSession.descriptionFr : liveSession.descriptionEn}
                    </p>
                  )}
                  <button 
                    onClick={() => setCurrentTab('live')}
                    className="w-full text-center py-2 bg-[#be185d] hover:bg-[#a2124a] text-white text-[9px] font-black uppercase tracking-widest transition duration-150"
                  >
                    Rejoindre l'Antenne →
                  </button>
                </div>
              </div>

              <div className="flex flex-col pb-8 border-b border-[#e5e5e2]">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b91c1c] mb-2 font-mono">À LA UNE DE L'ENQUÊTE</span>
                
                {featuredArticle ? (
                  <div id="homepage-featured-block" onClick={() => selectArticle(featuredArticle)} className="cursor-pointer group text-left">
                    <h1 className="text-3xl md:text-4xl font-serif font-black leading-[1.1] text-[#1a1a1a] mb-4 group-hover:text-[#b91c1c] transition-colors">
                      {lang === 'fr' ? featuredArticle.titleFr : featuredArticle.titleEn}
                    </h1>
                    <div className="aspect-[16/9] w-full overflow-hidden mb-4 border border-[#e5e5e2]">
                      <img src={featuredArticle.image} alt="Featured" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                    <p className="text-sm text-[#4a4a4a] leading-relaxed mb-4 italic font-serif line-clamp-3">
                      {lang === 'fr' ? featuredArticle.contentFr.split('\n')[0] : featuredArticle.contentEn.split('\n')[0]}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#6b6b6b]">
                      <span>{featuredArticle.date}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {featuredArticle.readTime} min de lecture</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-serif italic text-[#6b6b6b] text-left">Aucun grand dossier publié pour le moment.</p>
                )}
              </div>

              {/* Home Grid Section: Sub articles */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a] mb-6 font-mono border-b border-[#1a1a1a] pb-2 text-left">
                  {t.home.latestArticles}
                </h3>
                <div id="home-sub-articles-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {articles.slice(1, 3).map((art) => (
                    <div 
                      key={art.id} 
                      id={`home-sub-art-${art.id}`}
                      onClick={() => selectArticle(art)} 
                      className="cursor-pointer group flex flex-col gap-2"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#b91c1c] font-mono">{art.category}</span>
                      <h4 className="font-serif font-black text-sm leading-tight text-[#1a1a1a] group-hover:text-[#b91c1c] transition-colors">
                        {lang === 'fr' ? art.titleFr : art.titleEn}
                      </h4>
                      <p className="text-xs text-[#6b6b6b] line-clamp-2 leading-relaxed">
                        {lang === 'fr' ? art.contentFr.substring(0, 100) : art.contentEn.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-3 text-[9px] font-bold text-[#6b6b6b] uppercase mt-1">
                        <span>{art.date}</span>
                        <span>•</span>
                        <span>{art.readTime} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MOBILE ONLY NEWS BRIEF FEED & NEWSLETTER (Visible on mobile/tablet) */}
              <div className="block lg:hidden pt-8 border-t border-[#e5e5e2] space-y-6 text-left">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a] mb-3 font-mono">
                    {t.home.latestNews} (Fil de brèves)
                  </h3>
                  <div className="space-y-4 divide-y divide-[#e5e5e2]">
                    {newsList.slice(0, 3).map((item) => (
                      <div key={item.id} className="pt-3 first:pt-0">
                        <span className="text-[8px] font-mono text-stone-500">Fil d'info • {new Date(item.date).toLocaleDateString()}</span>
                        <h4 className="text-xs font-serif font-black text-stone-950 mt-0.5 leading-snug">{lang === 'fr' ? item.titleFr : item.titleEn}</h4>
                        <p className="text-[10.5px] text-stone-600 mt-1 leading-snug line-clamp-2">{lang === 'fr' ? item.contentFr : item.contentEn}</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentTab('news')} 
                    className="text-[9px] font-black uppercase tracking-widest underline text-[#5a5a5a] hover:text-black mt-3 block"
                  >
                    Consulter le fil complet →
                  </button>
                </div>

                <div className="bg-[#1a1a1a] text-white p-5 border-l-4 border-l-[#b91c1c] shadow-[4px_4px_0px_rgba(0,0,0,0.15)]">
                  <h4 className="text-xs font-serif font-black italic text-stone-100 mb-1">{t.home.newsletterTitle}</h4>
                  <p className="text-[9.5px] leading-relaxed text-[#a1a1a1] mb-3 uppercase tracking-wider font-mono">
                    {t.home.newsletterSubtitle}
                  </p>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      showAlert(t.home.newsletterSuccess);
                      (e.target as HTMLFormElement).reset();
                    }} 
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input 
                      type="email" 
                      required
                      placeholder="votre_email@teliatv.com" 
                      className="bg-stone-800 border-b border-stone-600 text-xs py-1.5 px-2 focus:outline-none placeholder:text-stone-500 text-stone-200 flex-1"
                    />
                    <button 
                      type="submit"
                      className="text-[9px] font-black text-white bg-pink-700 hover:bg-[#be185d] py-1.5 px-4 uppercase tracking-widest transition duration-150"
                    >
                      S'abonner
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

          {/* ARTICLES TAB */}
          {currentTab === 'articles' && !selectedArticleId && (
            <div id="tab-articles-list" className="space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-[#e5e5e2]">
                <h1 className="text-2xl font-serif font-black text-[#1a1a1a] mb-3">{t.articles.title}</h1>
                
                {/* Search / Filters Bar */}
                <div className="flex flex-col gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-[#6b6b6b]" size={15} />
                    <input 
                      id="articles-search-input"
                      type="text" 
                      placeholder={t.articles.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setArticlePage(1);
                      }}
                      className="w-full bg-[#f0f0ee] border border-[#e5e5e2] text-xs font-mono py-2.5 pl-9 pr-4 focus:outline-none focus:border-stone-500 text-stone-900"
                    />
                  </div>
                  
                  {/* Category + Language Filters Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Categories Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Sujets:</span>
                      <div className="flex gap-1 overflow-x-auto">
                        {['All', 'Réseaux Sociaux', 'Fact-checking', 'Culture & Société'].map((category) => (
                          <button
                            key={category}
                            id={`category-filter-${category}`}
                            onClick={() => {
                              setSelectedCategory(category);
                              setArticlePage(1);
                            }}
                            className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 border transition ${selectedCategory === category ? 'bg-[#1a1a1a] text-white border-black' : 'bg-transparent text-neutral-500 border-[#e5e5e2] hover:text-black'}`}
                          >
                            {category === 'All' ? t.articles.categoriesAll : category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">{lang === 'fr' ? 'Langue:' : 'Language:'}</span>
                      <div className="flex gap-1">
                        {[
                          { val: 'all', label: lang === 'fr' ? 'Toutes' : 'All' },
                          { val: 'fr', label: 'FR' },
                          { val: 'en', label: 'EN' }
                        ].map((item) => (
                          <button
                            key={item.val}
                            id={`lang-filter-${item.val}`}
                            onClick={() => {
                              setSelectedArticleLang(item.val as any);
                              setArticlePage(1);
                            }}
                            className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 border transition ${selectedArticleLang === item.val ? 'bg-[#1a1a1a] text-white border-black' : 'bg-transparent text-neutral-500 border-[#e5e5e2] hover:text-black'}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Articles dynamic list */}
              {(() => {
                const articlesPerPage = 3;
                const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
                const currentPage = Math.min(articlePage, totalPages || 1);
                const startIndex = (currentPage - 1) * articlesPerPage;
                const paginatedArticles = filteredArticles.slice(startIndex, startIndex + articlesPerPage);

                return (
                  <div className="space-y-6">
                    {filteredArticles.length === 0 ? (
                      <div className="text-center py-12 text-sm text-[#6b6b6b] italic font-serif">
                        {t.articles.noArticles}
                      </div>
                    ) : (
                      <>
                        <div id="articles-items-list" className="space-y-8 divide-y divide-[#e5e5e2]">
                          {paginatedArticles.map((art) => (
                            <div 
                              key={art.id} 
                              id={`article-card-${art.id}`}
                              onClick={() => selectArticle(art)}
                              className="pt-6 first:pt-0 flex flex-col md:flex-row gap-6 cursor-pointer group"
                            >
                              <div className="flex-1 space-y-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#b91c1c] font-mono">{art.category}</span>
                                <h4 className="text-xl font-serif font-black text-[#1a1a1a] leading-tight group-hover:text-[#b91c1c] transition-colors">
                                  {lang === 'fr' ? art.titleFr : art.titleEn}
                                </h4>
                                <p className="text-xs text-[#6b6b6b] font-serif italic line-clamp-2 leading-relaxed">
                                  {lang === 'fr' ? art.contentFr.split('\n')[0] : art.contentEn.split('\n')[0]}
                                </p>
                                <div className="flex items-center gap-4 text-[9px] font-black text-[#6b6b6b] uppercase mt-2 font-mono">
                                  <span>{art.date}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Eye size={10} /> {art.views || 0} {lang === 'fr' ? 'vues' : 'views'}</span>
                                  <span>•</span>
                                  <span>{art.readTime} min</span>
                                </div>
                              </div>
                              <div className="w-full md:w-32 aspect-video md:aspect-square bg-gray-200 overflow-hidden flex-shrink-0 border border-[#e5e5e2]">
                                <img src={art.image} alt={art.titleFr} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination Selector Panel */}
                        {totalPages > 1 && (
                          <div id="articles-pagination-bar" className="flex items-center justify-between border-t border-[#e5e5e2] pt-4 font-mono text-[10px] text-stone-500">
                            <button
                              id="articles-pagination-prev"
                              disabled={currentPage === 1}
                              onClick={() => setArticlePage(currentPage - 1)}
                              className="px-3 py-1.5 border border-[#e5e5e2] hover:border-black hover:text-black font-bold uppercase transition disabled:opacity-40 disabled:hover:border-[#e5e5e2] disabled:hover:text-stone-500"
                            >
                              ← {lang === 'fr' ? 'Précédent' : 'Previous'}
                            </button>
                            <span className="font-bold">
                              {lang === 'fr' ? `Page ${currentPage} sur ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                            </span>
                            <button
                              id="articles-pagination-next"
                              disabled={currentPage === totalPages}
                              onClick={() => setArticlePage(currentPage + 1)}
                              className="px-3 py-1.5 border border-[#e5e5e2] hover:border-black hover:text-black font-bold uppercase transition disabled:opacity-40 disabled:hover:border-[#e5e5e2] disabled:hover:text-stone-500"
                            >
                              {lang === 'fr' ? 'Suivant' : 'Next'} →
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ARTICLE DETAILS READ VIEW */}
          {currentTab === 'articles' && selectedArticleId && (
            (() => {
              const art = articles.find(a => a.id === selectedArticleId);
              if (!art) return null;
              const isSaved = favorites.some(f => f.id === art.id);
              return (
                <div id="tab-article-details-panel" className="space-y-6 animate-fade-in text-left">
                  <button 
                    id="back-to-articles-list"
                    onClick={() => setSelectedArticleId(null)} 
                    className="text-[9px] font-black uppercase tracking-widest text-[#6b6b6b] hover:text-[#b91c1c] mb-2 flex items-center gap-1 font-mono"
                  >
                    ← Retour aux dossiers
                  </button>

                  <div className="space-y-3 pb-6 border-b border-[#e5e5e2]">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#b91c1c] font-mono">{art.category}</span>
                      
                      {/* Favorite bookmark icon trigger */}
                      <button 
                        id={`btn-bookmark-toggle-${art.id}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(art.id); }}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#1a1a1a] hover:text-red-600 transition"
                      >
                        <Heart size={14} className={isSaved ? "fill-red-600 text-red-600" : "text-[#6b6b6b]"} />
                        {isSaved ? "Dossier Sauvegardé" : "Sauvegarder l'enquête"}
                      </button>
                    </div>

                    <h1 id="details-article-title" className="text-3xl md:text-4xl font-serif font-black leading-[1.1] text-black">
                      {lang === 'fr' ? art.titleFr : art.titleEn}
                    </h1>

                    <div className="flex items-center gap-4 text-[10px] font-black text-[#6b6b6b] uppercase font-mono">
                      <span>{art.date}</span>
                      <span>•</span>
                      <span>Par {art.author}</span>
                      <span>•</span>
                      <span>{art.readTime} min read</span>
                    </div>
                  </div>

                  <div className="w-full aspect-[21/9] bg-stone-100 overflow-hidden border border-[#e5e5e2]">
                    <img src={art.image} alt={art.titleFr} className="w-full h-full object-cover" />
                  </div>

                  {/* Social media sharing */}
                  <div className="flex items-center gap-3 py-3 border-b border-[#e5e5e2]">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#6b6b6b] font-mono">Partager :</span>
                    <div className="flex gap-2 text-[10px] font-mono font-bold">
                      <button onClick={() => { navigator.clipboard.writeText(window.location.href); showAlert(lang === 'fr' ? "Le lien a été copié !" : "Link copied!", "success"); }} className="text-stone-600 hover:text-black underline">Copier le lien</button>
                      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent((lang === 'fr' ? art.titleFr : art.titleEn) + ' - par Mangwa Thérèse')}`} target="_blank" rel="noreferrer" className="text-stone-600 hover:text-[#be185d] underline">Twitter/X</a>
                      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="text-stone-600 hover:text-[#be185d] underline">LinkedIn</a>
                    </div>
                  </div>

                  {/* Rich Content Render */}
                  <div id="details-content-body" className="font-serif text-[#1a1a1a] space-y-4 text-sm md:text-base leading-relaxed whitespace-pre-line border-b border-[#e5e5e2] pb-6">
                    {lang === 'fr' ? art.contentFr : art.contentEn}
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-1 text-stone-700">
                      <span>Commentaires de la communauté ({comments.length})</span>
                    </h3>

                    {/* New comment input form */}
                    {currentUser ? (
                      <form id="comment-add-form" onSubmit={postComment} className="flex gap-2">
                        <input 
                          id="comment-input-field"
                          type="text"
                          placeholder="Ajouter une observation pertinente..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 bg-[#f0f0ee] border border-[#e5e5e2] text-xs py-2 px-3 focus:outline-none"
                        />
                        <button 
                          id="comment-submit"
                          type="submit"
                          className="px-4 py-2 bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#b91c1c] transition"
                        >
                          Publier
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-neutral-500 italic bg-[#f0f0ee] p-3 border border-stone-200">
                        Veuillez vous authentifier dans l'onglet <strong>Mon Espace</strong> pour rédiger une opinion critique.
                      </p>
                    )}

                    {/* Comments list */}
                    <div id="comments-timeline" className="space-y-3">
                      {comments.length === 0 ? (
                        <p className="text-xs text-[#6b6b6b] italic font-serif">Soyez le premier à commenter cet article.</p>
                      ) : (
                        comments.map((comm) => (
                          <div key={comm.id} id={`comment-item-${comm.id}`} className="bg-[#fcfcfb] border border-[#e5e5e2] p-3 text-xs space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="font-black text-stone-900">{comm.userName}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {new Date(comm.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-neutral-700 font-serif leading-normal">{comm.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              );
            })()
          )}

          {/* NEWS TAB (BRÈVES DE RÉDACTION) */}
          {currentTab === 'news' && (
            <div id="tab-news-view" className="space-y-6 animate-fade-in text-left">
              {selectedNewsId ? (
                (() => {
                  const item = newsList.find(n => n.id === selectedNewsId);
                  if (!item) return null;
                  return (
                    <div id="news-detail-view" className="space-y-5">
                      <button 
                        id="back-to-news-list"
                        onClick={() => setSelectedNewsId(null)} 
                        className="text-[9px] font-black uppercase tracking-widest text-[#6b6b6b] hover:text-[#b91c1c] mb-2 flex items-center gap-1 font-mono"
                      >
                        ← {lang === 'fr' ? 'Retour aux brèves' : 'Back to News Feed'}
                      </button>
                      
                      <div className="border-b border-[#e5e5e2] pb-4">
                        <span className="text-[10px] font-mono bg-[#f0f0ee] text-stone-800 px-1.5 py-0.5 rounded font-black uppercase">
                          {new Date(item.date).toLocaleString()} (UTC)
                        </span>
                        <h1 className="text-2xl font-serif font-black leading-tight text-black mt-2">
                          {lang === 'fr' ? item.titleFr : item.titleEn}
                        </h1>
                      </div>

                      <div className="font-serif text-[#1a1a1a] text-sm md:text-base leading-relaxed whitespace-pre-line bg-stone-50 p-6 border border-[#e5e5e2]">
                        {lang === 'fr' ? item.contentFr : item.contentEn}
                      </div>

                      {/* Social media sharing */}
                      <div className="flex items-center gap-3 py-3 border-t border-b border-[#e5e5e2]">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#6b6b6b] font-mono">Partager :</span>
                        <div className="flex gap-2 text-[10px] font-mono font-bold">
                          <button onClick={() => { navigator.clipboard.writeText(window.location.href); showAlert(lang === 'fr' ? "Lien de la brève copié !" : "News link copied!", "success"); }} className="text-stone-600 hover:text-black underline">Copier le lien</button>
                          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent((lang === 'fr' ? item.titleFr : item.titleEn) + ' - par Mangwa Thérèse')}`} target="_blank" rel="noreferrer" className="text-stone-600 hover:text-[#be185d] underline">Twitter/X</a>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <h1 className="text-2xl font-serif font-black text-[#1a1a1a] pb-3 border-b border-[#e5e5e2]">
                    {t.news.title}
                  </h1>

                  {newsList.length === 0 ? (
                    <div className="text-center py-12 text-[#6b6b6b] italic font-serif">{t.news.noNews}</div>
                  ) : (
                    <div id="news-continuous-wire" className="relative border-l-2 border-stone-200 pl-4 ml-2 space-y-6 pt-4">
                      {newsList.map((item) => (
                        <div 
                          key={item.id} 
                          id={`news-wire-item-${item.id}`} 
                          className="relative cursor-pointer group hover:bg-neutral-50/50 p-2 rounded transition" 
                          onClick={() => setSelectedNewsId(item.id)}
                        >
                          {/* Node point */}
                          <span className="absolute -left-[21px] top-4 w-2 h-2 rounded-full bg-[#b91c1c] group-hover:scale-125 transition-transform"></span>
                          <div className="space-y-1 pl-2">
                            <span className="text-[9px] font-mono font-bold text-[#6b6b6b]">
                              {new Date(item.date).toLocaleString()} (UTC)
                            </span>
                            <h4 className="font-serif font-black text-sm text-black leading-snug group-hover:text-[#b91c1c] transition-colors">
                              {lang === 'fr' ? item.titleFr : item.titleEn}
                            </h4>
                            <p className="text-xs text-[#4a4a4a] leading-relaxed line-clamp-2">
                              {lang === 'fr' ? item.contentFr : item.contentEn}
                            </p>
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-[#b91c1c] hover:underline font-mono">
                              {lang === 'fr' ? "Lire la suite →" : "Read more →"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PODCASTS TAB */}
          {currentTab === 'podcasts' && (
            <div id="tab-podcasts-view" className="space-y-6 animate-fade-in text-left">
              <h1 className="text-2xl font-serif font-black text-[#1a1a1a] pb-3 border-b border-[#e5e5e2]">
                {t.podcasts.title}
              </h1>

              {podcasts.length === 0 ? (
                <div className="text-center py-12 text-sm text-[#6b6b6b] italic font-serif">{t.podcasts.noPodcasts}</div>
              ) : (
                <div id="podcasts-deck-list" className="space-y-4">
                  {podcasts.map((ep) => (
                    <div 
                      key={ep.id} 
                      id={`podcast-item-${ep.id}`}
                      className="bg-white border border-[#e5e5e2] hover:border-black p-4 flex gap-4 transition-all relative group"
                    >
                      <div className="w-20 h-20 bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                        <img src={ep.imageUrl} alt={ep.titleFr} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 text-[9px] font-mono text-[#6b6b6b]">
                          <span>{ep.date}</span>
                          <span>•</span>
                          <span>{ep.duration}</span>
                        </div>
                        <h4 className="font-serif font-black text-sm text-stone-900 group-hover:text-[#b91c1c] transition-colors truncate">
                          {lang === 'fr' ? ep.titleFr : ep.titleEn}
                        </h4>
                        <p className="text-xs text-[#6b6b6b] line-clamp-2 leading-tight">
                          {lang === 'fr' ? ep.descriptionFr : ep.descriptionEn}
                        </p>
                        {ep.guests.length > 0 && (
                          <div className="text-[10px] text-neutral-400 font-serif pt-1">
                            <span className="font-bold">{t.podcasts.guests}:</span> {ep.guests.join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center items-center pl-2 border-l border-[#e5e5e2]">
                        <button 
                          id={`play-episode-btn-${ep.id}`}
                          onClick={() => {
                            setActiveEpisode(ep);
                            showAlert(`Lecture : ${lang === 'fr' ? ep.titleFr : ep.titleEn}`);
                          }}
                          className="px-3.5 py-1.5 bg-[#1a1a1a] hover:bg-[#b91c1c] text-white text-[9px] font-black uppercase tracking-widest transition-transform active:scale-95 flex items-center gap-1"
                        >
                          Play
                        </button>
                        <a 
                          id={`download-link-${ep.id}`}
                          href={ep.audioUrl} 
                          download 
                          className="text-[9px] font-bold text-stone-500 hover:text-black uppercase underline mt-2"
                        >
                          Mp3
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LIVE PODCAST BROADCAST ROOM TAB */}
          {currentTab === 'live' && (
            <div id="tab-live-broadcast-room" className="space-y-6 animate-fade-in text-left">
              <div className="pb-4 border-b border-[#e5e5e2] flex flex-col md:flex-row items-baseline justify-between gap-2">
                <h1 className="text-2xl font-serif font-black text-[#1a1a1a]">
                  {t.live.title}
                </h1>
                {liveSession && liveSession.status === 'live' && (
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#b91c1c] bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                    <span className="w-2 h-2 bg-[#b91c1c] rounded-full animate-ping"></span>
                    DIRECT EN COURS
                  </span>
                )}
              </div>

              {liveSession ? (
                <div className="space-y-6">
                  
                  {/* Visual simulated studio deck */}
                  <div className="bg-[#1a1a1a] p-6 text-white text-left shadow-lg space-y-4 relative overflow-hidden bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono tracking-widest text-[#f472b6] uppercase font-bold">Telia Tv Studio Principal</span>
                      <span className="bg-[#be185d] text-[#fafaf9] text-[9px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                        {liveSession.status === 'live' ? 'Mic Live On' : 'Studio Off-Air'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2 id="studio-session-title" className="text-2xl font-serif italic text-white font-bold leading-tight">
                        {lang === 'fr' ? liveSession.titleFr : liveSession.titleEn}
                      </h2>
                      <p id="studio-session-desc" className="text-xs text-neutral-300 leading-relaxed font-serif max-w-xl">
                        {lang === 'fr' ? liveSession.descriptionFr : liveSession.descriptionEn}
                      </p>
                    </div>

                    {/* Audio Simulated Mic stream player */}
                    {liveSession.status === 'live' && liveSession.audioUrl && (
                      <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                          <span className="text-xs text-emerald-400 font-mono">Flux audio sécurisé connecté</span>
                        </div>
                        <audio 
                          id="live-audio-stream"
                          controls 
                          src={liveSession.audioUrl} 
                          className="h-8 max-w-[200px] md:max-w-[250px] accent-[#b91c1c]"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-3 border-t border-neutral-800">
                      <span>Prévu pour le {liveSession.date} à {liveSession.time} UTC</span>
                      <span>Qualité audio : 320kbps</span>
                    </div>
                  </div>

                  {/* Mounting interactive Live Chat panel with active websocket synchronization */}
                  <div className="mt-4">
                    <LiveChat 
                      session={liveSession} 
                      currentUser={currentUser} 
                      onAlert={showAlert} 
                      lang={lang}
                    />
                  </div>

                </div>
              ) : (
                <p className="text-sm font-serif text-[#6b6b6b] italic inline-block">{t.live.noLiveSessions}</p>
              )}
            </div>
          )}

          {/* MEMBER AREA TAB */}
          {currentTab === 'member' && (
            <div id="tab-member-workspace" className="space-y-6 animate-fade-in text-left">
              
              {!currentUser ? (
                <div className="max-w-md mx-auto bg-white border border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-6 space-y-4">
                  <div className="text-center space-y-2 border-b border-[#e5e5e2] pb-4">
                    <h2 id="auth-box-title" className="text-xl font-serif font-black uppercase text-black">
                      {authIsSignUp ? t.member.signUpTitle : t.member.loginTitle}
                    </h2>
                    <p className="text-xs text-[#6b6b6b]">Sécurité authentique de l'espace citoyen indépendant.</p>
                  </div>

                  <form id="auth-credentials-form" onSubmit={handleAuth} className="space-y-3">
                    {authIsSignUp && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-[#1a1a1a]">{t.member.name}</label>
                        <input 
                          id="auth-input-name"
                          type="text" 
                          required 
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full bg-[#f0f0ee] border border-[#e5e5e2] text-xs py-2 px-3 focus:outline-none"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#1a1a1a]">{t.member.email}</label>
                      <input 
                        id="auth-input-email"
                        type="email" 
                        required 
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-[#f0f0ee] border border-[#e5e5e2] text-xs py-2 px-3 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#1a1a1a]">{t.member.password}</label>
                      <input 
                        id="auth-input-password"
                        type="password" 
                        required 
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-[#f0f0ee] border border-[#e5e5e2] text-xs py-2 px-3 focus:outline-none"
                      />
                    </div>

                    <button 
                      id="auth-submit-btn"
                      type="submit"
                      className="w-full py-2.5 bg-[#1a1a1a] hover:bg-[#b91c1c] text-white text-[11px] font-black uppercase tracking-widest transition"
                    >
                      {authIsSignUp ? t.member.signUpBtn : t.member.loginBtn}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button 
                      id="auth-toggle-mode"
                      onClick={() => setAuthIsSignUp(!authIsSignUp)} 
                      className="text-xs text-[#6b6b6b] hover:text-black hover:underline"
                    >
                      {authIsSignUp ? t.member.alreadyAccount : t.member.noAccount}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  
                  {/* Profile Info Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e2]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center font-serif text-2xl font-black">
                        {currentUser.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 id="profile-greet-name" className="text-xl font-serif font-black text-black">{currentUser.name}</h2>
                        <span className="text-[10px] font-mono text-[#6b6b6b]">Rôle : <span className="uppercase text-[#b91c1c] font-black">{currentUser.role}</span></span>
                      </div>
                    </div>
                    <button 
                      id="profile-logout-btn"
                      onClick={handleLogout}
                      className="px-4 py-2 border border-[#1a1a1a] text-[10px] uppercase tracking-widest font-black hover:bg-neutral-900 hover:text-white transition-all"
                    >
                      Déconnexion
                    </button>
                  </div>

                  {/* NOTIFICATIONS SETUP PANEL */}
                  <div id="notifications-setup-card" className="bg-white border-2 border-[#1a1a1a] p-6 shadow-[5px_5px_0px_#1a1a1a] space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a] flex items-center gap-1.5 border-b pb-2">
                      <Bell size={13} className="text-[#b91c1c]" />
                      S'abonner aux Notifications Instantanées (Push)
                    </h3>
                    
                    <p className="text-xs text-[#6b6b6b] leading-relaxed font-serif">
                      Configurez précisément quelles alertes de publication vous souhaitez recevoir de manière exclusive sur votre appareil ou votre navigateur web en direct.
                    </p>

                    {/* Browser Status Info */}
                    <div className="bg-[#fafaf9] p-3 text-xs border border-[#e5e5e2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-stone-700">Autorisation système : </span>
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${browserPermission === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {browserPermission === 'granted' ? 'Activé' : browserPermission === 'denied' ? 'Refusé' : 'Non configuré'}
                        </span>
                      </div>
                      
                      {browserPermission !== 'granted' && (
                        <button 
                          id="btn-request-browser-push"
                          onClick={requestBrowserNotificationPermission}
                          className="px-3 py-1 bg-white hover:bg-neutral-100 border border-[#1a1a1a] text-[9px] font-black uppercase tracking-widest transition"
                        >
                          Autoriser sur l'appareil
                        </button>
                      )}
                    </div>

                    {/* Custom toggle list */}
                    <div className="space-y-2.5 pt-2">
                      <label id="pref-art-label" className="flex items-center gap-3 cursor-pointer">
                        <input 
                          id="pref-art-checkbox"
                          type="checkbox"
                          checked={notifPreferences.articles}
                          onChange={(e) => savePreferences({ ...notifPreferences, articles: e.target.checked })}
                          className="rounded border-[#1a1a1a] focus:ring-0 text-[#1a1a1a] h-4 w-4"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-stone-900 block">Nouvel article publié</span>
                          <span className="text-[10px] text-neutral-500 font-serif">Alerte lors des parutions de grands dossiers, documentaires d'enquête territoriaux ou chroniques.</span>
                        </div>
                      </label>

                      <label id="pref-pod-label" className="flex items-center gap-3 cursor-pointer">
                        <input 
                          id="pref-pod-checkbox"
                          type="checkbox"
                          checked={notifPreferences.podcasts}
                          onChange={(e) => savePreferences({ ...notifPreferences, podcasts: e.target.checked })}
                          className="rounded border-[#1a1a1a] focus:ring-0 text-[#1a1a1a] h-4 w-4"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-stone-900 block">Nouveau podcast disponible</span>
                          <span className="text-[10px] text-neutral-500 font-serif">Notification dès qu'un nouvel audio enregistré est disponible à l'écoute déportée.</span>
                        </div>
                      </label>

                      <label id="pref-live-label" className="flex items-center gap-3 cursor-pointer">
                        <input 
                          id="pref-live-checkbox"
                          type="checkbox"
                          checked={notifPreferences.live}
                          onChange={(e) => savePreferences({ ...notifPreferences, live: e.target.checked })}
                          className="rounded border-[#1a1a1a] focus:ring-0 text-[#1a1a1a] h-4 w-4"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-stone-900 block">Direct (Podcast Live) imminent</span>
                          <span className="text-[10px] text-neutral-500 font-serif">Informer immédiatement dès que le direct s'allume pour me brancher avec la journaliste.</span>
                        </div>
                      </label>
                    </div>

                  </div>

                  {/* FAVORITES LIST */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a] border-b pb-2 font-mono">
                      {t.member.favoriteArticles}
                    </h3>
                    {favorites.length === 0 ? (
                      <p className="text-xs text-[#6b6b6b] italic font-serif">{t.member.noFavorites}</p>
                    ) : (
                      <div id="favorites-grid-panel" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favorites.map((fav) => (
                          <div 
                            key={fav.id} 
                            id={`fav-card-${fav.id}`}
                            onClick={() => selectArticle(fav)}
                            className="bg-white border p-3 flex justify-between items-center cursor-pointer hover:border-black transition"
                          >
                            <div className="min-w-0">
                              <span className="text-[8px] font-bold text-[#b91c1c] block font-mono uppercase">{fav.category}</span>
                              <h4 className="font-serif font-black text-xs text-black leading-snug truncate">{lang === 'fr' ? fav.titleFr : fav.titleEn}</h4>
                              <span className="text-[8px] text-neutral-400 font-mono">{fav.date}</span>
                            </div>
                            <button 
                              id={`remove-fav-btn-${fav.id}`}
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(fav.id); }}
                              className="text-[#6b6b6b] hover:text-red-600 pl-2 transition"
                              title="Retirer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* CONTACT TAB */}
          {currentTab === 'contact' && (
            <div id="tab-contact-mailbox" className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-2xl font-serif font-black text-black mb-2">{t.contact.title}</h1>
                <p className="text-xs text-[#6b6b6b] font-serif italic max-w-lg leading-relaxed">
                  {t.contact.subtitle}
                </p>
              </div>

              <form id="contact-secure-form" onSubmit={handleContactSubmit} className="max-w-lg space-y-4 bg-white border p-6 border-[#e5e5e2]">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#1a1a1a]">{t.contact.name}</label>
                  <input 
                    id="contact-name-input"
                    type="text" 
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-[#f0f0ee] border border-[#e5e5e2] text-xs py-2 px-3 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-widest text-[#1a1a1a]">{t.contact.email}</label>
                    <input 
                      id="contact-email-input"
                      type="email" 
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full bg-[#f0f0ee] border border-[#e5e5e2] text-xs py-2 px-3 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-widest text-[#1a1a1a]">{t.contact.subject}</label>
                    <input 
                      id="contact-subject-input"
                      type="text" 
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full bg-[#f0f0ee] border border-[#e5e5e2] text-xs py-2 px-3 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#1a1a1a]">{t.contact.message}</label>
                  <textarea 
                    id="contact-message-input"
                    rows={5} 
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full bg-[#f0f0ee] border border-[#e5e5e2] text-xs py-2 px-3 focus:outline-none"
                  />
                </div>

                <button 
                  id="contact-submit-btn"
                  type="submit"
                  className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#b91c1c] text-white text-[11px] font-black uppercase tracking-widest transition"
                >
                  {t.contact.sendBtn}
                </button>
              </form>
            </div>
          )}

          {/* ADMIN ACTION PANEL TAB */}
          {currentTab === 'admin' && currentUser?.role === 'admin' && (
            <div id="tab-admin-console" className="space-y-8 animate-fade-in text-left">
              <h1 className="text-2xl font-serif font-black text-[#1a1a1a] border-b pb-3 flex items-center gap-2">
                <ShieldAlert className="text-[#b91c1c]" />
                Poste de Commande Éditoriale (Admin)
              </h1>

              {/* Grid block for quick stats */}
              <div id="admin-summary-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border p-3">
                  <span className="text-[9px] font-black text-[#6b6b6b] block uppercase">Gros dossiers</span>
                  <span className="text-xl font-bold font-mono">{articles.length}</span>
                </div>
                <div className="bg-white border p-3">
                  <span className="text-[9px] font-black text-[#6b6b6b] block uppercase">Brèves d'info</span>
                  <span className="text-xl font-bold font-mono">{newsList.length}</span>
                </div>
                <div className="bg-[#1a1a1a] text-white border p-3">
                  <span className="text-[9px] font-black text-[#a1a1a1] block uppercase">Émissions</span>
                  <span className="text-xl font-bold font-mono text-[#b91c1c]">{podcasts.length}</span>
                </div>
                <div className="bg-white border p-3">
                  <span className="text-[9px] font-black text-[#6b6b6b] block uppercase">Total vues</span>
                  <span className="text-xl font-bold font-mono">{articles.reduce((acc, a) => acc + (a.views || 0), 0)}</span>
                </div>
              </div>

              {/* Live Session Controls Section */}
              <div className="bg-amber-50/10 border-2 border-[#1a1a1a] p-4 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a] flex items-center gap-1.5 border-b pb-2">
                  <Radio size={13} className="text-[#b91c1c]" />
                  Gestion de l'Antenne (Podcast Live)
                </h3>
                {liveSessions.map((session) => (
                  <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white border">
                    <div>
                      <span className="text-[9px] font-mono text-[#6b6b6b] block">{session.date} - {session.time}</span>
                      <h4 className="font-serif font-bold text-xs text-black">{session.titleFr}</h4>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wider ${session.status === 'live' ? 'bg-red-100 text-red-800' : 'bg-stone-100 text-stone-800'}`}>
                        {session.status}
                      </span>
                    </div>
                    <button 
                      id={`toggle-live-status-${session.id}`}
                      onClick={() => toggleLiveStatus(session.id, session.status)}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition ${session.status === 'live' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#1a1a1a] text-white hover:bg-[#b91c1c]'}`}
                    >
                      {session.status === 'live' ? 'Arrêter le direct' : 'Prendre l\'antenne (Direct)'}
                    </button>
                  </div>
                ))}
              </div>

              {/* CRUD Articles publishing section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a] border-b pb-1 flex items-center gap-1.5">
                  <Plus size={13} />
                  Publier une nouvelle enquête (et envoyer un Push)
                </h3>
                <form id="admin-article-form" onSubmit={adminAddArticle} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Titre (FR)</label>
                    <input 
                      id="admin-art-title-fr"
                      type="text" required value={artForm.titleFr} 
                      onChange={(e) => setArtForm({ ...artForm, titleFr: e.target.value })}
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Titre (EN)</label>
                    <input 
                      id="admin-art-title-en"
                      type="text" required value={artForm.titleEn} 
                      onChange={(e) => setArtForm({ ...artForm, titleEn: e.target.value })}
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-1 sm:col-span-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Contenu (FR)</label>
                    <textarea 
                      id="admin-art-content-fr"
                      rows={4} required value={artForm.contentFr} 
                      onChange={(e) => setArtForm({ ...artForm, contentFr: e.target.value })}
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none font-serif"
                    />
                  </div>
                  <div className="space-y-1 col-span-1 sm:col-span-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Contenu (EN)</label>
                    <textarea 
                      id="admin-art-content-en"
                      rows={4} required value={artForm.contentEn} 
                      onChange={(e) => setArtForm({ ...artForm, contentEn: e.target.value })}
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none font-serif"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Catégorie</label>
                    <select 
                      id="admin-art-category"
                      value={artForm.category} 
                      onChange={(e) => setArtForm({ ...artForm, category: e.target.value })}
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                    >
                      <option value="Réseaux Sociaux">Réseaux Sociaux</option>
                      <option value="Fact-checking">Fact-checking</option>
                      <option value="Culture & Société">Culture & Société</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-1 sm:col-span-2 border border-neutral-200 p-4 bg-white shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a] block mb-1">Visuel de l'enquête</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Option A : Saisir l'adresse URL</label>
                        <input 
                          id="admin-art-image"
                          type="text" value={artForm.image} 
                          onChange={(e) => setArtForm({ ...artForm, image: e.target.value })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Option B : Importer un fichier image</label>
                        <div className="relative border border-dashed border-neutral-300 hover:border-[#b91c1c] transition p-2 text-center bg-stone-50 cursor-pointer min-h-[38px] flex items-center justify-center">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, 'article-image')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <span className="text-[10px] text-neutral-600 truncate px-2">
                            {artForm.image && artForm.image.startsWith('data:') ? '✓ Image sélectionnée' : 'Sélectionner une photo...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {artForm.image && (
                      <div className="mt-2 flex items-center gap-2 bg-[#f0f0ee] p-2">
                        <img src={artForm.image} className="h-8 w-8 object-cover shadow" alt="Aperçu" />
                        <div className="text-[9px] font-mono text-stone-600 truncate flex-1">
                          Image chargée : {artForm.image.startsWith('data:') ? `Fichier Base64 (${Math.round(artForm.image.length / 1024)} KB)` : artForm.image}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setArtForm(p => ({ ...p, image: '' }))}
                          className="text-[9px] text-[#b91c1c] uppercase font-bold hover:underline"
                        >
                          Effacer
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 sm:col-span-2 pt-2">
                    <button 
                      id="admin-art-submit"
                      type="submit" 
                      className="px-5 py-2 bg-[#b91c1c] text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      Propager sur le fil d'actualités et notifier
                    </button>
                  </div>
                </form>
              </div>

              {/* CRUD Podcasts publishing section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a] border-b pb-1 flex items-center gap-1.5">
                  <Plus size={13} />
                  Téléverser un Épisode de Podcast (Simulé)
                </h3>
                <form id="admin-podcast-form" onSubmit={adminAddPodcast} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Titre (FR)</label>
                    <input 
                      id="admin-pod-title-fr"
                      type="text" required value={podForm.titleFr} 
                      onChange={(e) => setPodForm({ ...podForm, titleFr: e.target.value })}
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2 col-span-1 sm:col-span-2 border border-neutral-200 p-4 bg-white shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a] block mb-1">Fichier Audio de l'Épisode</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Option A : Saisir l'adresse URL de l'audio</label>
                        <input 
                          id="admin-pod-audiourl"
                          type="text" value={podForm.audioUrl} 
                          onChange={(e) => setPodForm({ ...podForm, audioUrl: e.target.value })}
                          placeholder="https://www.soundhelix.com/mp3..."
                          className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Option B : Importer un fichier audio</label>
                        <div className="relative border border-dashed border-neutral-300 hover:border-[#b91c1c] transition p-2 text-center bg-stone-50 cursor-pointer min-h-[38px] flex items-center justify-center">
                          <input 
                            type="file" 
                            accept="audio/*" 
                            onChange={(e) => handleFileUpload(e, 'podcast-audio')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <span className="text-[10px] text-neutral-600 truncate px-2">
                            {podForm.audioUrl && podForm.audioUrl.startsWith('data:') ? '✓ Audio sélectionné !' : 'Sélectionner un fichier audio...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {podForm.audioUrl && (
                      <div className="mt-2 flex items-center justify-between bg-[#f0f0ee] p-2 text-[9px]">
                        <div className="font-mono text-stone-600 truncate flex-1">
                          Audio chargé : {podForm.audioUrl.startsWith('data:') ? `Fichier Audio (${Math.round(podForm.audioUrl.length /  1024)} KB)` : podForm.audioUrl}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setPodForm(p => ({ ...p, audioUrl: '' }))}
                          className="text-[#b91c1c] uppercase font-bold hover:underline ml-2"
                        >
                          Effacer
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 col-span-1 sm:col-span-2 border border-neutral-200 p-4 bg-white shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a] block mb-1">Image de Couverture (Optionnel)</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Option A : Saisir l'adresse URL de l'image</label>
                        <input 
                          id="admin-pod-imageurl"
                          type="text" value={podForm.imageUrl} 
                          onChange={(e) => setPodForm({ ...podForm, imageUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Option B : Importer une image</label>
                        <div className="relative border border-dashed border-neutral-300 hover:border-[#b91c1c] transition p-2 text-center bg-stone-50 cursor-pointer min-h-[38px] flex items-center justify-center">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, 'podcast-image')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <span className="text-[10px] text-neutral-600 truncate px-2">
                            {podForm.imageUrl && podForm.imageUrl.startsWith('data:') ? '✓ Couverture sélectionnée' : 'Sélectionner un visuel de couverture...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {podForm.imageUrl && (
                      <div className="mt-2 flex items-center gap-2 bg-[#f0f0ee] p-2">
                        <img src={podForm.imageUrl} className="h-8 w-8 object-cover shadow" alt="Aperçu couverture" />
                        <div className="text-[9px] font-mono text-stone-600 truncate flex-1">
                          Couverture chargée : {podForm.imageUrl.startsWith('data:') ? `Fichier Image (${Math.round(podForm.imageUrl.length / 1024)} KB)` : podForm.imageUrl}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setPodForm(p => ({ ...p, imageUrl: '' }))}
                          className="text-[9px] text-[#b91c1c] uppercase font-bold hover:underline"
                        >
                          Effacer
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Description (FR)</label>
                    <textarea 
                      id="admin-pod-desc-fr"
                      rows={2} required value={podForm.descriptionFr} 
                      onChange={(e) => setPodForm({ ...podForm, descriptionFr: e.target.value })}
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Invités (Séparez par virgules)</label>
                    <input 
                      id="admin-pod-guests"
                      type="text" value={podForm.guests} 
                      onChange={(e) => setPodForm({ ...podForm, guests: e.target.value })}
                      placeholder="Pr. Paul, Marie Durand"
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Durée</label>
                    <input 
                      id="admin-pod-duration"
                      type="text" value={podForm.duration} 
                      onChange={(e) => setPodForm({ ...podForm, duration: e.target.value })}
                      placeholder="45:20"
                      className="w-full bg-[#f0f0ee] border text-xs p-2 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 pt-2">
                    <button 
                      id="admin-pod-submit"
                      type="submit" 
                      className="px-5 py-2 bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#b91c1c]"
                    >
                      Ajouter aux podcasts & Notifier
                    </button>
                  </div>
                </form>
              </div>

              {/* Contacts messages lists */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1a1a1a] border-b pb-1">
                  Messages de contact reçus ({contacts.length})
                </h3>
                <div id="admin-contacts-list" className="space-y-3">
                  {contacts.map((msg) => (
                    <div key={msg.id} id={`contact-msg-${msg.id}`} className={`p-4 border text-xs ${msg.read ? 'bg-white border-[#e5e5e2]' : 'bg-stone-100 border-[#1a1a1a] font-bold'}`}>
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-[#b91c1c]">{msg.name} ({msg.email})</span>
                        <span className="text-neutral-400 font-mono">{new Date(msg.date).toLocaleString()}</span>
                      </div>
                      <h4 className="text-stone-900 font-bold mt-1">Sujet : {msg.subject}</h4>
                      <p className="text-[#4a4a4a] leading-relaxed mt-2 font-serif">{msg.message}</p>
                      {!msg.read && (
                        <button 
                          id={`btn-read-msg-${msg.id}`}
                          onClick={() => readContact(msg.id)}
                          className="mt-2 text-[9px] font-bold uppercase underline hover:text-[#b91c1c]"
                        >
                          Marquer lu
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </section>

        {/* RIGHT COLUMN: NEWS WIRE SUMMARY & NEWSLETTER FORM */}
        <section id="sidebar-right" className="col-span-3 p-6 hidden lg:flex flex-col overflow-y-auto">
          
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a] mb-4 font-mono">
              {t.home.latestNews}
            </h3>
            <div id="sidebar-news-wire" className="flex flex-col gap-4">
              {newsList.slice(0, 3).map((item) => (
                <div key={item.id} className="pb-3 border-b border-[#e5e5e2] text-left">
                  <span className="text-[9px] font-mono text-[#6b6b6b]">Le {new Date(item.date).toLocaleDateString()}</span>
                  <p className="text-xs font-serif font-bold text-stone-900 leading-snug mt-1 line-clamp-2">{lang === 'fr' ? item.titleFr : item.titleEn}</p>
                  <p className="text-[10px] text-neutral-500 leading-normal line-clamp-2 mt-0.5">{lang === 'fr' ? item.contentFr : item.contentEn}</p>
                </div>
              ))}
            </div>
            <button 
              id="view-all-news-sidebar"
              onClick={() => setCurrentTab('news')} 
              className="text-[9px] font-black uppercase tracking-widest underline text-neutral-500 hover:text-black mt-3 block"
            >
              Consulter le fil d'actualités complet →
            </button>
          </div>

          <div className="mt-auto">
            <div className="bg-[#1a1a1a] text-white p-5 text-left border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#b91c1c]">
              <h4 className="text-sm font-serif font-black italic text-stone-100 mb-2">{t.home.newsletterTitle}</h4>
              <p className="text-[10px] leading-relaxed text-[#a1a1a1] mb-4 uppercase tracking-wider font-mono">
                {t.home.newsletterSubtitle}
              </p>
              <form 
                id="newsletter-sidebar-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  showAlert(t.home.newsletterSuccess);
                  (e.target as HTMLFormElement).reset();
                }} 
                className="flex flex-col gap-2"
              >
                <input 
                  id="newsletter-input"
                  type="email" 
                  required
                  placeholder="votre_email@journalisme.fr" 
                  className="bg-transparent border-b border-white/50 text-xs py-1.5 focus:outline-none placeholder:text-stone-600 text-stone-200"
                />
                <button 
                  id="newsletter-submit"
                  type="submit"
                  className="text-[10px] font-black text-white hover:text-[#b91c1c] uppercase text-left mt-2 flex items-center gap-1.5 transition-transform hover:translate-x-1"
                >
                  → {t.home.newsletterBtn}
                </button>
              </form>
            </div>
          </div>

        </section>

      </main>

      {/* AUDIO PLAYER ZONE */}
      {activeEpisode && (
        <AudioPlayer 
          episode={activeEpisode} 
          onClose={() => setActiveEpisode(null)} 
        />
      )}

    </div>
  );
}
