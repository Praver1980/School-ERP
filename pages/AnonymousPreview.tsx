import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Phone, Mail, Clock, LayoutDashboard, Users, BookOpen, ChevronRight, ShieldCheck, Zap } from 'lucide-react';

interface AnonymousPreviewProps {
  onBack: () => void;
}

const AnonymousPreview: React.FC<AnonymousPreviewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'principal' | 'teacher' | 'student'>('principal');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const message = `🎉 *New Demo Request* 🎉\n\n*Name:* ${demoForm.name}\n*Email:* ${demoForm.email}\n*Phone:* ${demoForm.phone}\n*Address:* ${demoForm.address}\n\n_Please follow up at your earliest convenience._`;
      await fetch('/api/request-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoForm)
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowDemoModal(false);
        setSubmitSuccess(false);
        setDemoForm({ name: '', email: '', phone: '', address: '' });
      }, 3000);
    } catch (error) {
      console.error("Failed to submit demo request", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const previews = {
    principal: {
      title: "Principal Dashboard",
      description: "Complete oversight of your institution. Monitor attendance, manage staff, and analyze school-wide performance metrics in real-time.",
      features: [
        "Live School Analytics & Statistics",
        "Staff & Student Management",
        "Broadcast Announcements Globally",
        "Comprehensive Performance Reports",
      ],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
      color: "blue"
    },
    teacher: {
      title: "Teacher Dashboard",
      description: "Empower your teaching with streamlined class management, attendance tracking, and direct student communication.",
      features: [
        "Digital Attendance & Grading",
        "Assignment Creation & Tracking",
        "Direct Messaging with Students",
        "Class Performance Analytics",
      ],
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000",
      color: "purple"
    },
    student: {
      title: "Student Portal",
      description: "A centralized hub for students to track their progress, access assignments, and stay connected with their teachers.",
      features: [
        "Personalized Academic Tracking",
        "Assignment Submission & Grades",
        "Direct Teacher Communication",
        "Interactive House & Club Activities",
      ],
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000",
      color: "amber"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-blue-500/30">
            N
          </div>
          <span className="font-black tracking-tighter uppercase text-xl">Nexus ERP</span>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
          <Zap size={14} /> Next-Gen School Management
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
          Unify Your Entire School <br className="hidden md:block"/> Under One Platform
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Experience the future of education management. Nexus ERP provides tailored, powerful interfaces for Principals, Teachers, and Students to foster a connected, efficient learning environment.
        </p>
      </section>

      {/* Interactive Preview Section */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap gap-2 p-2 mb-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
            {(Object.keys(previews) as Array<keyof typeof previews>).map((role) => (
              <button
                key={role}
                onClick={() => setActiveTab(role)}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === role 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {role} View
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-6 lg:p-10 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black tracking-tight">{previews[activeTab].title}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                {previews[activeTab].description}
              </p>
              <ul className="space-y-3 pt-4">
                {previews[activeTab].features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className={`text-${previews[activeTab].color}-500 shrink-0`} size={20} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowDemoModal(true)} className={`mt-6 px-6 py-3 bg-${previews[activeTab].color}-600 hover:bg-${previews[activeTab].color}-700 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors flex items-center gap-2`}>
                Request Demo <ChevronRight size={16} />
              </button>
            </div>
            <div className="relative group">
              <div className={`absolute inset-0 bg-${previews[activeTab].color}-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500`}></div>
              <img 
                src={previews[activeTab].image} 
                alt={previews[activeTab].title} 
                className="relative rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg object-cover h-[400px] w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Support Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-black tracking-tighter mb-2">Need Assistance?</h3>
            <p className="text-slate-400">Our dedicated support team is here to help you get the most out of Nexus ERP.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Support Agent 1 */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold">Primary Support</h4>
                  <div className="flex items-center gap-1 text-xs text-blue-400 font-medium uppercase tracking-wider">
                    <Clock size={12} /> {(import.meta as any).env.VITE_SUPPORT_HOURS_1 || 'Available 3-5pm'}
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg">
                  <Phone size={16} className="text-slate-400" />
                  <span className="font-mono">{(import.meta as any).env.VITE_SUPPORT_PHONE_1 || '7599337074'}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg">
                  <Mail size={16} className="text-slate-400" />
                  <span>{(import.meta as any).env.VITE_SUPPORT_EMAIL_1 || 'praver.agarwal7@gmail.com'}</span>
                </div>
              </div>
            </div>

            {/* Support Agent 2 */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="font-bold">Secondary Support</h4>
                  <div className="flex items-center gap-1 text-xs text-purple-400 font-medium uppercase tracking-wider">
                    <Clock size={12} /> {(import.meta as any).env.VITE_SUPPORT_HOURS_2 || 'Available 5-7pm'}
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg">
                  <Phone size={16} className="text-slate-400" />
                  <span className="font-mono">{(import.meta as any).env.VITE_SUPPORT_PHONE_2 || '79832 22450'}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg">
                  <Mail size={16} className="text-slate-400" />
                  <span>{(import.meta as any).env.VITE_SUPPORT_EMAIL_2 || 'Pending Email'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Request Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Book a Demo</h2>
                <button onClick={() => setShowDemoModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Request Received!</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    We will notify {(import.meta as any).env.VITE_ADMIN_EMAIL || 'our team'} shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Jane Doe"
                      value={demoForm.name}
                      onChange={e => setDemoForm({...demoForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="jane@example.com"
                      value={demoForm.email}
                      onChange={e => setDemoForm({...demoForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Number</label>
                    <input 
                      type="tel" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                      value={demoForm.phone}
                      onChange={e => setDemoForm({...demoForm, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">School / Organization Address</label>
                    <textarea 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                      placeholder="123 Education Lane..."
                      value={demoForm.address}
                      onChange={e => setDemoForm({...demoForm, address: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default AnonymousPreview;
