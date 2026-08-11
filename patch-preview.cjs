const fs = require('fs');
let code = fs.readFileSync('pages/AnonymousPreview.tsx', 'utf8');

// Add states
const stateToAdd = `  const [activeTab, setActiveTab] = useState<'principal' | 'teacher' | 'student'>('principal');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const message = \`🎉 *New Demo Request* 🎉\\n\\n*Name:* \${demoForm.name}\\n*Email:* \${demoForm.email}\\n*Phone:* \${demoForm.phone}\\n*Address:* \${demoForm.address}\\n\\n_Please follow up at your earliest convenience._\`;
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
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
`;
code = code.replace("  const [activeTab, setActiveTab] = useState<'principal' | 'teacher' | 'student'>('principal');", stateToAdd);

// Change the button onClick
code = code.replace(
  "Request Demo <ChevronRight size={16} />",
  "onClick={() => setShowDemoModal(true)}>Request Demo <ChevronRight size={16} />"
);

// We need to properly replace the button because the previous code was:
// <button className={\`mt-6 px-6 py-3 bg-\${previews[activeTab].color}-600 hover:bg-\${previews[activeTab].color}-700 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors flex items-center gap-2\`}>
//   Request Demo <ChevronRight size={16} />
// </button>

code = code.replace(
  /button className=\{`mt-6 px-6 py-3 bg-\$\{previews\[activeTab\].color\}-600 hover:bg-\$\{previews\[activeTab\].color\}-700 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors flex items-center gap-2`\}>/,
  "button onClick={() => setShowDemoModal(true)} className={`mt-6 px-6 py-3 bg-${previews[activeTab].color}-600 hover:bg-${previews[activeTab].color}-700 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors flex items-center gap-2`}>"
);


// Add Modal to the bottom before the closing tag of the root div
const modalCode = `
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
                    We will notify {import.meta.env.VITE_ADMIN_EMAIL || 'our team'} shortly.
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
`;
code = code.replace("    </div>\n  );\n};\n\nexport default AnonymousPreview;", modalCode + "\n  );\n};\n\nexport default AnonymousPreview;");

fs.writeFileSync('pages/AnonymousPreview.tsx', code);
console.log("Patched AnonymousPreview.tsx");
