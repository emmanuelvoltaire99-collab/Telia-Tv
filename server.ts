/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { 
  User, 
  Article, 
  News, 
  PodcastEpisode, 
  LiveSession, 
  LiveMessage, 
  Comment, 
  ContactMessage 
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'datastore.json');

// --- DATABASE MANAGER ---
interface DatabaseSchema {
  users: User[];
  articles: Article[];
  newsList: News[];
  podcasts: PodcastEpisode[];
  liveSessions: LiveSession[];
  liveMessages: LiveMessage[];
  comments: Comment[];
  contacts: ContactMessage[];
  favorites: Record<string, string[]>; // userId -> articleId[]
}

const defaultDb: DatabaseSchema = {
  users: [
    {
      id: "admin-1",
      email: "therese.mangwa@teliatv.com",
      name: "Mangwa Thérèse",
      role: "admin",
      registeredAt: new Date().toISOString(),
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      bio: "Journaliste | Rédactrice | Reporter Multimédia. Diplômée en Journalisme et Communication, passionnée par la collecte, le traitement et la diffusion de l'information de proximité africaine."
    },
    {
      id: "member-demo",
      email: "membre@demo.fr",
      name: "Jean Dupont",
      role: "member",
      registeredAt: new Date().toISOString(),
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
    }
  ],
  articles: [
    {
      id: "art-1",
      titleFr: "La guerre des puces : course technologique au cœur de la Mer de Chine septentrionale",
      titleEn: "The Chip War: Technological Race at the Core of the Northern China Sea",
      contentFr: "La domination mondiale de l'industrie des semi-conducteurs s'est déplacée d'un enjeu purement industriel vers une guerre froide de souveraineté technologique majeure.\n\n### Les fonderies de l'extrême\n\nÀ elle seule, l'ile de Taïwan cristallise plus de 60% de la production de puces de calcul avancées dans le monde. C'est à Hsinchu, au sein d'unités de production hautement protégées, que s'organise l'approvisionnement des géants de l'IA et de la tech mondiale. Cette dépendance physique engendre une fragilité logistique et militaire sans précédent historique.\n\n### La réaction américaine et européenne\n\nLes législateurs occidentaux tentent frénétiquement de relocaliser ces capacités via le *Chips Act*. Des centaines de milliards de dollars de subventions sont débloqués pour créer de nouvelles usines à Dresde ou en Arizona. Mais former des ingénieurs d'une telle spécialité requiert des décennies de savoir-faire complexe. Pendant ce temps, la Chine accélère massivement sa production de puces de génération intermédiaire, asphyxiant la concurrence par des prix de dumping.\n\n### Enjeux géopolitiques\n\nLe risque d'un blocus naval redéfinit l'art de la guerre technologique. La dissuasion nucleaire classique fait maintenant face à la 'dissuasion de silicone' : aucun bloc ne peut se permettre la destruction physique de ces usines sans paralyser instantanément sa propre économie de défense.",
      contentEn: "The global dominance of the semiconductor industry has shifted from a purely manufacturing concern to a major cold war of technology sovereignty.\n\n### High-Tech Foundries\n\nThe island of Taiwan alone crystallizes more than 60% of the world's advanced chip manufacturing. In Hsinchu, inside highly guarded fabrication units, the supply chains for AI networks and hardware giants are concentrated. This physical concentration generates unprecedented geopolitical and logistic fragility.\n\n### Western Countermeasures\n\nWestern lawmakers are frantically trying to nearshore these capabilities via the *Chips Act*. Hundreds of billions of dollars in subsidies are poured into building new automated gigafabs in Arizona and Dresden. However, training cleanroom engineers with such deep specialization takes decades. Meanwhile, China is subsidizing mature-node generation microchips, exerting high economic pressure.\n\n### Global Standoff\n\nThe potential risk of a naval blockade completely redefines high-tech geopolitics. Classical nuclear deterrence is now tightly coupled with 'silicon deterrence'—neither block can afford the physical loss of these fabs without instantly paralyzing their own military-industrial systems.",
      category: "Géopolitique",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
      author: "Hélène Vance",
      date: "2026-06-05",
      readTime: 6,
      published: true,
      views: 342
    },
    {
      id: "art-2",
      titleFr: "Hydrogène vert : Évangile technologique ou mirage industriel ?",
      titleEn: "Green Hydrogen: Technological Gospel or Industrial Illusion?",
      contentFr: "Annoncé comme le messie de la décarbonation, l'hydrogène produit par électrolyse de l'eau peine à s'imposer face aux réalités logistiques et physiques de son transport.\n\n### Réalités thermodynamiques\n\nL'hydrogène est la plus petite molécule de l'univers. Pour la stocker de manière exploitable, il faut soit la comprimer à 700 bars, soit la cryogéniser à -253 °C. Ces deux méthodes consomment entre 15% et 30% de l'énergie originelle de la molécule. Le rendement global de la chaîne hydrogène en prend un coup sévère comparé aux batteries solides directes.\n\n### Un gouffre financier pour nos infrastructures\n\nAdapter les réseaux de distribution de gaz fossile existants nécessite de remplacer toutes les vannes et de recouvrir l'acier pour éviter la fragilisation physique. Les coûts se chiffrent en dizaines de milliards, remettant en cause l'avantage économique initial. La filière doit urgemment cibler uniquement la décarbonation industrielle lourde (sidérurgie, engrais) plutôt que la mobilité légère.",
      contentEn: "Promoted as the savior of heavy transport decarbonization, hydrogen generated by water electrolysis struggles under the physical and thermodynamic realities of industrial logistics.\n\n### Thermodynamic Realities\n\nHydrogen is the smallest molecule in the universe. To store it effectively, it must be compressed to 700 bars or liquefied to cryogenic temperatures of -253°C. Both operations consume between 15% and 30% of the molecule's original energy content. Consequently, the total round-trip efficiency is extremely low compared to direct electrical batteries.\n\n### Capital Expenditures on National Infrastructure\n\nUpgrading existing natural gas grids demands the complete replacement of valves and specialized steel coating to prevent pipe leakage. The infrastructure bills scale into tens of billions, making heavy industry decarbonization (like steel mill processes and fertilizer refinement) the only economically viable path, while light mobility is progressively abandoned.",
      category: "Économie",
      image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
      author: "Hélène Vance",
      date: "2026-06-01",
      readTime: 4,
      published: true,
      views: 189
    },
    {
      id: "art-3",
      titleFr: "La souveraineté cognitive à l'ère de l'intelligence artificielle générative",
      titleEn: "Cognitive Sovereignty In The Era Of Large Generative Models",
      contentFr: "La dépendance académique, culturelle et linguistique envers les modèles de traitement du langage construits exclusivement en Californie remet en question la souveraineté intellectuelle de notre espace culturel.\n\n### Monopole culturel\n\nQuand un algorithme pré-distribue la vérité d'un résumé de texte à 500 millions de citoyens, il exporte discrètement sa propre grille de valeurs morales, ses biais légaux et ses préconcepts culturels. La diversité linguistique est menacée par des traductions automatisées lissant toute nuance dialectique.\n\n### Résistance ouverte\n\nDes projets de calcul alternatifs souverains naissent en Europe et en Asie pour entrainer des modèles locaux de pointe sur nos patrimoines littéraires nationaux, protégeant ainsi l'indépendance critique de la pensée occidentale.",
      contentEn: "Expanding academic, cultural, and linguistic dependence on large transformer layouts designed exclusively in foreign tech hubs raises essential questions about the intellectual sovereignty of national cultural spaces.\n\n### Ethical and Linguistic Hegemony\n\nWhen a single set of algorithms summarizes, translates, and filters content for 500 million citizens, it silently propagates localized moral frameworks, judicial preconcepts, and cultural criteria. Dynamic dialects risk being homogenized into standard translations.\n\n### Critical Counterweights\n\nAlternate scientific initiatives are emerging in Europe and Asia, deploying hyper-clusters to train local models on rich historical and linguistic bodies, securing cognitive diversity and analytical pluralism.",
      category: "Technologie",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
      author: "Hélène Vance",
      date: "2026-05-28",
      readTime: 5,
      published: true,
      views: 521
    }
  ],
  newsList: [
    {
      id: "news-1",
      titleFr: "Puces de calcul : L'Union Européenne investit 8,1 milliards d'euros supplémentaires",
      titleEn: "Semiconductor Hub: European Union invests additional €8.1 billion in fabrication",
      contentFr: "La Commission européenne vient d'approuver un projet d'intérêt européen commun (PIEC) pour soutenir la recherche et le premier déploiement industriel des micro-technologies de calcul avancées.",
      contentEn: "The European Commission has approved an Important Project of Common European Interest (IPCEI) to support research and early industrial deployment of advanced computing microtechnologies.",
      date: "2026-06-08T15:30:00Z",
      published: true
    },
    {
      id: "news-2",
      titleFr: "Climat : Records de production éolienne battus en mer du Nord",
      titleEn: "Climate: Offshore Wind generation peaks in Northern Sea",
      contentFr: "Grâce à des pressions météorologiques intenses et l'activation des nouveaux méga-parcs flottants, l'électricité éolienne a couvert près de 42% des besoins industriels côtiers hier soir.",
      contentEn: "Driven by intense atmospheric pressures and new operational deepsea floating wind turbines, wind electricity supplied over 42% of nearby industrial grids last night.",
      date: "2026-06-07T09:12:00Z",
      published: true
    },
    {
      id: "news-3",
      titleFr: "Espace : Lancement coordonné de satellites russes et militaires chinois depuis Gobi",
      titleEn: "Space: Coordinated Chinese and Russian military orbital launches from Gobi",
      contentFr: "Les lancements synchronisés confirment le rapprochement d'infrastructure stratégique de géo-positionnement autonome pour contrer l'expansion des constellations privées occidentales.",
      contentEn: "The synchronized orbital operations underscore growing tactical integration on high-latitude precision tracking webs designed to challenge private western constellation dominance.",
      date: "2026-06-06T21:44:00Z",
      published: true
    }
  ],
  podcasts: [
    {
      id: "pod-1",
      titleFr: "Épisode 24 : L'indépendance des médias face aux capitaux milliardaires",
      titleEn: "Episode 24: Media Independence Under Industrial Capital Pressure",
      descriptionFr: "Comment un journalisme d'enquête libre peut-il survivre lorsque 90% des médias nationaux sont détenus par des géants de l'armement ou de la finance ? Entretien approfondi sur l'autonomie critique.",
      descriptionEn: "How can investigative journalism remain truly free when major media outlets are owned by aerospace, military, or luxury market conglomerates? A dense discussion on financial and ethical freedom.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=400",
      guests: ["Pr. Paul de Ville", "Julia Cagé (Simulée)"],
      duration: "45:20",
      date: "2026-06-03",
      published: true
    },
    {
      id: "pod-2",
      titleFr: "Épisode 23 : Géopolitique navale - La nouvelle bataille des câbles sous-marins",
      titleEn: "Episode 23: Naval Geopolitics - The War Over Undersea Internet Cables",
      descriptionFr: "99% des communications intercontinentales transitent par des câbles sous-marins vulnérables aux sabotages et à l'espionnage. Qui contrôle ces artères névralgiques du Web mondial ?",
      descriptionEn: "99% of digital intercontinental communications run through deep-sea fibers. Exploring the espionage vulnerabilities and state-sponsored strategic battles to protect or tap these cables.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      imageUrl: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=400",
      guests: ["Amiral Éric Moreau", "Sarah Jenkins"],
      duration: "38:45",
      date: "2026-05-25",
      published: true
    }
  ],
  liveSessions: [
    {
      id: "live-session-1",
      titleFr: "Débat Spécial : Souveraineté énergétique & Décarbonation en Europe",
      titleEn: "Special Debate: Energy Sovereignty & Decarbonization in Europe",
      descriptionFr: "Analyse en direct de la relance nucléaire, du déploiement de l'hydrogène et du retour du charbon transitoire. Posez vos questions et interagissez en temps réel.",
      descriptionEn: "Live analytical discussion concerning nuclear revival blocks, grid transition issues, and temporary fossil dependencies. Submit your questions via the live panel.",
      date: "2026-06-08",
      time: "18:00",
      status: "live",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
    },
    {
      id: "live-session-2",
      titleFr: "L'Arctique à 120° : La ruée vers les nouvelles routes polaires",
      titleEn: "The Arctic Shift: Rush Towards New Polar Shipping Routes",
      descriptionFr: "Avec la fonte des glaces, les passages du Nord-Est deviennent navigables plusieurs mois par an. Quels enjeux sécuritaires pour l'OTAN et la Russie ?",
      descriptionEn: "With rapid ice shelf degradation, Northeast pathways become clear for mercantile shipping during summer. Security tensions for NATO and Russia analyzed.",
      date: "2026-06-12",
      time: "14:00",
      status: "upcoming"
    }
  ],
  liveMessages: [
    {
      id: "msg-1",
      sessionId: "live-session-1",
      userId: "member-demo",
      userName: "Jean Dupont",
      userRole: "member",
      message: "Bonsoir Hélène, d'accord sur le constat du coût de l'hydrogène, mais que pensez-vous de l'ammoniac pour le transport maritime ?",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      isQuestion: true
    },
    {
      id: "msg-2",
      sessionId: "live-session-1",
      userId: "admin-1",
      userName: "Hélène Vance",
      userRole: "admin",
      message: "Bienvenue à tous sur le direct ! Je répondrai aux questions dans la deuxième partie de l'émission. Continuez à soumettre vos questions ici.",
      timestamp: new Date(Date.now() - 150000).toISOString(),
      isQuestion: false
    }
  ],
  comments: [
    {
      id: "comm-1",
      targetId: "art-1",
      targetType: "article",
      userId: "member-demo",
      userName: "Jean Dupont",
      content: "Excellent résumé. Surtout l'importance de la silicone dissuasion. On oublie trop souvent que sans ASML en Europe ou TSMC, tout notre armement n'a plus de cerveau.",
      date: "2026-06-06T18:30:00Z"
    },
    {
      id: "comm-2",
      targetId: "pod-1",
      targetType: "podcast",
      userId: "member-demo",
      userName: "Jean Dupont",
      content: "Le passage sur l'indépendance de la presse face aux milliardaires était éclairant. Merci à vous !",
      date: "2026-06-04T10:15:00Z"
    }
  ],
  contacts: [
    {
      id: "cont-1",
      name: "Le Monde (Rédaction)",
      email: "redac@lemonde.fr",
      subject: "Proposition de tribune d'enquête",
      message: "Bonjour Hélène, nous avons lu votre analyse sur les puces de silicium en mer de Chine. Seriez-vous disponible pour adapter ce rapport sous forme de tribune libre dans nos colonnes ?",
      date: "2026-06-07T14:22:00Z",
      read: false
    }
  ],
  favorites: {
    "member-demo": ["art-1"]
  }
};

