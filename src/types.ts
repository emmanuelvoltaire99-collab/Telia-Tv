/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Shared types for full-stack platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  registeredAt: string;
  avatarUrl?: string;
  bio?: string;
}

export interface Article {
  id: string;
  titleFr: string;
  titleEn: string;
  contentFr: string;
  contentEn: string;
  category: string; // e.g. 'Geopolitics', 'Culture', 'Economy', 'Science'
  image: string;
  author: string;
  date: string;
  readTime: number; // in minutes
  published: boolean;
  views: number;
}

export interface News {
  id: string;
  titleFr: string;
  titleEn: string;
  contentFr: string;
  contentEn: string;
  date: string;
  published: boolean;
}

export interface PodcastEpisode {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  audioUrl: string;
  imageUrl: string;
  guests: string[];
  duration: string; // e.g. "45:30"
  date: string;
  published: boolean;
}

export interface LiveSession {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'ended';
  audioUrl?: string; // empty means simulate mic feed
}

export interface LiveMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'member';
  message: string;
  timestamp: string;
  isQuestion?: boolean;
}

export interface Comment {
  id: string;
  targetId: string; // articleId or podcastId
  targetType: 'article' | 'podcast';
  userId: string;
  userName: string;
  content: string;
  date: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

// Translations interface for client app
export interface TranslationSchema {
  nav: {
    home: string;
    about: string;
    articles: string;
    news: string;
    podcasts: string;
    live: string;
    member: string;
    contact: string;
    admin: string;
    logout: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroBtn: string;
    readMore: string;
    latestArticles: string;
    latestNews: string;
    latestPodcasts: string;
    aboutBriefTitle: string;
    aboutBriefText: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    newsletterBtn: string;
    newsletterSuccess: string;
  };
  about: {
    title: string;
    bioTitle: string;
    bioText: string;
    careerTitle: string;
    expertiseTitle: string;
  };
  articles: {
    title: string;
    searchPlaceholder: string;
    categoriesAll: string;
    noArticles: string;
    minutes: string;
    readArticle: string;
  };
  news: {
    title: string;
    noNews: string;
  };
  podcasts: {
    title: string;
    duration: string;
    guests: string;
    noPodcasts: string;
  };
  live: {
    title: string;
    statusLive: string;
    statusUpcoming: string;
    statusEnded: string;
    chatTitle: string;
    chatPlaceholder: string;
    sendBtn: string;
    listenersCount: string;
    askQuestionLabel: string;
    questionModeHint: string;
    noLiveSessions: string;
  };
  member: {
    loginTitle: string;
    signUpTitle: string;
    email: string;
    password: string;
    name: string;
    loginBtn: string;
    signUpBtn: string;
    noAccount: string;
    alreadyAccount: string;
    profileTitle: string;
    favoriteArticles: string;
    noFavorites: string;
  };
  contact: {
    title: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    sendBtn: string;
    success: string;
    subtitle: string;
  };
}
