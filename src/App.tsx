/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  Award, 
  User, 
  LayoutDashboard, 
  LogOut, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Menu,
  X,
  MapPin,
  Globe,
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  Shield
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Types
interface University {
  id: number;
  name: string;
  type: string;
  location: string;
  description: string;
  min_ssc_gpa: number;
  min_hsc_gpa: number;
  website: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  ssc_gpa: number;
  hsc_gpa: number;
  group_name: string;
  last_active?: string;
}

interface Application {
  id: number;
  university_id: number;
  university_name: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
}

interface ScholarshipApplication {
  id: number;
  scholarship_id: number;
  scholarship_name: string;
  university_name: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
}

interface Scholarship {
  id: number;
  name: string;
  university_id: number;
  university_name: string;
  amount: string;
  deadline: string;
  description: string;
}

export default function App() {
  const [view, setView] = useState<'home' | 'universities' | 'scholarships' | 'dashboard' | 'login' | 'register' | 'guides' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'admin' | 'eligible'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [scholarshipApplications, setScholarshipApplications] = useState<ScholarshipApplication[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [allScholarshipApplications, setAllScholarshipApplications] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Public' | 'Private'>('All');
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // Auth States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSSC, setAuthSSC] = useState('');
  const [authHSC, setAuthHSC] = useState('');
  const [authGroup, setAuthGroup] = useState('Science');

  useEffect(() => {
    fetchUniversities();
    fetchScholarships();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchApplications();
      
      // Heartbeat ping
      const interval = setInterval(() => {
        fetch('/api/auth/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        });
      }, 60000); // Every minute
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUniversities = async () => {
    const res = await fetch('/api/universities');
    const data = await res.json();
    setUniversities(data);
  };

  const fetchScholarships = async () => {
    const res = await fetch('/api/scholarships');
    const data = await res.json();
    setScholarships(data);
  };

  const fetchApplications = async () => {
    if (!user) return;
    const res = await fetch(`/api/applications/${user.id}`);
    const data = await res.json();
    setApplications(data.universityApps);
    setScholarshipApplications(data.scholarshipApps);
  };

  const fetchAdminData = async () => {
    try {
      const usersRes = await fetch('/api/admin/users');
      const usersData = await usersRes.json();
      setAllUsers(usersData);

      const appsRes = await fetch('/api/admin/applications');
      const appsData = await appsRes.json();
      setAllApplications(appsData.universityApps);
      setAllScholarshipApplications(appsData.scholarshipApps);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    }
  };

  const changeView = (newView: any) => {
    const publicViews = ['home', 'login', 'register', 'privacy', 'terms', 'cookies'];
    setIsAdminLogin(false);
    if (!user && !publicViews.includes(newView)) {
      setView('login');
    } else {
      setView(newView);
      if (newView === 'admin') {
        fetchAdminData();
      }
    }
    setIsMenuOpen(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword })
    });
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      changeView('dashboard');
    } else {
      alert('Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: authName, 
        email: authEmail, 
        password: authPassword,
        ssc_gpa: parseFloat(authSSC),
        hsc_gpa: parseFloat(authHSC),
        group_name: authGroup
      })
    });
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      changeView('dashboard');
    } else {
      alert('Registration failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    changeView('home');
  };

  const applyToUniversity = async (uniId: number) => {
    if (!user) {
      setView('login');
      return;
    }
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, university_id: uniId })
    });
    if (res.ok) {
      alert('Application submitted successfully!');
      fetchApplications();
    }
  };

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         uni.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || uni.type === filterType;
    return matchesSearch && matchesType;
  });

  const NavItem = ({ label, icon: Icon, active, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const [selectedGuide, setSelectedGuide] = useState<number | null>(null);

  // Chatbot States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hi! I'm your EduPath Assistant. How can I help you with your university admissions today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const model = "gemini-3-flash-preview";
      const systemInstruction = `You are EduPath Assistant, a helpful AI expert on university admissions in Bangladesh. 
      You have access to information about various universities (Public and Private) and scholarships.
      Your goal is to help students find the right university, understand GPA requirements, and provide guidance on the admission process.
      Be professional, encouraging, and concise. 
      If you don't know something specifically about a university's current year deadline, advise the student to check the official website link provided in the Explore Universities section.
      Current universities in our database include: ${universities.map(u => u.name).join(', ')}.`;

      const response = await genAI.models.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const botResponse = response.text || "I'm sorry, I couldn't process that request. Please try again.";
      setChatMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const guides = [
    { 
      id: 1, 
      title: 'How to Choose the Right University', 
      desc: 'A step-by-step guide on factors to consider when selecting your future institution.',
      content: `Choosing a university is one of the most significant decisions you'll make. Here are the key factors to consider:
      
      1. Academic Reputation: Look at the rankings and the quality of the faculty in your specific field of interest.
      2. Campus Facilities: Modern labs, libraries, and sports facilities can greatly enhance your learning experience.
      3. Location: Consider whether you prefer a city campus or a more suburban setting. Think about commute times and living costs.
      4. Career Services: Check the university's track record for job placements and internships.
      5. Alumni Network: A strong alumni network can provide valuable mentorship and networking opportunities.`
    },
    { 
      id: 2, 
      title: 'Preparing for Admission Tests', 
      desc: 'Tips and strategies to ace the competitive exams for public universities.',
      content: `Public university admission tests in Bangladesh are highly competitive. Here's how to prepare:
      
      1. Start Early: Begin your preparation at least 6 months before the exam.
      2. Master the Basics: Ensure you have a solid understanding of the HSC syllabus.
      3. Practice Previous Papers: Solving past questions is the best way to understand the exam pattern and time management.
      4. Join a Coaching Center: If needed, join a reputable coaching center for structured guidance and mock tests.
      5. Stay Healthy: Don't neglect your physical and mental health. Get enough sleep and eat well.`
    },
    { 
      id: 3, 
      title: 'Understanding GPA Requirements', 
      desc: 'A breakdown of how SSC and HSC results impact your eligibility.',
      content: `Your GPA is the first filter in the admission process.
      
      1. Minimum Requirements: Most top-tier public universities require a minimum GPA of 4.5 or 5.0 in both SSC and HSC.
      2. Subject-Wise GPA: Some departments (like Engineering or Medicine) require specific GPAs in subjects like Math, Physics, or Biology.
      3. GPA Weightage: Some universities include your GPA in the final merit list calculation, while others use it only as an eligibility criterion.
      4. Improvement Exams: If your GPA is low, consider taking improvement exams if allowed by the boards and universities.`
    },
    { 
      id: 4, 
      title: 'Private vs Public: Which is for you?', 
      desc: 'Comparing the pros and cons of different types of universities in Bangladesh.',
      content: `Both public and private universities have their own advantages.
      
      Public Universities:
      - Low tuition fees.
      - High prestige and tradition.
      - Large, diverse campuses.
      - Highly competitive admission.
      
      Private Universities:
      - Modern infrastructure and technology.
      - Faster graduation (less session jam).
      - Industry-aligned curriculum.
      - Higher tuition fees but often offer generous scholarships.`
    },
  ];

  const faqs = [
    { q: "How do I check my eligibility?", a: "Go to your Dashboard after signing in. Your eligibility for top universities will be automatically calculated based on the GPA you provided during registration." },
    { q: "Is the application fee refundable?", a: "No, application fees paid to universities are generally non-refundable as per their individual policies." },
    { q: "Can I apply to multiple universities?", a: "Yes! EduPath allows you to manage and track applications for as many universities as you like from a single dashboard." },
    { q: "What documents do I need for application?", a: "Typically, you'll need scanned copies of your SSC/HSC certificates, marksheets, a recent passport-size photo, and your NID/Birth Certificate." }
  ];

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => changeView('home')}>
              <div className="bg-indigo-600 p-2 rounded-xl">
                <GraduationCap className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">EduPath</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <NavItem label="Explore" icon={Search} active={view === 'universities'} onClick={() => changeView('universities')} />
              <NavItem label="Scholarships" icon={Award} active={view === 'scholarships'} onClick={() => changeView('scholarships')} />
              {user && user.role === 'student' && (
                <NavItem label="My Eligibility" icon={CheckCircle2} active={view === 'eligible'} onClick={() => changeView('eligible')} />
              )}
              {user ? (
                <>
                  <NavItem label="Dashboard" icon={LayoutDashboard} active={view === 'dashboard'} onClick={() => changeView('dashboard')} />
                  {user.role === 'admin' && (
                    <NavItem label="Admin Panel" icon={Shield} active={view === 'admin'} onClick={() => changeView('admin')} />
                  )}
                  <div className="h-6 w-px bg-slate-200 mx-2" />
                  <div className="flex items-center gap-3 pl-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {user.name[0]}
                    </div>
                    <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors">
                      <LogOut size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => changeView('login')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                <button onClick={() => changeView('universities')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3">
                  <Search size={18} /> Explore Universities
                </button>
                <button onClick={() => changeView('scholarships')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3">
                  <Award size={18} /> Scholarships
                </button>
                {user && user.role === 'student' && (
                  <button onClick={() => changeView('eligible')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3">
                    <CheckCircle2 size={18} /> My Eligibility
                  </button>
                )}
                {user ? (
                  <>
                    <button onClick={() => changeView('dashboard')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3">
                      <LayoutDashboard size={18} /> Dashboard
                    </button>
                    {user.role === 'admin' && (
                      <button onClick={() => changeView('admin')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3">
                        <Shield size={18} /> Admin Panel
                      </button>
                    )}
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3 text-red-600">
                      <LogOut size={18} /> Logout
                    </button>
                  </>
                ) : (
                  <button onClick={() => changeView('login')} className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium">
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16 py-12"
            >
              {/* Hero Section */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Admission Season 2025 is Live
                  </div>
                  <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                    Your Gateway to <span className="text-indigo-600">Higher Education</span> in Bangladesh.
                  </h1>
                  <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                    Explore top universities, check your eligibility based on GPA, and manage all your applications in one secure platform.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => changeView('universities')}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2"
                    >
                      Start Exploring <ChevronRight size={20} />
                    </button>
                    <button 
                      onClick={() => changeView('register')}
                      className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all"
                    >
                      Create Account
                    </button>
                  </div>
                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                          <img src={`https://picsum.photos/seed/${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      Joined by <span className="text-slate-900 font-bold">10,000+</span> students this month
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-indigo-500/10 rounded-[2rem] blur-3xl"></div>
                  <img 
                    src="https://picsum.photos/seed/edu/800/600" 
                    alt="Education" 
                    className="relative rounded-3xl shadow-2xl border border-white/20"
                    referrerPolicy="no-referrer"
                  />
                  {/* Floating Stats */}
                  <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-bounce-slow">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">98%</p>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Success Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: 'Smart Eligibility', desc: 'Instantly see which universities you qualify for based on your SSC and HSC results.', icon: Filter, color: 'bg-blue-500' },
                  { title: 'Centralized Tracking', desc: 'Manage multiple applications from a single dashboard. No more messy spreadsheets.', icon: LayoutDashboard, color: 'bg-indigo-500' },
                  { title: 'Scholarship Finder', desc: 'Discover financial aid opportunities tailored to your academic achievements.', icon: Award, color: 'bg-amber-500' },
                ].map((f, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className={`${f.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                      <f.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'scholarships' && (
            <motion.div 
              key="scholarships"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">Available Scholarships</h2>
                <p className="text-slate-500 max-w-2xl mx-auto">Financial aid opportunities to help you achieve your academic dreams.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scholarships.map((s) => (
                  <div key={s.id} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                        <Award size={24} />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deadline: {new Date(s.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{s.name}</h3>
                      <p className="text-indigo-600 font-bold">{s.university_name}</p>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{s.description}</p>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">{s.amount}</span>
                      <button className="text-indigo-600 font-bold text-sm hover:underline">Learn More</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'guides' && (
            <motion.div 
              key="guides"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">Admission Guides</h2>
                <p className="text-slate-500 max-w-2xl mx-auto">Expert advice to help you navigate the university application process.</p>
              </div>

              {selectedGuide ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <button 
                    onClick={() => setSelectedGuide(null)}
                    className="text-indigo-600 font-bold flex items-center gap-2 hover:underline"
                  >
                    <ChevronRight className="rotate-180" size={20} /> Back to Guides
                  </button>
                  <h3 className="text-3xl font-bold">{guides.find(g => g.id === selectedGuide)?.title}</h3>
                  <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-600 leading-relaxed">
                    {guides.find(g => g.id === selectedGuide)?.content}
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {guides.map((g) => (
                    <div key={g.id} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex gap-6 items-start hover:shadow-md transition-all">
                      <div className="bg-indigo-100 p-4 rounded-xl text-indigo-600 shrink-0">
                        <BookOpen size={24} />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold">{g.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{g.desc}</p>
                        <button 
                          onClick={() => setSelectedGuide(g.id)}
                          className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1"
                        >
                          Read Guide <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'contact' && (
            <motion.div 
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">Contact Support</h2>
                <p className="text-slate-500">Have questions? We're here to help you every step of the way.</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8">
                    <h3 className="text-2xl font-bold">Send us a Message</h3>
                    <form className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="What do you need help with?" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                        <textarea rows={5} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Describe your issue in detail..."></textarea>
                      </div>
                      <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        Send Message
                      </button>
                    </form>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    {faqs.map((faq, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <h4 className="font-bold text-slate-900">{faq.q}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 space-y-4">
                    <h4 className="font-bold text-indigo-900">Direct Contact</h4>
                    <p className="text-indigo-700 text-sm">Email: support@edupath.bd</p>
                    <p className="text-indigo-700 text-sm">Phone: +880 1234-567890</p>
                    <p className="text-indigo-700 text-sm">Hours: Sun - Thu, 9 AM - 6 PM</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'privacy' && (
            <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-slate max-w-4xl mx-auto bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold mb-6">Privacy Policy</h2>
              <p className="text-slate-600 leading-relaxed">Last Updated: February 20, 2025</p>
              <p className="text-slate-600 leading-relaxed">At EduPath, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h3>
              <p className="text-slate-600 leading-relaxed">We collect personal information that you provide to us, such as your name, email address, and academic performance data (SSC/HSC GPA). We also collect usage data to improve our services.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h3>
              <p className="text-slate-600 leading-relaxed">Your information is used to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Provide personalized university recommendations.</li>
                <li>Process and track your applications.</li>
                <li>Communicate with you regarding your account and updates.</li>
                <li>Improve the functionality and user experience of our platform.</li>
              </ul>
              
              <h3 className="text-xl font-bold mt-8 mb-4">3. Data Security</h3>
              <p className="text-slate-600 leading-relaxed">We implement a variety of security measures to maintain the safety of your personal information. Your data is stored on secure servers and is accessible only by authorized personnel.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">4. Third-Party Disclosure</h3>
              <p className="text-slate-600 leading-relaxed">We do not sell, trade, or otherwise transfer your personal information to outside parties, except for the universities you explicitly choose to apply to.</p>
            </motion.div>
          )}

          {view === 'terms' && (
            <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-slate max-w-4xl mx-auto bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold mb-6">Terms of Service</h2>
              <p className="text-slate-600 leading-relaxed">Welcome to EduPath. By accessing or using our platform, you agree to comply with and be bound by the following terms and conditions.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h3>
              <p className="text-slate-600 leading-relaxed">By using this site, you signify your acceptance of these terms. If you do not agree to these terms, please do not use our site.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">2. User Accounts</h3>
              <p className="text-slate-600 leading-relaxed">You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">3. Use of the Platform</h3>
              <p className="text-slate-600 leading-relaxed">You agree to use the platform only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the platform.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">4. Limitation of Liability</h3>
              <p className="text-slate-600 leading-relaxed">EduPath will not be liable for any damages arising from the use of this platform, including but not limited to direct, indirect, incidental, punitive, and consequential damages.</p>
            </motion.div>
          )}

          {view === 'cookies' && (
            <motion.div key="cookies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-slate max-w-4xl mx-auto bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-3xl font-bold mb-6">Cookie Policy</h2>
              <p className="text-slate-600 leading-relaxed">EduPath uses cookies to enhance your experience on our platform.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">1. What are Cookies?</h3>
              <p className="text-slate-600 leading-relaxed">Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.</p>
              
              <h3 className="text-xl font-bold mt-8 mb-4">2. How We Use Cookies</h3>
              <p className="text-slate-600 leading-relaxed">We use cookies for the following purposes:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Authentication:</strong> To keep you signed in as you move between pages.</li>
                <li><strong>Preferences:</strong> To remember your settings and preferences, such as your theme choice.</li>
                <li><strong>Analytics:</strong> To understand how our platform is being used and to identify areas for improvement.</li>
              </ul>
              
              <h3 className="text-xl font-bold mt-8 mb-4">3. Managing Cookies</h3>
              <p className="text-slate-600 leading-relaxed">You can control and manage cookies through your browser settings. However, disabling cookies may affect the functionality of some parts of our platform.</p>
            </motion.div>
          )}

          {view === 'universities' && (
            <motion.div 
              key="universities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Explore Universities</h2>
                  <p className="text-slate-500">Find the perfect institution for your future career.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search by name or city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                    />
                  </div>
                  <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                    {['All', 'Public', 'Private'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setFilterType(t as any)}
                        className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${
                          filterType === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUniversities.map((uni) => (
                  <motion.div 
                    layout
                    key={uni.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all group"
                  >
                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${uni.id}/600/400`} 
                        alt={uni.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                        {uni.type}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{uni.name}</h3>
                        <div className="flex items-center gap-1 text-slate-500 text-sm">
                          <MapPin size={14} />
                          {uni.location}
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                        {uni.description}
                      </p>
                      <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min. GPA Req.</p>
                            <p className="text-sm font-bold text-slate-900">SSC: {uni.min_ssc_gpa} | HSC: {uni.min_hsc_gpa}</p>
                          </div>
                          <a 
                            href={uni.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-center"
                          >
                            Check Website
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && user && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-200">
                    {user.name[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Welcome, {user.name}</h2>
                    <p className="text-slate-500 font-medium">{user.group_name} Student • {user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SSC GPA</p>
                    <p className="text-xl font-bold text-slate-900">{user.ssc_gpa}</p>
                  </div>
                  <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HSC GPA</p>
                    <p className="text-xl font-bold text-slate-900">{user.hsc_gpa}</p>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Clock className="text-indigo-600" size={20} />
                      Recent Applications
                    </h3>
                    <button onClick={() => changeView('universities')} className="text-indigo-600 text-sm font-bold hover:underline">
                      Apply to more
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    {applications.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {applications.map((app) => (
                          <div key={app.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <GraduationCap size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{app.university_name}</h4>
                                <p className="text-sm text-slate-500">Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
                              app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                              app.status === 'rejected' ? 'bg-red-50 text-red-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {app.status === 'approved' && <CheckCircle2 size={14} />}
                              {app.status === 'rejected' && <XCircle size={14} />}
                              {app.status === 'pending' && <Clock size={14} />}
                              {app.status.toUpperCase()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                          <BookOpen size={32} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-slate-900">No applications yet</p>
                          <p className="text-slate-500">Start your journey by exploring top universities.</p>
                        </div>
                        <button 
                          onClick={() => changeView('universities')}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all"
                        >
                          Explore Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="text-indigo-600" size={20} />
                    Eligibility Status
                  </h3>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="space-y-4">
                      {universities.slice(0, 3).map(uni => {
                        const isEligible = user.ssc_gpa >= uni.min_ssc_gpa && user.hsc_gpa >= uni.min_hsc_gpa;
                        return (
                          <div key={uni.id} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">{uni.name}</span>
                            {isEligible ? (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">ELIGIBLE</span>
                            ) : (
                              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold">NOT ELIGIBLE</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => changeView('universities')}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
                    >
                      Check All Requirements
                    </button>
                  </div>

                  <div className="bg-indigo-600 p-6 rounded-2xl text-white space-y-4 shadow-xl shadow-indigo-200">
                    <h4 className="font-bold text-lg">Need Help?</h4>
                    <p className="text-indigo-100 text-sm leading-relaxed">Our admission experts are ready to help you choose the right path.</p>
                    <button className="w-full bg-white text-indigo-600 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-all">
                      Talk to Advisor
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'admin' && user?.role === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Admin Control Panel</h2>
                  <p className="text-slate-500 font-medium">Monitoring student registrations and applications.</p>
                </div>
                <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg">
                  <Shield size={32} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
                  <p className="text-3xl font-bold text-indigo-600">{allUsers.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Applications</p>
                  <p className="text-3xl font-bold text-indigo-600">{allApplications.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Universities</p>
                  <p className="text-3xl font-bold text-indigo-600">{universities.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scholarships</p>
                  <p className="text-3xl font-bold text-indigo-600">{scholarships.length}</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <User className="text-indigo-600" size={20} />
                    Registered Students ({allUsers.length})
                  </h3>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {allUsers.map((u) => (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email} • {u.group_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase">GPA</p>
                            <p className="text-sm font-bold text-slate-900">S:{u.ssc_gpa} | H:{u.hsc_gpa}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="text-indigo-600" size={20} />
                    All Applications ({allApplications.length})
                  </h3>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {allApplications.map((app) => (
                        <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="font-bold text-slate-900">{app.university_name}</p>
                            <p className="text-xs text-slate-500">Student: {app.student_name}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                            app.status === 'rejected' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {app.status.toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'eligible' && user && (
            <motion.div 
              key="eligible"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">My Eligible Universities</h2>
                  <p className="text-slate-500 font-medium">Based on your GPA: SSC {user.ssc_gpa} | HSC {user.hsc_gpa}</p>
                </div>
                <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg">
                  <CheckCircle2 size={32} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {universities.filter(uni => user.ssc_gpa >= uni.min_ssc_gpa && user.hsc_gpa >= uni.min_hsc_gpa).map((uni) => (
                  <motion.div 
                    layout
                    key={uni.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all group"
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${uni.id}/600/400`} 
                        alt={uni.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        ELIGIBLE
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{uni.name}</h3>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min. GPA</p>
                          <p className="text-xs font-bold text-slate-900">S:{uni.min_ssc_gpa} | H:{uni.min_hsc_gpa}</p>
                        </div>
                        <a 
                          href={uni.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                        >
                          Website
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {universities.filter(uni => user.ssc_gpa >= uni.min_ssc_gpa && user.hsc_gpa >= uni.min_hsc_gpa).length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <XCircle size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">No universities found matching your current GPA requirements.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {(view === 'login' || view === 'register') && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto py-12"
            >
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8">
                <div className="text-center space-y-2">
                  <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
                    {isAdminLogin ? <Shield size={24} /> : <User size={24} />}
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    {view === 'login' ? (isAdminLogin ? 'Admin Login' : 'Welcome Back') : 'Create Account'}
                  </h2>
                  <p className="text-slate-500">
                    {view === 'login' 
                      ? (isAdminLogin ? 'Enter administrative credentials' : 'Sign in to manage your applications') 
                      : 'Join thousands of students on EduPath'}
                  </p>
                </div>

                <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
                  {view === 'register' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {view === 'register' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SSC GPA</label>
                          <input 
                            type="number" 
                            step="0.01"
                            required
                            value={authSSC}
                            onChange={(e) => setAuthSSC(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="5.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">HSC GPA</label>
                          <input 
                            type="number" 
                            step="0.01"
                            required
                            value={authHSC}
                            onChange={(e) => setAuthHSC(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="5.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Group</label>
                        <select 
                          value={authGroup}
                          onChange={(e) => setAuthGroup(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                        >
                          <option>Science</option>
                          <option>Commerce</option>
                          <option>Humanities</option>
                        </select>
                      </div>
                    </>
                  )}
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-4"
                  >
                    {view === 'login' ? (isAdminLogin ? 'Admin Sign In' : 'Sign In') : 'Create Account'}
                  </button>
                  {view === 'login' && (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAdminLogin(!isAdminLogin);
                        if (!isAdminLogin) {
                          setAuthEmail('admin@edupath.bd');
                          setAuthPassword('admin123');
                        } else {
                          setAuthEmail('');
                          setAuthPassword('');
                        }
                      }}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all mt-2 flex items-center justify-center gap-2 ${
                        isAdminLogin 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Shield size={16} /> {isAdminLogin ? 'Back to Student Login' : 'Login as Admin'}
                    </button>
                  )}
                </form>

                <div className="text-center">
                  <button 
                    onClick={() => changeView(view === 'login' ? 'register' : 'login')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    {view === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-xl">
                  <GraduationCap className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">EduPath</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Empowering Bangladeshi students to navigate the complex university admission landscape with confidence and clarity.
              </p>
              <div className="flex items-center gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer">
                    <Globe size={20} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Quick Links</h4>
              <ul className="space-y-4 text-slate-500 font-medium">
                <li><button onClick={() => changeView('universities')} className="hover:text-indigo-600 transition-colors">Explore Universities</button></li>
                <li><button onClick={() => changeView('scholarships')} className="hover:text-indigo-600 transition-colors">Scholarships</button></li>
                <li><button onClick={() => changeView('guides')} className="hover:text-indigo-600 transition-colors">Admission Guides</button></li>
                <li><button onClick={() => changeView('contact')} className="hover:text-indigo-600 transition-colors">Contact Support</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
              <ul className="space-y-4 text-slate-500 font-medium">
                <li><button onClick={() => changeView('privacy')} className="hover:text-indigo-600 transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => changeView('terms')} className="hover:text-indigo-600 transition-colors">Terms of Service</button></li>
                <li><button onClick={() => changeView('cookies')} className="hover:text-indigo-600 transition-colors">Cookie Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 mt-12 pt-8 text-center text-slate-400 text-sm font-medium">
            © 2025 EduPath Bangladesh. All rights reserved.
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">EduPath Assistant</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-medium text-indigo-100 uppercase tracking-wider">Online</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${
            isChatOpen ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
          }`}
        >
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
          {!isChatOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
