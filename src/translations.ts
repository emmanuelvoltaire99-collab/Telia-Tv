/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TranslationSchema } from './types.ts';

export const translations: Record<'fr' | 'en', TranslationSchema> = {
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      articles: "Articles",
      news: "Brèves",
      podcasts: "Podcasts",
      live: "Direct",
      member: "Mon Espace",
      contact: "Contact",
      admin: "Admin",
      logout: "Déconnexion"
    },
    home: {
      heroTitle: "L'analyse au-delà de l'actualité immédiate",
      heroSubtitle: "Décrypter la géopolitique, l'économie mondiale et les transitions technologiques à travers des enquêtes rigoureuses et des entretiens exclusifs.",
      heroBtn: "Explorer les dossiers",
      readMore: "Lire la suite",
      latestArticles: "Dossiers & Enquêtes récents",
      latestNews: "Fil d'actualité en continu",
      latestPodcasts: "Derniers Émissions & Entretiens",
      aboutBriefTitle: "Qui est votre hôte ?",
      aboutBriefText: "Mangwa Thérèse est une journaliste, rédactrice et reporter multimédia diplômée en Journalisme et Communication. Passionnée par l'information éthique, elle met son talent au service du public et de la promotion des initiatives de développement de Telia Tv.",
      newsletterTitle: "Restez informé(e)",
      newsletterSubtitle: "Recevez nos analyses, reportages et alertes de diffusion en direct de Telia Tv dans votre boîte mail.",
      newsletterBtn: "Inscrivez-vous gratuitement",
      newsletterSuccess: "Merci de votre inscription à l'infolettre !"
    },
    about: {
      title: "À propos de Mangwa Thérèse",
      bioTitle: "Biographie & Engagement",
      bioText: "Diplômée en Journalisme et Communication, Mangwa Thérèse est une jeune professionnelle passionnée par la collecte, le traitement et la diffusion de l'information. Rigoureuse, dynamique et dotée d'un excellent sens relationnel, elle possède des compétences éprouvées en rédaction journalistique, reportage, interview, production de contenus numériques et communication médiatique. Ses formations en journalisme lui ont permis de développer de solides capacités de recherche, d'analyse, de vérification des faits (fact-checking) et de production de contenus multimédias d'excellence pour la presse écrite, la radio, la télévision et les supports Web.",
      careerTitle: "Parcours Professionnel",
      expertiseTitle: "Domaines de compétences"
    },
    articles: {
      title: "Articles, Analyses & Grands Dossiers",
      searchPlaceholder: "Rechercher par mot-clé...",
      categoriesAll: "Toutes les catégories",
      noArticles: "Aucun article trouvé correspondant à vos critères.",
      minutes: "min de lecture",
      readArticle: "Explorer l'article"
    },
    news: {
      title: "Fil d'actualité en direct (Brèves)",
      noNews: "Aucune actualité publiée pour le moment."
    },
    podcasts: {
      title: "Émissions Audio & Entretiens",
      duration: "Durée",
      guests: "Invités",
      noPodcasts: "Aucune émission audio disponible actuellement."
    },
    live: {
      title: "Émission & Podcast en Direct",
      statusLive: "EN DIRECT",
      statusUpcoming: "À VENIR",
      statusEnded: "DIFFUSION TERMINÉE",
      chatTitle: "Salon communautaire",
      chatPlaceholder: "Écrire un message ou poser une question...",
      sendBtn: "Envoyer",
      listenersCount: "auditeurs connectés",
      askQuestionLabel: "? Poser comme question",
      questionModeHint: "Cochez pour soumettre comme question à la journaliste",
      noLiveSessions: "Aucune émission en direct programmée."
    },
    member: {
      loginTitle: "Se connecter",
      signUpTitle: "Créer un compte membre",
      email: "Adresse e-mail",
      password: "Mot de passe",
      name: "Nom complet",
      loginBtn: "Connexion",
      signUpBtn: "Création de compte",
      noAccount: "Vous n'avez pas de compte ? S'inscrire",
      alreadyAccount: "Déjà un compte ? Se connecter",
      profileTitle: "Mon Compte Membre",
      favoriteArticles: "Mes Articles Favoris",
      noFavorites: "Vous n'avez pas encore sauvegardé d'articles."
    },
    contact: {
      title: "Contact & Propositions éditoriales",
      subtitle: "Pour toute commande média, proposition d'entretien ou signalement d'information confidentielle, utilisez ce formulaire sécurisé.",
      name: "Nom ou Organisation",
      email: "Adresse e-mail",
      subject: "Sujet",
      message: "Message",
      sendBtn: "Transmettre le message",
      success: "Votre message a bien été envoyé. Merci pour votre intérêt."
    }
  },
  en: {
    nav: {
      home: "Home",
      about: "About",
      articles: "Articles",
      news: "News Wire",
      podcasts: "Podcasts",
      live: "Live Broadcast",
      member: "Member Space",
      contact: "Contact",
      admin: "Admin",
      logout: "Log Out"
    },
    home: {
      heroTitle: "Analysis beyond the immediate news cycle",
      heroSubtitle: "Decrypting global geopolitics, world economy, and technological transitions through rigorous investigations and exclusive interviews.",
      heroBtn: "Explore investigations",
      readMore: "Read more",
      latestArticles: "Recent Deep-Dives",
      latestNews: "Continuous News Wire",
      latestPodcasts: "Latest Broadcasts & Interviews",
      aboutBriefTitle: "Meet Mangwa Thérèse",
      aboutBriefText: "Mangwa Thérèse is a passionate journalist, editor, and multimedia reporter with a degree in Journalism and Communication. Dedicated to public-interest reporting and ethical journalism, she highlights local development initiatives on Telia Tv.",
      newsletterTitle: "Stay Informed",
      newsletterSubtitle: "Receive our latest reports, analysis, and live broadcast notifications from Telia Tv directly in your inbox.",
      newsletterBtn: "Register for free",
      newsletterSuccess: "Thank you for registering to our newsletter!"
    },
    about: {
      title: "About Mangwa Thérèse",
      bioTitle: "Biography & Mission",
      bioText: "Holding a degree in Journalism and Communication, Mangwa Thérèse is a dynamic, highly motivated professional passionate about collecting, processing, and distributing high-quality reliable news. Gifted with superb interpersonal skills, she excels in investigative journalism, reporting, interviews, digital content production, and media communications. Her academic and practical background has fostered robust abilities in scientific research, critical analysis, rigorous fact-checking, and polished multi-platform media delivery across print, radio, TV, and modern digital outlets.",
      careerTitle: "Professional Journey",
      expertiseTitle: "Key Areas of Expertise"
    },
    articles: {
      title: "Articles, Analyses & Longforms",
      searchPlaceholder: "Search by keyword...",
      categoriesAll: "All Categories",
      noArticles: "No articles found matching your criteria.",
      minutes: "min read",
      readArticle: "Read full article"
    },
    news: {
      title: "Continuous Breaking Feed",
      noNews: "No short news updates posted yet."
    },
    podcasts: {
      title: "Audio Shows & Podcasts",
      duration: "Duration",
      guests: "Guests",
      noPodcasts: "No podcast episodes currently available."
    },
    live: {
      title: "Live Show & Broadcast Room",
      statusLive: "LIVE BROADCAST",
      statusUpcoming: "COMING SOON",
      statusEnded: "BROADCAST ENDED",
      chatTitle: "Community Chatroom",
      chatPlaceholder: "Type a message or raise a question...",
      sendBtn: "Send",
      listenersCount: "listeners online",
      askQuestionLabel: "? Send as question",
      questionModeHint: "Check to submit as questions for the Q&A segment",
      noLiveSessions: "No live broadcasts scheduled."
    },
    member: {
      loginTitle: "Log In",
      signUpTitle: "Register Member Account",
      email: "Email Address",
      password: "Password",
      name: "Full Name",
      loginBtn: "Sign In",
      signUpBtn: "Create Account",
      noAccount: "Don't have an account? Sign up",
      alreadyAccount: "Already registered? Sign in",
      profileTitle: "Member Workspace",
      favoriteArticles: "My Bookmarked Articles",
      noFavorites: "You haven't bookmarked any articles yet."
    },
    contact: {
      title: "Contact & Editorial Leads",
      subtitle: "For media commission requests, interview updates, or secure editorial leaks, please use this form.",
      name: "Name or Organization",
      email: "Email Address",
      subject: "Subject",
      message: "Message",
      sendBtn: "Submit confidential message",
      success: "Your message has been safely delivered. Thank you."
    }
  }
};
