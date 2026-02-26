/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  Settings,
  Plus,
  GripVertical,
  ExternalLink,
  Sparkles,
  Cpu,
  Globe,
  MessageSquare,
  Image as ImageIcon,
  Code,
  Zap,
  Moon,
  Sun,
  Palette,
  X,
  User,
  LogOut,
  Send
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './lib/supabase';

/** Utility for tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type Language = 'zh' | 'en';

interface Tool {
  id: string;
  name: string;
  description: Record<Language, string>;
  url: string;
  icon: React.ReactNode;
  category: string;
}

interface ModuleData {
  id: string;
  title: Record<Language, string>;
  type: 'grid' | 'stats' | 'featured' | 'search';
  content?: any;
}

// --- Translations ---

const TRANSLATIONS = {
  zh: {
    dashboard: '仪表盘',
    chatModels: '对话模型',
    imageGen: '图像生成',
    developer: '开发者',
    customization: '界面定制',
    searchPlaceholder: '搜索 AI 工具、模型或文档...',
    featuredTitle: '精选生态',
    directoryTitle: 'AI 目录',
    systemTitle: '系统性能',
    addTool: '添加工具',
    newRelease: '新品发布',
    nextGenNeural: '下一代神经引擎',
    nextGenDesc: '通过我们最新的分布式计算架构体验前所未有的推理速度。',
    computeHub: '计算枢纽',
    computeDesc: '管理您的 GPU 集群和推理端点。',
    globalApi: '全球 API',
    globalDesc: '全球 40 多个地区低延迟访问。',
    all: '全部',
    chat: '对话',
    creative: '创意',
    dev: '开发',
    operational: '运行正常',
    latency: '网络延迟',
    activeNodes: '活跃节点',
    dailyRequests: '每日请求',
    uptime: '运行时间',
    privacy: '隐私',
    terms: '条款',
    apiDocs: 'API 文档',
    status: '状态',
    interface: '界面设置',
    login: '登录',
    logout: '注销',
    email: '邮箱',
    password: '密码',
    chatAI: 'AI 助手',
    aiTitle: 'AI 智能助手',
    accentColor: '强调色',
    glassmorphism: '毛玻璃效果',
    displayMode: '显示模式',
    oledDark: 'OLED 深色',
    lightMode: '浅色模式',
    saveChanges: '保存更改',
    language: '语言',
    categories: '分类',
    name: '名称',
    url: '链接',
    description: '描述',
    category: '分类',
  },
  en: {
    dashboard: 'Dashboard',
    chatModels: 'Chat Models',
    imageGen: 'Image Gen',
    developer: 'Developer',
    customization: 'Customization',
    searchPlaceholder: 'Search AI tools, models, or documentation...',
    featuredTitle: 'Featured Ecosystem',
    directoryTitle: 'AI Directory',
    systemTitle: 'System Performance',
    addTool: 'Add Tool',
    newRelease: 'New Release',
    nextGenNeural: 'Next-Gen Neural Engine',
    nextGenDesc: 'Experience unprecedented inference speeds with our latest distributed computing architecture.',
    computeHub: 'Compute Hub',
    computeDesc: 'Manage your GPU clusters and inference endpoints.',
    globalApi: 'Global API',
    globalDesc: 'Low-latency access from 40+ regions worldwide.',
    all: 'All',
    chat: 'Chat',
    creative: 'Creative',
    dev: 'Dev',
    operational: 'Operational',
    latency: 'Network Latency',
    activeNodes: 'Active Nodes',
    dailyRequests: 'Daily Requests',
    uptime: 'Uptime',
    privacy: 'Privacy',
    terms: 'Terms',
    apiDocs: 'API Docs',
    status: 'Status',
    interface: 'Interface',
    login: 'Log In',
    logout: 'Log Out',
    email: 'Email',
    password: 'Password',
    chatAI: 'Chat with AI',
    aiTitle: 'AI Assistant',
    accentColor: 'Accent Color',
    glassmorphism: 'Glassmorphism',
    displayMode: 'Display Mode',
    oledDark: 'OLED Dark',
    lightMode: 'Light Mode',
    saveChanges: 'Save Changes',
    language: 'Language',
    categories: 'Categories',
    name: 'Name',
    url: 'URL',
    description: 'Description',
    category: 'Category',
  }
};

// --- Constants & Mock Data ---

const INITIAL_TOOLS: Tool[] = [
  {
    id: '1',
    name: 'ChatGPT',
    description: {
      zh: 'OpenAI 开发的先进对话式 AI',
      en: 'Advanced conversational AI by OpenAI'
    },
    url: 'https://chat.openai.com',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Chat'
  },
  {
    id: '2',
    name: 'Claude',
    description: {
      zh: 'Anthropic 开发的诚实、无害的 AI',
      en: 'Helpful, harmless, and honest AI'
    },
    url: 'https://claude.ai',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'Chat'
  },
  {
    id: '3',
    name: 'Midjourney',
    description: {
      zh: '用于生成精美图像的生成式 AI',
      en: 'Generative AI for stunning images'
    },
    url: 'https://midjourney.com',
    icon: <ImageIcon className="w-5 h-5" />,
    category: 'Image'
  },
  {
    id: '4',
    name: 'GitHub Copilot',
    description: {
      zh: '您的 AI 编程助手',
      en: 'AI pair programmer'
    },
    url: 'https://github.com/features/copilot',
    icon: <Code className="w-5 h-5" />,
    category: 'Code'
  },
  {
    id: '5',
    name: 'Perplexity',
    description: {
      zh: 'AI 驱动的问答搜索引擎',
      en: 'AI-powered search engine'
    },
    url: 'https://perplexity.ai',
    icon: <Globe className="w-5 h-5" />,
    category: 'Search'
  },
  {
    id: '6',
    name: 'Gemini',
    description: {
      zh: 'Google 最强大的 AI 模型',
      en: 'Google\'s most capable AI model'
    },
    url: 'https://gemini.google.com',
    icon: <Zap className="w-5 h-5" />,
    category: 'Chat'
  },
  {
    id: '7',
    name: 'Runway Gen-2',
    description: {
      zh: '下一代视频生成 AI',
      en: 'Next-generation video generation AI'
    },
    url: 'https://runwayml.com',
    icon: <ImageIcon className="w-5 h-5" />,
    category: 'Video'
  },
  {
    id: '8',
    name: 'Suno AI',
    description: {
      zh: '高质量 AI 音乐创作平台',
      en: 'High-quality AI music creation platform'
    },
    url: 'https://suno.com',
    icon: <Zap className="w-5 h-5" />,
    category: 'Audio'
  },
  {
    id: '9',
    name: 'Notion AI',
    description: {
      zh: '笔记软件中的 AI 助手',
      en: 'AI assistant integrated into Notion'
    },
    url: 'https://notion.so',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'Productivity'
  },
];

const INITIAL_MODULES: ModuleData[] = [
  { id: 'search-module', title: { zh: '全局搜索', en: 'Global Search' }, type: 'search' },
  { id: 'featured-module', title: { zh: '精选生态', en: 'Featured Ecosystem' }, type: 'featured' },
  { id: 'grid-module', title: { zh: 'AI 目录', en: 'AI Directory' }, type: 'grid' },
  { id: 'stats-module', title: { zh: '系统状态', en: 'System Status' }, type: 'stats' },
];

// --- Components ---

const SortableModule: React.FC<{ module: ModuleData; children: React.ReactNode }> = ({ module, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group mb-6",
        isDragging && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 bg-white/10 rounded-lg backdrop-blur-md border border-white/10 z-10"
      >
        <GripVertical className="w-4 h-4 text-white/40" />
      </div>
      {children}
    </div>
  );
};

const ToolCard: React.FC<{ tool: Tool; lang: Language }> = ({ tool, lang }) => (
  <motion.a
    href={tool.url}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ y: -4, scale: 1.02 }}
    className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
  >
    <div className="flex items-center justify-between mb-3">
      <div
        className="p-2 rounded-xl transition-colors"
        style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.2)', color: 'var(--accent-color)' }}
      >
        {tool.icon}
      </div>
      <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
    </div>
    <h3 className="text-white font-medium text-sm mb-1">{tool.name}</h3>
    <p className="text-white/40 text-xs line-clamp-2 leading-relaxed">{tool.description[lang]}</p>
  </motion.a>
);

export default function App() {
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS);
  const [modules, setModules] = useState<ModuleData[]>(INITIAL_MODULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const [accentColor, setAccentColor] = useState('indigo');
  const [glassIntensity, setGlassIntensity] = useState(10);
  const [lang, setLang] = useState<Language>('zh');

  const [newTool, setNewTool] = useState({ name: '', url: '', description: '', category: 'Chat' });

  // Auth State
  const [session, setSession] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const t = TRANSLATIONS[lang];

  const categories = useMemo(() => {
    const cats = Array.from(new Set(tools.map(t => t.category)));
    return ['All', ...cats];
  }, [tools]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description[lang].toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, lang, tools, selectedCategory]);

  const handleAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (tools.length + 1).toString();
    const tool: Tool = {
      id,
      name: newTool.name,
      url: newTool.url,
      description: { zh: newTool.description, en: newTool.description },
      icon: <Sparkles className="w-5 h-5" />,
      category: newTool.category
    };
    setTools([...tools, tool]);
    setIsAddToolOpen(false);
    setNewTool({ name: '', url: '', description: '', category: 'Chat' });
  };

  const handleAuth = async (isSignUp: boolean) => {
    setIsLoginLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Verification email sent! Check your inbox.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsLoginOpen(false);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput) return;
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: '系统错误: 无法连接至 AI 服务后台' }]);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30"
      style={{
        '--accent-color': accentColor === 'indigo' ? '#6366f1' :
          accentColor === 'purple' ? '#a855f7' :
            accentColor === 'emerald' ? '#10b981' : '#f43f5e',
        '--accent-rgb': accentColor === 'indigo' ? '99, 102, 241' :
          accentColor === 'purple' ? '168, 85, 247' :
            accentColor === 'emerald' ? '16, 185, 129' : '244, 63, 94',
        '--glass-blur': `${glassIntensity}px`
      } as React.CSSProperties}
    >
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000"
          style={{ backgroundColor: `var(--accent-color)`, opacity: 0.1 }}
        />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="flex h-screen relative z-10">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={cn(
            "w-72 border-r border-white/5 bg-black/20 flex flex-col fixed inset-y-0 left-0 z-[60] lg:relative lg:flex transition-transform duration-300",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
          style={{ backdropFilter: `blur(var(--glass-blur))` }}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, var(--accent-color), #a855f7)`,
                    boxShadow: `0 10px 20px -5px var(--accent-color)`
                  }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                  Aura AI
                </h1>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                  selectedCategory === 'All' ? "text-white bg-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <LayoutGrid className="w-5 h-5" style={{ color: selectedCategory === 'All' ? 'var(--accent-color)' : '' }} />
                {t.dashboard}
              </button>

              <div className="pt-4 pb-2 px-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">{t.categories}</p>
              </div>

              {categories.filter(c => c !== 'All').map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    selectedCategory === cat ? "text-white bg-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  {cat === 'Chat' && <MessageSquare className="w-5 h-5" />}
                  {cat === 'Image' && <ImageIcon className="w-5 h-5" />}
                  {cat === 'Code' && <Code className="w-5 h-5" />}
                  {cat === 'Search' && <Globe className="w-5 h-5" />}
                  {cat === 'Video' && <ImageIcon className="w-5 h-5" />}
                  {cat === 'Audio' && <Zap className="w-5 h-5" />}
                  {cat === 'Productivity' && <Sparkles className="w-5 h-5" />}
                  {!['Chat', 'Image', 'Code', 'Search', 'Video', 'Audio', 'Productivity'].includes(cat) && <LayoutGrid className="w-5 h-5" />}
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <Globe className="w-4 h-4 text-white/40" />
              <div className="flex gap-2">
                <button
                  onClick={() => setLang('zh')}
                  className={cn("text-[10px] font-bold uppercase transition-colors", lang === 'zh' ? "text-indigo-400" : "text-white/20 hover:text-white/40")}
                >
                  ZH
                </button>
                <span className="text-white/10">|</span>
                <button
                  onClick={() => setLang('en')}
                  className={cn("text-[10px] font-bold uppercase transition-colors", lang === 'en' ? "text-indigo-400" : "text-white/20 hover:text-white/40")}
                >
                  EN
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Settings className="w-5 h-5" />
              {t.customization}
            </button>
            {session ? (
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
                {t.logout}
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all"
              >
                <User className="w-5 h-5" />
                {t.login}
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="font-bold tracking-tight">Aura AI</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <LayoutGrid className="w-6 h-6 text-white/60" />
            </button>
          </header>

          <div className="max-w-5xl mx-auto px-6 py-12 lg:px-12">

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={modules.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                {modules.map((module) => (
                  <SortableModule key={module.id} module={module}>
                    {module.type === 'search' && (
                      <div className="relative mb-12">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                          <Search className="w-6 h-6 text-white/20" />
                        </div>
                        <input
                          type="text"
                          placeholder={t.searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-20 bg-white/5 border border-white/10 rounded-[24px] pl-16 pr-8 text-xl font-light focus:outline-none focus:ring-2 focus:bg-white/10 transition-all placeholder:text-white/10"
                          style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.4)' } as React.CSSProperties}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                          <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/40 font-mono">⌘</kbd>
                          <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/40 font-mono">K</kbd>
                        </div>
                      </div>
                    )}

                    {module.type === 'featured' && (
                      <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/30">{t.featuredTitle}</h2>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Plus className="w-4 h-4 text-white/40" /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <a
                            href="https://openai.com/sora"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group overflow-hidden rounded-[32px] aspect-[16/9] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 block"
                          >
                            <img
                              src="https://picsum.photos/seed/ai-tech/800/450"
                              alt="Featured"
                              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8">
                              <div className="flex items-center gap-2 mb-3">
                                <span
                                  className="px-2 py-1 text-[10px] font-bold uppercase rounded"
                                  style={{ backgroundColor: 'var(--accent-color)' }}
                                >
                                  {t.newRelease}
                                </span>
                                <span className="text-white/40 text-xs">v4.5.0</span>
                              </div>
                              <h3 className="text-2xl font-bold mb-2">{t.nextGenNeural}</h3>
                              <p className="text-white/60 text-sm max-w-md">{t.nextGenDesc}</p>
                            </div>
                          </a>
                          <div className="grid grid-cols-2 gap-6">
                            <a
                              href="https://aws.amazon.com/machine-learning/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col justify-between hover:bg-white/10 transition-all group"
                            >
                              <div className="flex justify-between items-start">
                                <Cpu className="w-8 h-8 text-purple-400 mb-4" />
                                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                              </div>
                              <div>
                                <h4 className="font-bold mb-1">{t.computeHub}</h4>
                                <p className="text-xs text-white/40 leading-relaxed">{t.computeDesc}</p>
                              </div>
                            </a>
                            <a
                              href="https://cloud.google.com/vertex-ai"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col justify-between hover:bg-white/10 transition-all group"
                            >
                              <div className="flex justify-between items-start">
                                <Globe className="w-8 h-8 text-emerald-400 mb-4" />
                                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                              </div>
                              <div>
                                <h4 className="font-bold mb-1">{t.globalApi}</h4>
                                <p className="text-xs text-white/40 leading-relaxed">{t.globalDesc}</p>
                              </div>
                            </a>
                          </div>
                        </div>
                      </section>
                    )}

                    {module.type === 'grid' && (
                      <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/30">{t.directoryTitle}</h2>
                          <div className="flex gap-4 text-xs font-medium">
                            <button
                              className="pb-1 border-b"
                              style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                            >
                              {t.all}
                            </button>
                            <button className="text-white/40 hover:text-white transition-colors">{t.chat}</button>
                            <button className="text-white/40 hover:text-white transition-colors">{t.creative}</button>
                            <button className="text-white/40 hover:text-white transition-colors">{t.dev}</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {filteredTools.map((tool) => (
                            <ToolCard key={tool.id} tool={tool} lang={lang} />
                          ))}
                          <button
                            onClick={() => setIsAddToolOpen(true)}
                            className="flex flex-col items-center justify-center p-4 border border-dashed border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all text-white/20 hover:text-white/40"
                          >
                            <Plus className="w-6 h-6 mb-2" />
                            <span className="text-xs font-medium">{t.addTool}</span>
                          </button>
                        </div>
                      </section>
                    )}

                    {module.type === 'stats' && (
                      <section className="mb-12">
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                          <div className="flex items-center justify-between mb-8">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/30">{t.systemTitle}</h2>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[10px] text-emerald-500 font-bold uppercase">{t.operational}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                              <p className="text-white/40 text-[10px] uppercase font-bold mb-1">{t.latency}</p>
                              <p className="text-2xl font-mono font-light">24<span className="text-xs text-white/20 ml-1">ms</span></p>
                            </div>
                            <div>
                              <p className="text-white/40 text-[10px] uppercase font-bold mb-1">{t.activeNodes}</p>
                              <p className="text-2xl font-mono font-light">1,204</p>
                            </div>
                            <div>
                              <p className="text-white/40 text-[10px] uppercase font-bold mb-1">{t.dailyRequests}</p>
                              <p className="text-2xl font-mono font-light">8.4<span className="text-xs text-white/20 ml-1">M</span></p>
                            </div>
                            <div>
                              <p className="text-white/40 text-[10px] uppercase font-bold mb-1">{t.uptime}</p>
                              <p className="text-2xl font-mono font-light">99.99<span className="text-xs text-white/20 ml-1">%</span></p>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}
                  </SortableModule>
                ))}
              </SortableContext>
            </DndContext>

            <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-white/20 text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Powered by Aura Engine v2.0</span>
              </div>
              <div className="flex gap-8 text-xs font-medium text-white/40">
                <a href="#" className="hover:text-white transition-colors">{t.privacy}</a>
                <a href="#" className="hover:text-white transition-colors">{t.terms}</a>
                <a href="#" className="hover:text-white transition-colors">{t.apiDocs}</a>
                <a href="#" className="hover:text-white transition-colors">{t.status}</a>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Floating AI Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-40 transition-transform hover:scale-110"
        style={{ background: 'linear-gradient(135deg, var(--accent-color), #a855f7)' }}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>

      {/* Customization Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Palette className="w-6 h-6 text-indigo-400" />
                  {t.interface}
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>

              <div className="space-y-10">
                <section>
                  <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">{t.accentColor}</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {['indigo', 'purple', 'emerald', 'rose'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={cn(
                          "h-12 rounded-2xl transition-all border-2",
                          color === 'indigo' && "bg-indigo-500",
                          color === 'purple' && "bg-purple-500",
                          color === 'emerald' && "bg-emerald-500",
                          color === 'rose' && "bg-rose-500",
                          accentColor === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest">{t.glassmorphism}</h3>
                    <span className="text-xs font-mono text-indigo-400">{glassIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={glassIntensity}
                    onChange={(e) => setGlassIntensity(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">{t.displayMode}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium">
                      <Moon className="w-5 h-5" />
                      {t.oledDark}
                    </button>
                    <button className="flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 font-medium opacity-50 cursor-not-allowed">
                      <Sun className="w-5 h-5" />
                      {t.lightMode}
                    </button>
                  </div>
                </section>

                <div className="pt-10 border-t border-white/5">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg"
                    style={{
                      backgroundColor: 'var(--accent-color)',
                      boxShadow: `0 10px 20px -5px rgba(var(--accent-rgb), 0.2)`
                    }}
                  >
                    {t.saveChanges}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}} />

      {/* Add Tool Modal */}
      <AnimatePresence>
        {isAddToolOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddToolOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] z-[201] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">{t.addTool}</h2>
                <button onClick={() => setIsAddToolOpen(false)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>
              <form onSubmit={handleAddTool} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t.name}</label>
                  <input
                    required
                    type="text"
                    value={newTool.name}
                    onChange={e => setNewTool({ ...newTool, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t.url}</label>
                  <input
                    required
                    type="url"
                    value={newTool.url}
                    onChange={e => setNewTool({ ...newTool, url: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t.description}</label>
                  <textarea
                    required
                    value={newTool.description}
                    onChange={e => setNewTool({ ...newTool, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t.category}</label>
                  <select
                    value={newTool.category}
                    onChange={e => setNewTool({ ...newTool, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>
                    ))}
                    <option value="Other" className="bg-[#0a0a0a]">Other</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all"
                >
                  {t.addTool}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[32px] z-[201] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">{t.login} / Sign Up</h2>
                <button onClick={() => setIsLoginOpen(false)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t.email}</label>
                  <input
                    type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t.password}</label>
                  <input
                    type="password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAuth(false)} disabled={isLoginLoading}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => handleAuth(true)} disabled={isLoginLoading}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsChatOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 h-[80vh] w-full max-w-md bg-[#0a0a0a] border-t border-l border-white/10 z-[201] shadow-2xl p-6 rounded-tl-[32px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  {t.aiTitle}
                </h2>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4 pr-2">
                {chatMessages.length === 0 && (
                  <div className="text-center text-white/40 mt-10 text-sm">
                    How can I help you today?
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("p-3 rounded-2xl max-w-[85%] text-sm", msg.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/20 text-white self-end ml-auto' : 'bg-white/5 border border-white/10 text-white/80')} >
                    {msg.content}
                  </div>
                ))}
              </div>
              <form onSubmit={handleChat} className="relative mt-auto">
                <input
                  type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask AI anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl text-indigo-400 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
