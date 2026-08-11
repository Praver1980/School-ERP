
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, UserCheck, AlertTriangle, TrendingUp, Calendar, Plus, Search, BookOpen, Trash2, Pencil, Megaphone, Send, Globe, School, ClipboardList, X
} from 'lucide-react';
import { CLASS_GRADES, SECTIONS_JUNIOR, SECTIONS_SENIOR } from '../constants';
import { User, UserRole, Announcement, HouseTeam, School as SchoolType, SchoolConfig, StudentRecord, PaymentRecord } from '../types';
import { getStoredUsers, addUser, updateUser, removeUser, generateId, getStoredAnnouncements, addAnnouncement, deleteAnnouncement, getStoredSchools, getStoredStudents, addPayment, getStoredPayments } from '../services/storage';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

interface Props {
  currentPage?: string;
  currentUser?: User; 
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const YEARS = [2024, 2025, 2026];

const PrincipalDashboard: React.FC<Props> = ({ currentPage = 'dashboard' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSchoolConfig, setCurrentSchoolConfig] = useState<SchoolConfig | null>(null);

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [transactionId, setTransactionId] = useState('');
  const [senderUpiId, setSenderUpiId] = useState('');
  const [myPayments, setMyPayments] = useState<PaymentRecord[]>([]);
  
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [alertState, setAlertState] = useState<{ isOpen: boolean, title?: string, message: string }>({ isOpen: false, message: '' });
  
  // Attendance State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Teacher Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherID, setTeacherID] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  
  // Split Class State
  const [teacherGrade, setTeacherGrade] = useState('');
  const [teacherSection, setTeacherSection] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  
  const [teacherSubClasses, setTeacherSubClasses] = useState<{ grade: string; section: string; subject: string }[]>([]);

  const [teacherGender, setTeacherGender] = useState('Male'); 
  const [teacherDesignation, setTeacherDesignation] = useState('');
  const [teacherHouse, setTeacherHouse] = useState<HouseTeam>('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherContact, setTeacherContact] = useState('');

  // Form Error
  const [formError, setFormError] = useState('');

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAudience, setAnnAudience] = useState<'all' | 'student' | 'teacher'>('all');

  useEffect(() => {
    const loadData = () => {
        setUsers(getStoredUsers());
        setStudents(getStoredStudents());
        
        const stored = localStorage.getItem('nexus_user');
        let userObj = null;
        if (stored) {
            userObj = JSON.parse(stored);
            setCurrentUser(userObj);
            
            if (userObj && userObj.schoolName) {
                const schools = getStoredSchools();
                const mySchool = schools.find(s => s.name === userObj?.schoolName);
                if (mySchool) setCurrentSchoolConfig(mySchool.config);
            }
        }

        const allAnn = getStoredAnnouncements();
        const relevantAnn = allAnn.filter(a => !a.schoolName || (userObj && a.schoolName === userObj.schoolName));
        setAnnouncements(relevantAnn);
        
        if (userObj) {
          const allPayments = getStoredPayments();
          setMyPayments(allPayments.filter(p => p.principalUid === userObj?.uid));
        }
    };
    loadData();
    window.addEventListener('nexus_data_changed', loadData);
    return () => window.removeEventListener('nexus_data_changed', loadData);
  }, [currentPage]);

  useEffect(() => {
    if (!currentUser || !currentUser.schoolName || myPayments.length === 0) return;

    // Check if it's been more than 30 days since the last successful payment
    const successfulPayments = myPayments.filter(p => p.status === 'success');
    if (successfulPayments.length === 0) return; // Wait until they have at least one success? Or if no success ever? 
    // Let's assume if there's no successful payment at all, maybe they just started.

    const lastPayment = successfulPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const lastPaymentDate = new Date(lastPayment.date);
    const daysSinceLastPayment = Math.floor((new Date().getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24));

    if (daysSinceLastPayment > 30) {
      const storageKey = `overdue_notified_${currentUser.schoolName}`;
      const lastNotifiedStr = localStorage.getItem(storageKey);
      const lastNotified = lastNotifiedStr ? parseInt(lastNotifiedStr) : 0;
      
      // Notify once every 24 hours
      if (new Date().getTime() - lastNotified > 24 * 3600 * 1000) {
        try {
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `⚠️ Overdue Payment Alert!\n\nSchool: ${currentUser.schoolName}\nPrincipal: ${currentUser.name}\nDays Overdue: ${daysSinceLastPayment - 30}\nLast Payment: ${lastPayment.date}`
            })
          });
          localStorage.setItem(storageKey, new Date().getTime().toString());
        } catch (e) {
          console.error("Failed to notify telegram:", e);
        }
      }
    }
  }, [myPayments, currentUser]);

  // Helper logic for class splitting
  const parseClassString = (classStr: string) => {
    if (!classStr) return { pGrade: '', pSection: '' };
    const parts = classStr.split('-');
    if (parts.length >= 2) {
        return { pGrade: parts[0], pSection: parts.slice(1).join('-') };
    }
    return { pGrade: classStr, pSection: '' };
  };

  const getSectionOptions = (grade: string) => {
      if (['11th', '12th'].includes(grade)) {
          if (currentSchoolConfig && currentSchoolConfig.streams.length > 0) {
              return currentSchoolConfig.streams;
          }
          return SECTIONS_SENIOR;
      }
      return SECTIONS_JUNIOR;
  };

  const getHouseOptions = () => {
      if (currentSchoolConfig && currentSchoolConfig.houseNames.length > 0) {
          return currentSchoolConfig.houseNames;
      }
      return ['Green', 'Blue', 'Yellow', 'Red'];
  };

  // --- TEACHER LOGIC ---
  const openAddModal = () => {
    setEditingId(null);
    setFormError('');
    setTeacherName('');
    setTeacherID('');
    setTeacherPassword('');
    setTeacherGrade('');
    setTeacherSection('');
    setTeacherSubject('');
    setTeacherSubClasses([]);
    setTeacherGender('Male');
    setTeacherDesignation('');
    setTeacherHouse('');
    setTeacherEmail('');
    setTeacherContact('');
    setShowAddTeacher(true);
  };

  const openEditModal = (user: User) => {
    setEditingId(user.uid);
    setFormError('');
    setTeacherName(user.name);
    setTeacherID(user.schoolID);
    setTeacherPassword(user.password || '');
    
    const { pGrade, pSection } = parseClassString(user.assignedClass || '');
    setTeacherGrade(pGrade);
    setTeacherSection(pSection);
    
    setTeacherSubject(user.assignedSubject || '');
    
    // Map additionalClasses back to teacherSubClasses
    const mappedSubClasses = (user.additionalClasses || []).map(ac => {
      const { pGrade: g, pSection: s } = parseClassString(ac.className);
      return { grade: g, section: s, subject: ac.subject };
    });
    setTeacherSubClasses(mappedSubClasses);

    setTeacherGender(user.gender || 'Male');
    setTeacherDesignation(user.designation || '');
    setTeacherHouse(user.house || '');
    setTeacherEmail(user.email || '');
    setTeacherContact(user.contactNumber || '');
    setShowAddTeacher(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!currentUser?.schoolName) {
        setFormError("Error: You are not assigned to a valid School. Cannot add teachers.");
        return;
    }

    // Duplicate Check
    const isDuplicate = users.some(u => u.schoolID === teacherID && u.uid !== editingId);
    if (isDuplicate) {
        setFormError("School ID already exists. Please use a unique ID.");
        return;
    }

    // Allow empty if not assigned, but if grade selected, enforce section
    let fullClass = '';
    if (teacherGrade) {
        if (!teacherSection) {
            setFormError('Please select a section for the main grade.');
            return;
        }
        fullClass = `${teacherGrade}-${teacherSection}`;
    }

    // Validate sub classes
    const validSubClasses = [];
    for (const sc of teacherSubClasses) {
        if (sc.grade && !sc.section) {
            setFormError('Please select a section for all additional grades.');
            return;
        }
        if (sc.grade && sc.section) {
            validSubClasses.push({
                className: `${sc.grade}-${sc.section}`,
                subject: sc.subject
            });
        }
    }

    if (editingId) {
      const updatedUser: User = {
         ...users.find(u => u.uid === editingId)!,
         name: teacherName,
         schoolID: teacherID,
         password: teacherPassword,
         assignedClass: fullClass,
         assignedSubject: teacherSubject,
         additionalClasses: validSubClasses,
         gender: teacherGender,
         designation: teacherDesignation,
         house: teacherHouse,
         email: teacherEmail,
         contactNumber: teacherContact,
         // Ensure School Name is consistent
         schoolName: currentUser.schoolName,
         avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=8b5cf6&color=fff`
      };
      updateUser(updatedUser);
      setAlertState({ isOpen: true, message: `Teacher ${teacherName} updated!` });
    } else {
      const newUser: User = {
        uid: generateId('u'),
        name: teacherName,
        schoolID: teacherID,
        role: UserRole.TEACHER,
        password: teacherPassword,
        assignedClass: fullClass,
        assignedSubject: teacherSubject,
        additionalClasses: validSubClasses,
        gender: teacherGender,
        designation: teacherDesignation,
        house: teacherHouse,
        email: teacherEmail,
        contactNumber: teacherContact,
        // Auto assign Principal's school
        schoolName: currentUser.schoolName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=8b5cf6&color=fff`
      };
      addUser(newUser);
      setAlertState({ isOpen: true, message: `Teacher Added! Login ID: ${newUser.schoolID}` });
    }
    setUsers(getStoredUsers());
    setShowAddTeacher(false);
  };

  const handleRemoveTeacher = (uid: string, name: string) => {
    setConfirmState({
        isOpen: true,
        title: 'Remove Teacher',
        message: `Are you sure you want to remove Teacher "${name}"?`,
        onConfirm: () => {
            removeUser(uid);
            setUsers(getStoredUsers());
        }
    });
  };

  // Delete handler for Modal
  const handleDeleteFromModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingId) return;
    
    setConfirmState({
        isOpen: true,
        title: 'Delete Teacher',
        message: `Are you sure you want to remove Teacher "${teacherName}"?`,
        onConfirm: () => {
            removeUser(editingId);
            setUsers(getStoredUsers());
            setShowAddTeacher(false);
        }
    });
  };

  // --- ANNOUNCEMENT LOGIC ---
  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.schoolName) {
        setAlertState({ isOpen: true, title: 'Error', message: "Error: You must be assigned to a school to post announcements." });
        return;
    }

    const newAnn: Announcement = {
      id: generateId('ann'),
      title: annTitle,
      content: annContent,
      date: new Date().toISOString().split('T')[0],
      audience: annAudience,
      author: 'Principal',
      schoolName: currentUser.schoolName // Automatically tag with principal's school
    };
    addAnnouncement(newAnn);
    
    // Refresh local list
    const allAnn = getStoredAnnouncements();
    const relevantAnn = allAnn.filter(a => !a.schoolName || a.schoolName === currentUser.schoolName);
    setAnnouncements(relevantAnn);

    setAnnTitle('');
    setAnnContent('');
    setAlertState({ isOpen: true, message: 'Announcement Posted!' });
  };

  const handleDeleteAnnouncement = (id: string) => {
    setConfirmState({
        isOpen: true,
        title: 'Delete Announcement',
        message: 'Delete this announcement?',
        onConfirm: () => {
            deleteAnnouncement(id);
            const allAnn = getStoredAnnouncements();
            const relevantAnn = allAnn.filter(a => !a.schoolName || a.schoolName === currentUser?.schoolName);
            setAnnouncements(relevantAnn);
        }
    });
  };

  // Filter teachers by Role AND School
  const myTeachers = users.filter(u => 
      u.role === UserRole.TEACHER && 
      u.schoolName === currentUser?.schoolName
  );
  
  // Count students in this school for the stats
  const studentsInSchool = users.filter(u => 
      u.role === UserRole.STUDENT &&
      u.schoolName === currentUser?.schoolName
  );

  useEffect(() => {
    const classes = Array.from(new Set(students.filter(s => s.schoolName === currentUser?.schoolName).map(s => s.className))).sort();
    if (classes.length > 0 && !selectedClass) {
        setSelectedClass(classes[0]);
    }
  }, [students, currentUser, selectedClass]);

  // Attendance Analysis Logic
  const availableClasses = Array.from(new Set(students.filter(s => s.schoolName === currentUser?.schoolName).map(s => s.className))).sort();

  const getMonthlyStats = () => {
    if (!selectedClass) return { present: 0, absent: 0, total: 0, rate: 0 };
    
    const classStudents = students.filter(s => s.className === selectedClass && s.schoolName === currentUser?.schoolName);
    let presentCount = 0;
    let absentCount = 0;

    classStudents.forEach(student => {
      if (student.attendanceHistory) {
        Object.entries(student.attendanceHistory).forEach(([dateStr, status]) => {
          // Parse YYYY-MM-DD manually to avoid timezone shifts
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // 0-indexed
            if (month === selectedMonth && year === selectedYear) {
              if (status === true) presentCount++;
              else if (status === false) absentCount++;
            }
          }
        });
      }
    });

    const total = presentCount + absentCount;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    
    return { present: presentCount, absent: absentCount, total, rate };
  };

  const stats = getMonthlyStats();
  const monthlyData = [
    { name: 'Present', value: stats.present, color: '#10b981' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' }
  ];

  // --- SUB-PAGES RENDERING ---

  if (currentPage === 'attendance') {
    const classStudents = students.filter(s => s.className === selectedClass && s.schoolName === currentUser?.schoolName);

    return (
        <div className="space-y-10 pb-20">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-display mb-2">Attendance <span className="text-blue-500">Intelligence</span></h1>
                    <p className="text-label">Deep dive into school-wide attendance metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary py-2.5 px-5 flex items-center gap-2">
                        <Calendar size={14} /> Export Report
                    </button>
                </div>
             </header>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Monthly Analysis Card */}
                <div className="xl:col-span-2 premium-card p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-1">Monthly Analysis</h3>
                            <p className="text-label">Aggregate data for {MONTHS[selectedMonth]} {selectedYear}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-label ml-1">Class</label>
                                <select 
                                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="">Select Class</option>
                                    {availableClasses.map(c => (
                                        <option key={c || Math.random().toString()} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-label ml-1">Month</label>
                                <select 
                                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={m || Math.random().toString()} value={i}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-label ml-1">Year</label>
                                <select 
                                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {YEARS.map(y => (
                                        <option key={y || Math.random().toString()} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {selectedClass ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div className="h-72 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={monthlyData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={85}
                                            outerRadius={115}
                                            paddingAngle={10}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {monthlyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '24px', 
                                                border: 'none', 
                                                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                                                backgroundColor: 'var(--bg-card)',
                                                backdropFilter: 'blur(12px)',
                                                padding: '16px 24px',
                                                fontFamily: 'var(--font-sans)',
                                                fontWeight: '900',
                                                fontSize: '12px',
                                                textTransform: 'uppercase'
                                            }} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-5xl font-black tracking-tighter">{stats.rate}%</span>
                                    <span className="text-label">Average Rate</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <p className="text-label mb-1">Total Records</p>
                                            <p className="text-3xl font-black tracking-tighter">{stats.total}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                            <UserCheck size={24} />
                                        </div>
                                        <div>
                                            <p className="text-label mb-1">Present</p>
                                            <p className="text-3xl font-black tracking-tighter">{stats.present}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-label mb-1">Absent</p>
                                            <p className="text-3xl font-black tracking-tighter">{stats.absent}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-80 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 dark:border-slate-800/50 rounded-3xl gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                                <Search size={32} className="text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Select a class to begin analysis</p>
                        </div>
                    )}
                </div>

                {/* Daily Report Section */}
                <div className="xl:col-span-3 premium-card overflow-hidden">
                    <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50/30 dark:bg-slate-900/30">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-1 flex items-center gap-3">
                                <Calendar className="text-blue-500" size={24} />
                                Daily Attendance Log
                            </h3>
                            <p className="text-label">Detailed view for {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-2">
                                <label className="text-label ml-1">Select Date</label>
                                <input 
                                    type="date"
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left min-w-[800px] border-separate border-spacing-0">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-label border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Roll</th>
                                    <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Student Name</th>
                                    <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">School ID</th>
                                    <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 text-center">Status</th>
                                    <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 text-center">Monthly %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {!selectedClass ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-20 text-center text-label italic">
                                            Please select a class above to view the daily log
                                        </td>
                                    </tr>
                                ) : classStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-20 text-center text-label italic">
                                            No students found in this class
                                        </td>
                                    </tr>
                                ) : (
                                    classStudents.map(student => {
                                        const status = student.attendanceHistory?.[selectedDate];
                                        
                                        // Per student monthly stats
                                        let pCount = 0;
                                        let aCount = 0;
                                        if (student.attendanceHistory) {
                                            Object.entries(student.attendanceHistory).forEach(([d, s]) => {
                                                const parts = d.split('-');
                                                if (parts.length === 3) {
                                                    const y = parseInt(parts[0]);
                                                    const m = parseInt(parts[1]) - 1;
                                                    if (m === selectedMonth && y === selectedYear) {
                                                        if (s === true) pCount++;
                                                        else if (s === false) aCount++;
                                                    }
                                                }
                                            });
                                        }
                                        const total = pCount + aCount;
                                        const rate = total > 0 ? Math.round((pCount / total) * 100) : 0;

                                        return (
                                            <tr key={student.id || Math.random().toString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="px-10 py-6 font-mono text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/30">{student.rollNumber}</td>
                                                <td className="px-10 py-6">
                                                    <div className="font-black text-slate-900 dark:text-white tracking-tight text-base group-hover:text-blue-500 transition-colors">{student.name}</div>
                                                </td>
                                                <td className="px-10 py-6 font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">{student.schoolID}</td>
                                                <td className="px-10 py-6 text-center">
                                                    {status === true ? (
                                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                                            <UserCheck size={14} /> Present
                                                        </span>
                                                    ) : status === false ? (
                                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                                            <AlertTriangle size={14} /> Absent
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-500/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-500/20">
                                                            Not Marked
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-10 py-6 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${rate < 75 ? 'bg-red-500' : 'bg-green-500'}`}
                                                                style={{ width: `${rate}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-[10px] font-black tracking-widest ${rate < 75 ? 'text-red-500' : 'text-green-500'}`}>{rate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        </div>
    );
  }

  // --- SUB-PAGES RENDERING ---

  if (currentPage === 'announcements') {
    return (
        <div className="space-y-10 pb-20">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-display mb-2">School <span className="text-blue-500">Broadcast</span></h1>
                    <p className="text-label">Communicate with your entire school community</p>
                </div>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Create Form */}
                 <div className="lg:col-span-1">
                     <div className="premium-card p-8">
                         <h3 className="text-xl font-black uppercase tracking-tighter italic mb-6 flex items-center gap-3">
                             <Plus size={20} className="text-blue-500" /> New Post
                         </h3>
                         <form onSubmit={handlePostAnnouncement} className="space-y-6">
                             <div className="space-y-2">
                                 <label className="text-label ml-1">Title</label>
                                 <input 
                                     className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all" 
                                     placeholder="e.g. Sports Day Update"
                                     value={annTitle}
                                     onChange={e => setAnnTitle(e.target.value)}
                                     required
                                 />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-label ml-1">Audience</label>
                                 <select 
                                     className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all"
                                     value={annAudience}
                                     onChange={(e: any) => setAnnAudience(e.target.value)}
                                 >
                                     <option value="all">Everyone</option>
                                     <option value="student">Students Only</option>
                                     <option value="teacher">Teachers Only</option>
                                 </select>
                             </div>
                             <div className="space-y-2">
                                 <label className="text-label ml-1">Message</label>
                                 <textarea 
                                     className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all h-40 resize-none" 
                                     placeholder="Type your message here..."
                                     value={annContent}
                                     onChange={e => setAnnContent(e.target.value)}
                                     required
                                 />
                             </div>
                             <button type="submit" className="btn-primary w-full py-4 flex items-center justify-center gap-3">
                                 <Send size={18} /> Post Message
                             </button>
                         </form>
                     </div>
                 </div>

                 {/* List */}
                 <div className="lg:col-span-2">
                     <div className="premium-card overflow-hidden">
                         <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                             <h3 className="text-xl font-black uppercase tracking-tighter italic">Recent Activity</h3>
                         </div>
                         <div className="divide-y divide-slate-100 dark:divide-slate-800">
                             {announcements.length === 0 ? (
                                 <div className="p-20 text-center">
                                     <p className="text-label italic">No announcements posted yet.</p>
                                 </div>
                             ) : (
                                 announcements.map(ann => (
                                     <div key={ann.id || Math.random().toString()} className="p-10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                         <div className="flex justify-between items-start mb-6">
                                             <div className="space-y-2">
                                                 <h4 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{ann.title}</h4>
                                                 <div className="flex flex-wrap gap-2">
                                                     <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                                         ann.audience === 'all' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                         ann.audience === 'teacher' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                         'bg-green-500/10 text-green-500 border-green-500/20'
                                                     }`}>
                                                         To: {ann.audience}
                                                     </span>
                                                     {!ann.schoolName && (
                                                         <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20">
                                                             <Globe size={12} /> Global
                                                         </span>
                                                     )}
                                                 </div>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 <span className="text-label">{ann.date}</span>
                                                 <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                     <Trash2 size={18} />
                                                 </button>
                                             </div>
                                         </div>
                                         <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{ann.content}</p>
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
  }

  const handleTransactionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionId(e.target.value);
  };

  const handleUpiIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSenderUpiId(e.target.value);
  };

  const handleSubmitPayment = () => {
    if (!transactionId.trim()) {
      setAlertState({ isOpen: true, message: 'Please enter a valid Transaction ID / UTR.' });
      return;
    }
    if (!currentUser || !currentUser.schoolName) {
      setAlertState({ isOpen: true, message: 'You must be associated with a school.' });
      return;
    }
    
    const FEE_PER_STUDENT = 2;
    const totalStudents = studentsInSchool.length;
    const amountDue = totalStudents * FEE_PER_STUDENT;

    const newPayment: PaymentRecord = {
      id: generateId('pay'),
      schoolName: currentUser.schoolName,
      principalUid: currentUser.uid,
      principalName: currentUser.name,
      amount: amountDue,
      studentCount: totalStudents,
      date: new Date().toISOString().split('T')[0],
      transactionId: transactionId,
      ...(senderUpiId ? { senderUpiId } : {}),
      status: 'pending'
    };

    addPayment(newPayment);
    setMyPayments([...myPayments, newPayment]);
    setTransactionId('');
    setSenderUpiId('');
    setAlertState({ isOpen: true, message: 'Payment submitted for verification. Admin will confirm shortly.' });

    // Notify Telegram
    try {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🚨 New Payment Submitted!\n\nSchool: ${currentUser.schoolName}\nPrincipal: ${currentUser.name}\nAmount: ₹${amountDue}\nStudents: ${totalStudents}\nTransaction ID: ${transactionId}\nUPI ID: ${senderUpiId || 'N/A'}`
        })
      });
    } catch (e) {
      console.error("Failed to notify telegram:", e);
    }
  };

  if (currentPage === 'payments') {
    const FEE_PER_STUDENT = 2;
    const totalStudents = studentsInSchool.length;
    const amountDue = totalStudents * FEE_PER_STUDENT;
    const upiId = "7599337074@fam";
    const upiUrl = `upi://pay?pa=${upiId}&pn=Admin&am=${amountDue}&cu=INR&tn=School+ERP+Fee`;

    return (
        <div className="space-y-10 pb-20">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-display mb-2">Platform <span className="text-blue-500">Payments</span></h1>
                    <p className="text-label">Pay your school's ERP platform fees</p>
                </div>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="premium-card p-10">
                     <h3 className="text-xl font-black uppercase tracking-tighter italic mb-6 text-slate-900 dark:text-white">Fee Calculation</h3>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800">
                             <span className="text-label">Total Students Enrolled</span>
                             <span className="font-black text-xl">{totalStudents}</span>
                         </div>
                         <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800">
                             <span className="text-label">Fee per Student</span>
                             <span className="font-black text-xl">₹{FEE_PER_STUDENT}</span>
                         </div>
                         <div className="flex justify-between items-center py-6">
                             <span className="text-label font-black text-slate-900 dark:text-white uppercase tracking-widest">Total Amount Due</span>
                             <span className="font-black text-4xl text-blue-500">₹{amountDue}</span>
                         </div>
                     </div>
                 </div>

                 <div className="premium-card p-10 flex flex-col items-center justify-center text-center">
                     <h3 className="text-xl font-black uppercase tracking-tighter italic mb-4 text-slate-900 dark:text-white">Pay via UPI</h3>
                     <div className="bg-white p-4 rounded-3xl inline-block mb-4">
                         {/* Generate a QR code for the UPI Intent link - using an open API for prototype */}
                         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`} alt="UPI QR Code" className="w-48 h-48 rounded-xl" />
                     </div>
                     <p className="text-label mb-2">Scan with any UPI app to pay</p>
                     <p className="font-mono text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl mb-6">{upiId}</p>
                     
                     <div className="w-full space-y-4">
                         <input 
                             type="text" 
                             value={transactionId}
                             onChange={handleTransactionIdChange}
                             placeholder="Enter 12-digit UTR / Transaction ID after payment"
                             maxLength={12}
                             className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm text-center transition-all"
                         />
                         
                         <input 
                             type="text" 
                             value={senderUpiId}
                             onChange={handleUpiIdChange}
                             placeholder="Your UPI ID used for payment (Optional)"
                             className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm text-center transition-all"
                         />

                         <button 
                             onClick={handleSubmitPayment}
                             disabled={!transactionId || transactionId.length !== 12}
                             className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             Submit for Verification
                         </button>
                     </div>
                 </div>
             </div>

             {/* Payment History */}
             <div className="premium-card overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Payment History</h3>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-label border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Date</th>
                                <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Amount</th>
                                <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Transaction ID</th>
                                <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {myPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center text-label italic">
                                        No payments submitted yet.
                                    </td>
                                </tr>
                            ) : (
                                myPayments.map((p) => (
                                    <tr key={p.id || Math.random().toString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-10 py-6">{p.date}</td>
                                        <td className="px-10 py-6 font-black text-blue-500">₹{p.amount}</td>
                                        <td className="px-10 py-6 font-mono text-sm text-slate-500">{p.transactionId}</td>
                                        <td className="px-10 py-6">
                                            {p.status === 'success' ? (
                                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                                    Verified
                                                </span>
                                            ) : p.status === 'failed' ? (
                                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                                    Failed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    );
  }

  if (currentPage === 'settings') {
    return (
      <div className="space-y-10 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
          <div className="space-y-1">
            <h1 className="text-display text-3xl md:text-4xl lg:text-5xl mb-2">Staff <span className="text-blue-500">Management</span></h1>
            <p className="text-label text-xs md:text-sm">Configure faculty directory and school settings</p>
          </div>
          <button 
            onClick={openAddModal}
            className="btn-primary py-2.5 px-6 md:py-3 md:px-8 flex items-center justify-center gap-3 text-[10px] md:text-xs w-full md:w-auto"
          >
            <Plus size={18} className="md:w-5 md:h-5" /> Add Teacher
          </button>
        </header>

        <div className="premium-card overflow-hidden">
           <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-8 bg-slate-50/30 dark:bg-slate-900/30">
             <div>
               <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-1 flex items-center gap-3">
                 <Users size={24} className="text-blue-500" />
                 Faculty Directory
               </h3>
               <p className="text-label">Manage and view all faculty members for {currentUser?.schoolName}</p>
             </div>
           </div>
           <div className="overflow-x-auto scrollbar-hide">
             <table className="w-full text-left min-w-[1000px] border-separate border-spacing-0">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-label border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Teacher Name</th>
                  <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Designation</th>
                  <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">School ID</th>
                  <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Assigned Class</th>
                  <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Contact</th>
                  <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myTeachers.length === 0 ? (
                  <tr><td colSpan={6} className="px-10 py-20 text-center text-label italic">No teachers found for this school.</td></tr>
                ) : (
                  myTeachers.map(t => (
                    <tr key={t.uid || Math.random().toString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <img src={t.avatarUrl} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
                          </div>
                          <div>
                            <span className="font-black text-slate-900 dark:text-white block text-base tracking-tight group-hover:text-blue-500 transition-colors">{t.name}</span>
                            <span className="text-label lowercase">{t.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                          {t.designation || 'Teacher'}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <span className="font-mono text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {t.schoolID}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        {t.assignedClass ? (
                          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-4 py-1.5 rounded-xl border border-blue-500/20">
                            <BookOpen size={14} />
                            {t.assignedClass}
                          </span>
                        ) : (
                          <span className="text-label italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{t.contactNumber || 'N/A'}</span>
                          <span className="text-label">Mobile</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                            <button 
                                  onClick={() => openEditModal(t)}
                                  className="p-3 text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all border border-transparent hover:border-blue-500/20"
                                  title="Edit Teacher"
                              >
                                  <Pencil size={18} />
                              </button>
                              <button 
                                  onClick={() => handleRemoveTeacher(t.uid, t.name)}
                                  className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                                  title="Remove Teacher"
                              >
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
           </div>
        </div>

        {/* Add/Edit Teacher Modal */}
        {showAddTeacher && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10 backdrop-blur-sm">
            <div className="premium-card p-10 w-full max-w-2xl my-8 relative animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">{editingId ? 'Edit' : 'Add'} <span className="text-blue-500">Teacher</span></h2>
                    <p className="text-label">Enter faculty details below</p>
                </div>
                <button onClick={() => setShowAddTeacher(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTeacher} className="space-y-8">
                {formError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3">
                        <AlertTriangle size={16} /> {formError}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-label ml-1">Full Name</label>
                        <input 
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all" 
                            placeholder="e.g. John Doe"
                            value={teacherName}
                            onChange={e => setTeacherName(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-label ml-1">Gender</label>
                        <select
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all"
                            value={teacherGender}
                            onChange={e => setTeacherGender(e.target.value)}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-label ml-1">Designation</label>
                        <input 
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all" 
                            placeholder="e.g. H.O.D"
                            value={teacherDesignation}
                            onChange={e => setTeacherDesignation(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-label ml-1">School ID</label>
                        <input 
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-mono font-black text-sm transition-all" 
                            placeholder="e.g. TCH-101"
                            value={teacherID}
                            onChange={e => setTeacherID(e.target.value)}
                            required 
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-label ml-1">Password</label>
                    <input 
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all" 
                        placeholder="Set login password"
                        value={teacherPassword}
                        onChange={e => setTeacherPassword(e.target.value)}
                        required 
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-label ml-1">Assign Class (Optional)</label>
                        <select 
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all"
                            value={teacherGrade}
                            onChange={e => {
                                setTeacherGrade(e.target.value);
                                setTeacherSection(''); // Reset section
                            }}
                        >
                            <option value="">Select Grade</option>
                            {CLASS_GRADES.map(g => <option key={g || Math.random().toString()} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-label ml-1">Section/Stream</label>
                        <select 
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all disabled:opacity-50"
                            value={teacherSection}
                            onChange={e => setTeacherSection(e.target.value)}
                            disabled={!teacherGrade}
                        >
                            <option value="">Select Section</option>
                            {getSectionOptions(teacherGrade).map(s => <option key={s || Math.random().toString()} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Main Subject</label>
                        <input 
                            className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg" 
                            placeholder="e.g. Math"
                            value={teacherSubject}
                            onChange={e => setTeacherSubject(e.target.value)}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">House Team</label>
                        <select
                            className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                            value={teacherHouse}
                            onChange={(e) => setTeacherHouse(e.target.value as HouseTeam)}
                        >
                            <option value="">Select House</option>
                            {getHouseOptions().map(h => <option key={h || Math.random().toString()} value={h}>{h}</option>)}
                        </select>
                    </div>
                </div>

                {/* Additional Classes Section */}
                <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <div className="flex items-center justify-between">
                        <label className="text-label ml-1">Additional Classes & Subjects</label>
                        <button 
                            type="button"
                            onClick={() => setTeacherSubClasses([...teacherSubClasses, { grade: '', section: '', subject: '' }])}
                            className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        >
                            <Plus size={14} /> Add Class
                        </button>
                    </div>
                    {teacherSubClasses.map((subClass, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="col-span-4">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Grade</label>
                                <select 
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    value={subClass.grade}
                                    onChange={e => {
                                        const newSubClasses = [...teacherSubClasses];
                                        newSubClasses[index].grade = e.target.value;
                                        newSubClasses[index].section = ''; // Reset section
                                        setTeacherSubClasses(newSubClasses);
                                    }}
                                >
                                    <option value="">Select</option>
                                    {CLASS_GRADES.map(g => <option key={g || Math.random().toString()} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Section</label>
                                <select 
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50"
                                    value={subClass.section}
                                    onChange={e => {
                                        const newSubClasses = [...teacherSubClasses];
                                        newSubClasses[index].section = e.target.value;
                                        setTeacherSubClasses(newSubClasses);
                                    }}
                                    disabled={!subClass.grade}
                                >
                                    <option value="">Select</option>
                                    {getSectionOptions(subClass.grade).map(s => <option key={s || Math.random().toString()} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="col-span-4">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
                                <input 
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    placeholder="e.g. Science"
                                    value={subClass.subject}
                                    onChange={e => {
                                        const newSubClasses = [...teacherSubClasses];
                                        newSubClasses[index].subject = e.target.value;
                                        setTeacherSubClasses(newSubClasses);
                                    }}
                                />
                            </div>
                            <div className="col-span-1 flex justify-end pb-1">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const newSubClasses = [...teacherSubClasses];
                                        newSubClasses.splice(index, 1);
                                        setTeacherSubClasses(newSubClasses);
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-label ml-1">Email Address</label>
                        <input 
                            type="email"
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all" 
                            placeholder="teacher@school.com"
                            value={teacherEmail}
                            onChange={e => setTeacherEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-label ml-1">Contact Number</label>
                        <input 
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm transition-all" 
                            placeholder="10-digit number"
                            value={teacherContact}
                            onChange={e => setTeacherContact(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  {editingId && (
                      <button 
                        type="button"
                        onClick={handleDeleteFromModal}
                        className="btn-secondary py-4 px-6 text-red-500 border-red-500/20 hover:bg-red-500/10"
                        title="Delete Teacher"
                      >
                        <Trash2 size={20} />
                      </button>
                  )}
                  <button type="button" onClick={() => setShowAddTeacher(false)} className="btn-secondary flex-1 py-4">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 py-4">{editingId ? 'Update Faculty' : 'Add Teacher'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT DASHBOARD VIEW
  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-1">
          <h1 className="text-display text-3xl md:text-5xl lg:text-6xl mb-2">Morning <span className="text-blue-500">Overview</span></h1>
          <p className="text-label text-xs md:text-sm">Real-time school performance metrics</p>
        </div>
        {currentUser?.schoolName && (
            <div className="glass-surface px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm animate-float self-start md:self-auto">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-slate-900 dark:bg-white rounded-lg md:rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-black italic text-xs md:text-base">S</div>
                <span className="font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-900 dark:text-white">{currentUser.schoolName}</span>
            </div>
        )}
      </header>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 px-4 md:px-0">
        <div 
          className="premium-card p-4 md:p-8 group cursor-pointer hover:border-blue-500/30 transition-colors"
          onClick={() => setShowStaffModal(true)}
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="p-3 md:p-4 bg-slate-900 dark:bg-white rounded-xl md:rounded-2xl text-white dark:text-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-white/10 group-hover:scale-110 transition-transform">
              <Users size={20} className="md:w-6 md:h-6" />
            </div>
            <span className="hidden sm:inline-block text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] px-2 md:px-3 py-0.5 md:py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
              Live
            </span>
          </div>
          <p className="text-label text-[8px] md:text-[10px] mb-1">Total Staff</p>
          <p className="text-2xl md:text-4xl font-black tracking-tighter">{myTeachers.length}</p>
        </div>

        <div className="premium-card p-4 md:p-8 group">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="p-3 md:p-4 bg-blue-500 rounded-xl md:rounded-2xl text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <UserCheck size={20} className="md:w-6 md:h-6" />
            </div>
          </div>
          <p className="text-label text-[8px] md:text-[10px] mb-1">Students</p>
          <p className="text-2xl md:text-4xl font-black tracking-tighter">{studentsInSchool.length || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar / Events */}
        <div className="lg:col-span-3 premium-card p-6 md:p-10 mx-4 md:mx-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic mb-1">Upcoming Events</h3>
              <p className="text-label">Scheduled academic & social activities</p>
            </div>
            <button className="btn-secondary py-2 px-4 md:py-2.5 md:px-5 text-[10px] md:text-xs w-full sm:w-auto">View Calendar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { title: "Staff Meeting", time: "10:00 AM", type: "Academic", color: "blue" },
              { title: "Parent-Teacher Conf", time: "2:00 PM", type: "General", color: "purple" },
              { title: "Sports Day Prep", time: "4:00 PM", type: "Sports", color: "green" },
            ].map((event, idx) => (
              <div key={idx} className="group p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/5 active:scale-95 cursor-pointer">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className={`w-12 h-12 md:w-14 md:h-14 bg-${event.color}-500/10 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Calendar className={`text-${event.color}-500 w-5 h-5 md:w-6 md:h-6`} />
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white mb-0.5 md:mb-1">{event.title}</h4>
                    <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">{event.time} • {event.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
      
      <AlertModal 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Staff List Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10 backdrop-blur-sm px-4">
          <div className="premium-card p-6 md:p-10 w-full max-w-4xl my-8 relative animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">Staff <span className="text-blue-500">Directory</span></h2>
                  <p className="text-label">Overview of all faculty members</p>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={20} />
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-hide max-h-[60vh]">
              <table className="w-full text-left min-w-[800px] border-separate border-spacing-0">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-label border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Staff Member</th>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Post / Designation</th>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Assigned Classes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myTeachers.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-label italic">No staff found.</td></tr>
                  ) : (
                    myTeachers.map(t => (
                      <tr key={t.uid || Math.random().toString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img src={t.avatarUrl} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm" />
                            <div>
                              <span className="font-black text-slate-900 dark:text-white block text-sm tracking-tight group-hover:text-blue-500 transition-colors">{t.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{t.schoolID}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                            {t.designation || 'Teacher'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {t.assignedClass ? (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 w-fit">
                                  <BookOpen size={12} />
                                  {t.assignedClass} (Main)
                                </span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                  {t.assignedSubject || <span className="text-slate-400 italic text-xs">N/A</span>}
                                </span>
                              </div>
                            ) : (
                              <span className="text-label italic text-xs">Not Assigned</span>
                            )}
                            {t.additionalClasses && t.additionalClasses.map((ac, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                                  <BookOpen size={12} />
                                  {ac.className}
                                </span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                  {ac.subject || <span className="text-slate-400 italic text-xs">N/A</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;