let db: DatabaseSchema = { ...defaultDb };

// Load DB from file if exists
function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('Database loaded successfully from datastore.json');
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Error loading database, using in-memory fallback:', err);
  }
}

// Save DB to file
function saveDatabase() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

loadDatabase();

// --- SERVER SETUP ---
async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API MIDDLEWARE FOR AUTHENTICATION ---
  // Simple simulator returning user based on token in 'Authorization' header
  const getAuthenticatedUser = (req: express.Request): User | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    // Find matching user with token. Token is simply 'token-userId'
    if (token.startsWith('token-')) {
      const id = token.replace('token-', '');
      const user = db.users.find(u => u.id === id);
      return user || null;
    }
    return null;
  };

  const requireAuth = (role?: 'admin' | 'member') => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ error: "Non authentifié" });
      }
      if (role && user.role !== role) {
        return res.status(403).json({ error: "Autorisation refusée" });
      }
      (req as any).user = user;
      next();
    };
  };

  // --- API ROUTES ---

  // Auth
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Données incomplètes" });
    }
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "Cet email est déjà enregistré" });
    }
    const newUser: User = {
      id: "user-" + Math.random().toString(36).substring(2, 9),
      email: email.toLowerCase(),
      name,
      role: 'member',
      registeredAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDatabase();
    res.json({ user: newUser, token: `token-${newUser.id}` });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }
    // Hardcoded simple verification mechanism
    res.json({ user, token: `token-${user.id}` });
  });

  app.get('/api/auth/profile', requireAuth(), (req, res) => {
    res.json({ user: (req as any).user });
  });

  app.put('/api/auth/profile', requireAuth(), (req, res) => {
    const { name, bio, avatarUrl } = req.body;
    const authUser = (req as any).user;
    const userIdx = db.users.findIndex(u => u.id === authUser.id);
    if (userIdx !== -1) {
      db.users[userIdx].name = name || db.users[userIdx].name;
      db.users[userIdx].bio = bio !== undefined ? bio : db.users[userIdx].bio;
      db.users[userIdx].avatarUrl = avatarUrl !== undefined ? avatarUrl : db.users[userIdx].avatarUrl;
      saveDatabase();
      return res.json({ user: db.users[userIdx] });
    }
    res.status(404).json({ error: "Profil non trouvé" });
  });

  // Articles
  app.get('/api/articles', (req, res) => {
    const user = getAuthenticatedUser(req);
    let filtered = db.articles;
    if (!user || user.role !== 'admin') {
      filtered = db.articles.filter(a => a.published);
    }
    res.json(filtered);
  });

  app.get('/api/articles/:id', (req, res) => {
    const art = db.articles.find(a => a.id === req.params.id);
    if (!art) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
    // Incremental view
    art.views = (art.views || 0) + 1;
    saveDatabase();
    res.json(art);
  });

  app.post('/api/articles', requireAuth('admin'), (req, res) => {
    const { titleFr, titleEn, contentFr, contentEn, category, image, author, readTime } = req.body;
    const newArticle: Article = {
      id: "art-" + Math.random().toString(36).substring(2, 9),
      titleFr: titleFr || "Sans titre",
      titleEn: titleEn || "Untitled",
      contentFr: contentFr || "",
      contentEn: contentEn || "",
      category: category || "Général",
      image: image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800",
      author: author || "Mangwa Thérèse",
      date: new Date().toISOString().split('T')[0],
      readTime: Number(readTime) || 3,
      published: true,
      views: 0
    };
    db.articles.unshift(newArticle);
    saveDatabase();
    
    // Broadcast real-time push notification
    io.emit('push-notification', {
      id: "notif-art-" + Math.random().toString(36).substring(2, 9),
      type: 'article',
      titleFr: "Nouvel article publié !",
      titleEn: "New article published!",
      messageFr: newArticle.titleFr,
      messageEn: newArticle.titleEn,
      itemId: newArticle.id,
      timestamp: new Date().toISOString()
    });

    res.json(newArticle);
  });

  app.put('/api/articles/:id', requireAuth('admin'), (req, res) => {
    const idx = db.articles.findIndex(a => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
    db.articles[idx] = {
      ...db.articles[idx],
      ...req.body
    };
    saveDatabase();
    res.json(db.articles[idx]);
  });

  app.delete('/api/articles/:id', requireAuth('admin'), (req, res) => {
    const idx = db.articles.findIndex(a => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
    db.articles.splice(idx, 1);
    saveDatabase();
    res.json({ success: true });
  });

  // News (Brèves)
  app.get('/api/news', (req, res) => {
    const user = getAuthenticatedUser(req);
    let filtered = db.newsList;
    if (!user || user.role !== 'admin') {
      filtered = db.newsList.filter(n => n.published);
    }
    res.json(filtered);
  });

  app.post('/api/news', requireAuth('admin'), (req, res) => {
    const { titleFr, titleEn, contentFr, contentEn } = req.body;
    const newsItem: News = {
      id: "news-" + Math.random().toString(36).substring(2, 9),
      titleFr: titleFr || "",
      titleEn: titleEn || "",
      contentFr: contentFr || "",
      contentEn: contentEn || "",
      date: new Date().toISOString(),
      published: true
    };
    db.newsList.unshift(newsItem);
    saveDatabase();
    res.json(newsItem);
  });

  app.put('/api/news/:id', requireAuth('admin'), (req, res) => {
    const idx = db.newsList.findIndex(n => n.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Brève non trouvée" });
    }
    db.newsList[idx] = {
      ...db.newsList[idx],
      ...req.body
    };
    saveDatabase();
    res.json(db.newsList[idx]);
  });

  app.delete('/api/news/:id', requireAuth('admin'), (req, res) => {
    const idx = db.newsList.findIndex(n => n.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Brève non trouvée" });
    }
    db.newsList.splice(idx, 1);
    saveDatabase();
    res.json({ success: true });
  });

  // Podcasts
  app.get('/api/podcasts', (req, res) => {
    const user = getAuthenticatedUser(req);
    let filtered = db.podcasts;
    if (!user || user.role !== 'admin') {
      filtered = db.podcasts.filter(p => p.published);
    }
    res.json(filtered);
  });

  app.post('/api/podcasts', requireAuth('admin'), (req, res) => {
    const { titleFr, titleEn, descriptionFr, descriptionEn, audioUrl, imageUrl, guests, duration } = req.body;
    const newPodcast: PodcastEpisode = {
      id: "pod-" + Math.random().toString(36).substring(2, 9),
      titleFr: titleFr || "Nouveau Podcast",
      titleEn: titleEn || "New Podcast Episode",
      descriptionFr: descriptionFr || "",
      descriptionEn: descriptionEn || "",
      audioUrl: audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=400",
      guests: guests || [],
      duration: duration || "30:00",
      date: new Date().toISOString().split('T')[0],
      published: true
    };
    db.podcasts.unshift(newPodcast);
    saveDatabase();

    // Broadcast real-time push notification
    io.emit('push-notification', {
      id: "notif-pod-" + Math.random().toString(36).substring(2, 9),
      type: 'podcast',
      titleFr: "Nouveau podcast disponible !",
      titleEn: "New podcast episode is out!",
      messageFr: newPodcast.titleFr,
      messageEn: newPodcast.titleEn,
      itemId: newPodcast.id,
      timestamp: new Date().toISOString()
    });

    res.json(newPodcast);
  });

  app.put('/api/podcasts/:id', requireAuth('admin'), (req, res) => {
    const idx = db.podcasts.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Podcast non trouvé" });
    }
    db.podcasts[idx] = {
      ...db.podcasts[idx],
      ...req.body
    };
    saveDatabase();
    res.json(db.podcasts[idx]);
  });

  app.delete('/api/podcasts/:id', requireAuth('admin'), (req, res) => {
    const idx = db.podcasts.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Podcast non trouvé" });
    }
    db.podcasts.splice(idx, 1);
    saveDatabase();
    res.json({ success: true });
  });

  // Live Sessions
  app.get('/api/live-sessions', (req, res) => {
    res.json(db.liveSessions);
  });

  app.post('/api/live-sessions', requireAuth('admin'), (req, res) => {
    const { titleFr, titleEn, descriptionFr, descriptionEn, date, time, audioUrl } = req.body;
    const newSession: LiveSession = {
      id: "live-session-" + Math.random().toString(36).substring(2, 9),
      titleFr: titleFr || "Direct",
      titleEn: titleEn || "Live",
      descriptionFr: descriptionFr || "",
      descriptionEn: descriptionEn || "",
      date: date || new Date().toISOString().split('T')[0],
      time: time || "18:00",
      status: 'upcoming',
      audioUrl
    };
    db.liveSessions.unshift(newSession);
    saveDatabase();
    res.json(newSession);
  });

  app.put('/api/live-sessions/:id', requireAuth('admin'), (req, res) => {
    const idx = db.liveSessions.findIndex(s => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Session en direct non trouvée" });
    }
    const previousStatus = db.liveSessions[idx].status;
    db.liveSessions[idx] = {
      ...db.liveSessions[idx],
      ...req.body
    };
    saveDatabase();

    // If session transitions to 'live', emit a real-time push notification
    if (req.body.status === 'live' && previousStatus !== 'live') {
      io.emit('push-notification', {
        id: "notif-live-" + Math.random().toString(36).substring(2, 9),
        type: 'live',
        titleFr: "Direct commencé !",
        titleEn: "Live Broadcast Started!",
        messageFr: `L'émission "${db.liveSessions[idx].titleFr}" commence maintenant !`,
        messageEn: `The broadcast "${db.liveSessions[idx].titleEn}" is starting right now!`,
        itemId: db.liveSessions[idx].id,
        timestamp: new Date().toISOString()
      });
    }

    // Emit session updates to WebSocket clients
    io.emit('live-session-updated', db.liveSessions[idx]);
    res.json(db.liveSessions[idx]);
  });

  // Chat/Live messages
  app.get('/api/live-sessions/:id/messages', (req, res) => {
    const messages = db.liveMessages.filter(m => m.sessionId === req.params.id);
    res.json(messages);
  });

  app.post('/api/live-sessions/:id/messages', requireAuth(), (req, res) => {
    const user = (req as any).user;
    const { message, isQuestion } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message vide" });
    }
    const newMessage: LiveMessage = {
      id: "msg-" + Math.random().toString(36).substring(2, 9),
      sessionId: req.params.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      message,
      timestamp: new Date().toISOString(),
      isQuestion: !!isQuestion
    };
    db.liveMessages.push(newMessage);
    saveDatabase();

    // Broadcast messages to clients
    io.to(req.params.id).emit('chat-message', newMessage);
    io.emit('chat-message-global', newMessage);

    res.json(newMessage);
  });

  // Comments for articles and podcasts
  app.get('/api/comments/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const comments = db.comments.filter(c => c.targetType === type && c.targetId === id);
    res.json(comments);
  });

  app.post('/api/comments/:type/:id', requireAuth(), (req, res) => {
    const user = (req as any).user;
    const { type, id } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Commentaire vide" });
    }
    const newComment: Comment = {
      id: "comm-" + Math.random().toString(36).substring(2, 9),
      targetId: id,
      targetType: type as any,
      userId: user.id,
      userName: user.name,
      content,
      date: new Date().toISOString()
    };
    db.comments.push(newComment);
    saveDatabase();
    res.json(newComment);
  });

  app.delete('/api/comments/:id', requireAuth(), (req, res) => {
    const user = (req as any).user;
    const idx = db.comments.findIndex(c => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Commentaire non trouvé" });
    }
    // Only author or admin can delete
    if (db.comments[idx].userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: "Non autorisé" });
    }
    db.comments.splice(idx, 1);
    saveDatabase();
    res.json({ success: true });
  });

  // Favorites
  app.get('/api/favorites', requireAuth(), (req, res) => {
    const user = (req as any).user;
    const favIds = db.favorites[user.id] || [];
    const favoritedArticles = db.articles.filter(a => favIds.includes(a.id));
    res.json(favoritedArticles);
  });

  app.post('/api/favorites/:articleId', requireAuth(), (req, res) => {
    const user = (req as any).user;
    const { articleId } = req.params;
    if (!db.favorites[user.id]) {
      db.favorites[user.id] = [];
    }
    if (!db.favorites[user.id].includes(articleId)) {
      db.favorites[user.id].push(articleId);
      saveDatabase();
    }
    res.json({ favorited: true, favorites: db.favorites[user.id] });
  });

  app.delete('/api/favorites/:articleId', requireAuth(), (req, res) => {
    const user = (req as any).user;
    const { articleId } = req.params;
    if (db.favorites[user.id]) {
      db.favorites[user.id] = db.favorites[user.id].filter(id => id !== articleId);
      saveDatabase();
    }
    res.json({ favorited: false, favorites: db.favorites[user.id] || [] });
  });

  // Contacts
  app.get('/api/contacts', requireAuth('admin'), (req, res) => {
    res.json(db.contacts);
  });

  app.post('/api/contacts', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }
    const newContact: ContactMessage = {
      id: "cont-" + Math.random().toString(36).substring(2, 9),
      name,
      email,
      subject,
      message,
      date: new Date().toISOString(),
      read: false
    };
    db.contacts.unshift(newContact);
    saveDatabase();
    res.json(newContact);
  });

  app.put('/api/contacts/:id/read', requireAuth('admin'), (req, res) => {
    const idx = db.contacts.findIndex(c => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Message non trouvé" });
    }
    db.contacts[idx].read = true;
    saveDatabase();
    res.json(db.contacts[idx]);
  });

  // Members lists (Admin Panel)
  app.get('/api/members', requireAuth('admin'), (req, res) => {
    const members = db.users.map(({ id, email, name, role, registeredAt, avatarUrl }) => ({
      id, email, name, role, registeredAt, avatarUrl
    }));
    res.json(members);
  });

  // Main statistics (Admin Panel Dashboard)
  app.get('/api/admin/stats', requireAuth('admin'), (req, res) => {
    const stats = {
      articlesCount: db.articles.length,
      newsCount: db.newsList.length,
      podcastsCount: db.podcasts.length,
      membersCount: db.users.filter(u => u.role === 'member').length,
      visitorsCount: db.articles.reduce((acc, a) => acc + (a.views || 0), 241),
      unreadMessagesCount: db.contacts.filter(c => !c.read).length
    };
    res.json(stats);
  });

  // --- SOCKET.IO CHAT ROOM RELATION ---
  let activeListeners: Record<string, number> = {};

  io.on('connection', (socket) => {
    console.log('Client connected to real-time events:', socket.id);

    // Join a specific live broadcast room
    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
      activeListeners[sessionId] = (activeListeners[sessionId] || 0) + 1;
      io.to(sessionId).emit('listeners-count', activeListeners[sessionId]);
      console.log(`Socket ${socket.id} joined broadcast: ${sessionId}. Listeners: ${activeListeners[sessionId]}`);
    });

    socket.on('leave-session', (sessionId) => {
      socket.leave(sessionId);
      if (activeListeners[sessionId]) {
        activeListeners[sessionId] = Math.max(0, activeListeners[sessionId] - 1);
        io.to(sessionId).emit('listeners-count', activeListeners[sessionId]);
      }
      console.log(`Socket ${socket.id} left broadcast: ${sessionId}`);
    });

    socket.on('send-reaction', ({ sessionId, reaction }) => {
      io.to(sessionId).emit('new-reaction', { reaction, id: Math.random().toString(36).substring(2, 9) });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // For simplicity, do a general sweep of listener decrease on disconnect or let clients self-regulate
    });
  });

  // --- INTEGRATION OF VITE AS MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- LISTEN ---
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Journalist server running on port ${PORT}`);
  });
}

startServer();
