
import React, { useState, useEffect, useRef } from 'react';
import { User, StudentRecord, MarkEntry, Announcement, HouseTeam, UserRole, Assignment, Message } from '../types';
import { Book, Award, Clock, GraduationCap, Phone, Mail, User as UserIcon, Hash, Megaphone, Calendar as CalendarIcon, Shield, Flag, Globe, School, ClipboardList, ChevronLeft, ChevronRight, CheckCircle, XCircle, MessageSquare, Send, Pencil, Trash2, Plus, Paperclip, Image as ImageIcon, Smile, MoreVertical, Video, ArrowLeft, Mic } from 'lucide-react';
import { getStoredStudents, getStoredAnnouncements, getStoredUsers, getStoredAssignments, submitAssignment, getStoredMessages, addMessage, editMessage, deleteMessage } from '../services/storage';
import ConfirmModal from '../components/ConfirmModal';

interface StudentDashboardProps {
  user: User;
  currentPage?: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, currentPage = 'dashboard' }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Message Reply State
  const [replyContent, setReplyContent] = useState('');
  const [attachment, setAttachment] = useState<{name: string, url: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAttachment({
                  name: file.name,
                  url: reader.result as string,
                  type: file.type.startsWith('image/') ? 'image' : 'document'
              });
          };
          reader.readAsDataURL(file);
      }
  };
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [newMessageRecipientId, setNewMessageRecipientId] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
     // Fetch Announcements
     const allAnn = getStoredAnnouncements();
     const relevantAnn = allAnn.filter(a => 
         // Audience Filter
         (a.audience === 'all' || a.audience === 'student') &&
         // School Filter: Global (no schoolName) OR Matches User's School
         (!a.schoolName || a.schoolName === user.schoolName)
     );
     setAnnouncements(relevantAnn);

     // Fetch Assignments
     if (user.className && user.schoolName) {
         const allAssign = getStoredAssignments();
         const relevantAssign = allAssign.filter(a => 
             a.schoolName === user.schoolName && 
             a.targetClass === user.className
         );
         setAssignments(relevantAssign);
     }

     // Fetch Messages
     refreshMessages();

  }, [user]);

  useEffect(() => {
      if (currentPage === 'messages' && selectedChatUserId) {
          let hasUnread = false;
          const currentMessages = getStoredMessages();
          currentMessages.forEach(msg => {
              if (msg.receiverId === user.uid && msg.senderId === selectedChatUserId && !msg.read) {
                  msg.read = true;
                  hasUnread = true;
              }
          });
          if (hasUnread) {
              localStorage.setItem('erp_messages', JSON.stringify(currentMessages));
              refreshMessages();
          }
      }
  }, [currentPage, user.uid, selectedChatUserId]);

  const refreshMessages = () => {
      const allMessages = getStoredMessages();
      const myMessages = allMessages.filter(m => m.senderId === user.uid || m.receiverId === user.uid);
      setMessages(myMessages);
  };

  const handleSendReply = (e: React.FormEvent, teacherId: string, teacherName: string) => {
      e.preventDefault();
      if (!replyContent.trim() && !attachment) return;

      const newMessage: Message = {
          id: `msg-${Math.floor(Math.random() * 10000)}`,
          senderId: user.uid,
          senderName: user.name || "",
          receiverId: teacherId,
          receiverName: teacherName || "" || "",
          content: replyContent,
          timestamp: new Date().toISOString(),
          read: false,
          ...(attachment ? { attachment } : {})
      };

      addMessage(newMessage);
      refreshMessages();
      setReplyContent('');
      setAttachment(null);
  };

  const handleSendNewMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if ((!newMessageContent.trim() && !attachment) || !newMessageRecipientId) return;

      const allUsers = getStoredUsers();
      const recipient = allUsers.find(u => u.uid === newMessageRecipientId);
      if (!recipient) return;

      const newMessage: Message = {
          id: `msg-${Math.floor(Math.random() * 10000)}`,
          senderId: user.uid,
          senderName: user.name || "",
          receiverId: recipient.uid,
          receiverName: recipient.name || "",
          content: newMessageContent,
          timestamp: new Date().toISOString(),
          read: false,
          ...(attachment ? { attachment } : {})
      };

      addMessage(newMessage);
      setNewMessageContent('');
      setAttachment(null);
      setNewMessageRecipientId('');
      setIsNewMessageModalOpen(false);
      refreshMessages();
      setSelectedChatUserId(recipient.uid);
  };

  const handleEditMessageSubmit = (messageId: string) => {
    if (!editMessageContent.trim()) return;
    editMessage(messageId, editMessageContent);
    setEditingMessageId(null);
    setEditMessageContent('');
    refreshMessages();
  };

  const handleDeleteMessage = (messageId: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      onConfirm: () => {
        deleteMessage(messageId);
        refreshMessages();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getStudentProfile = (): StudentRecord | undefined => {
    return getStoredStudents().find(s => s.loginId === user.loginId);
  };

  const handleOfflineSubmit = (assignmentId: string) => {
    submitAssignment(assignmentId, {
      studentId: user.uid,
      studentName: user.name,
      submittedAt: new Date().toISOString(),
      isOffline: true,
      teacherVerified: 'pending',
      completionStatus: 'pending'
    });

    // Refresh assignments
    if (user.className && user.schoolName) {
        const allAssign = getStoredAssignments();
        const relevantAssign = allAssign.filter(a => 
            a.schoolName === user.schoolName && 
            a.targetClass === user.className
        );
        setAssignments(relevantAssign);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, assignmentId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('File size must be less than 5MB.');
      return;
    }

    setUploadError(null);
    setUploadingAssignmentId(assignmentId);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        submitAssignment(assignmentId, {
          studentId: user.uid,
          studentName: user.name,
          submittedAt: new Date().toISOString(),
          fileData: base64String,
          fileName: file.name
        });

        // Refresh assignments
        if (user.className && user.schoolName) {
            const allAssign = getStoredAssignments();
            const relevantAssign = allAssign.filter(a => 
                a.schoolName === user.schoolName && 
                a.targetClass === user.className
            );
            setAssignments(relevantAssign);
        }
        setUploadingAssignmentId(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Failed to upload file. Please try again.');
      setUploadingAssignmentId(null);
    }
  };

  const calculateGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

   const getHouseColor = (house?: HouseTeam) => {
    if (!house) return 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    
    if (house.includes('Green')) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (house.includes('Blue')) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    if (house.includes('Yellow')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    if (house.includes('Red')) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';

    return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800';
  };

  const renderCalendar = () => {
    const profile = getStudentProfile();
    const history = profile?.attendanceHistory || {};
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-8 md:h-10"></div>);
    }
    
    let presentCount = 0;
    let absentCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const status = history[dateStr];
        
        let bgColor = "bg-slate-50 dark:bg-slate-800/50 text-slate-400";
        let borderColor = "border-slate-100 dark:border-slate-800";
        
        if (status === true) {
            bgColor = "bg-green-500 text-white shadow-sm shadow-green-500/20";
            borderColor = "border-green-600";
            presentCount++;
        } else if (status === false) {
            bgColor = "bg-red-500 text-white shadow-sm shadow-red-500/20";
            borderColor = "border-red-600";
            absentCount++;
        }

        const isToday = dateStr === new Date().toISOString().split('T')[0];
        if (isToday && status === undefined) {
             borderColor = "border-blue-500";
             bgColor = "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
        }

        days.push(
            <div 
                key={d} 
                className={`h-8 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm font-bold border ${bgColor} ${borderColor} transition-all hover:scale-105 cursor-default`}
                title={status === true ? 'Present' : status === false ? 'Absent' : 'No Record'}
            >
                {d}
            </div>
        );
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const totalRecorded = presentCount + absentCount;
    const attendancePercentage = totalRecorded === 0 ? 0 : Math.round((presentCount / totalRecorded) * 100);

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 md:col-span-2 lg:col-span-1 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                    <CalendarIcon className="text-blue-500" size={20} />
                    Attendance
                </h2>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                    <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"><ChevronLeft size={16} /></button>
                    <span className="text-xs font-bold w-24 text-center text-slate-700 dark:text-slate-300">{monthNames[currentMonth]} {currentYear}</span>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"><ChevronRight size={16} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{day}</div>
                ))}
                {days}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Present</p>
                    <p className="text-xl font-black text-green-500">{presentCount}</p>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Absent</p>
                    <p className="text-xl font-black text-red-500">{absentCount}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Rate</p>
                    <p className={`text-xl font-black ${attendancePercentage >= 75 ? 'text-blue-500' : 'text-orange-500'}`}>{attendancePercentage}%</p>
                </div>
            </div>
        </div>
    );
  };

  if (currentPage === 'teachers') {
      const studentProfile = getStudentProfile();
      const allUsers = getStoredUsers();
      
      // Filter teachers: Must match Role, School, and Class (main or additional).
      const myTeachers = allUsers.filter(u => {
          if (u.role !== UserRole.TEACHER || u.schoolName !== user.schoolName) return false;
          
          const isMainClass = u.assignedClass === studentProfile?.className;
          const isAdditionalClass = u.additionalClasses?.some(ac => ac.className === studentProfile?.className);
          
          return isMainClass || isAdditionalClass;
      });

      return (
          <div className="space-y-6">
              <header className="mb-6">
                 <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Teachers</h1>
                 <p className="text-slate-500 dark:text-slate-400">Faculty directory for Class {studentProfile?.className || 'N/A'} at {user.schoolName}</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTeachers.length === 0 ? (
                      <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400">
                           <UserIcon size={48} className="mx-auto mb-4 opacity-20" />
                           <p>No specific class teachers found for your school.</p>
                      </div>
                  ) : (
                      myTeachers.map(teacher => {
                          const isMainClass = teacher.assignedClass === studentProfile?.className;
                          const additionalClass = teacher.additionalClasses?.find(ac => ac.className === studentProfile?.className);
                          const subjectForStudent = isMainClass ? teacher.assignedSubject : additionalClass?.subject;

                          return (
                          <div key={teacher.uid} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                              <div className="p-6 flex flex-col items-center text-center border-b border-slate-50 dark:border-slate-800">
                                  <img 
                                      src={teacher.avatarUrl} 
                                      alt={teacher.name} 
                                      className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 object-cover mb-4 border-4 border-white dark:border-slate-700 shadow-sm"
                                  />
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{teacher.name}</h3>
                                  <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">{subjectForStudent || 'Teacher'}</p>
                                  <p className="text-slate-400 text-xs mt-1">{teacher.designation}</p>
                              </div>
                              <div className="p-4 bg-slate-50 dark:bg-slate-800 space-y-3">
                                  <div className="flex items-center gap-3 text-sm">
                                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-400 shadow-sm">
                                          <Mail size={16} />
                                      </div>
                                      <div className="overflow-hidden">
                                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Email</p>
                                          <p className="text-slate-700 dark:text-slate-300 truncate" title={teacher.email || 'N/A'}>
                                              {teacher.email || <span className="text-slate-400 italic">Not Available</span>}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm">
                                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-400 shadow-sm">
                                          <Phone size={16} />
                                      </div>
                                      <div>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Contact</p>
                                          <p className="text-slate-700 dark:text-slate-300">
                                              {teacher.contactNumber || <span className="text-slate-400 italic">Not Available</span>}
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          );
                      })
                  )}
              </div>
          </div>
      );
  }

  if (currentPage === 'announcements') {
      return (
          <div className="space-y-6">
              <header className="mb-6">
                 <h1 className="text-2xl font-bold text-slate-800 dark:text-white">News & Events</h1>
                 <p className="text-slate-500 dark:text-slate-400">Latest updates from the school administration.</p>
              </header>

              <div className="grid gap-6">
                 {announcements.length === 0 ? (
                     <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400">
                         <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                         <p>No announcements at this time.</p>
                     </div>
                 ) : (
                     announcements.map(ann => (
                         <div key={ann.id} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-blue-500">
                             <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <h3 className="font-bold text-lg text-slate-800 dark:text-white">{ann.title}</h3>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{ann.date} • From {ann.author}</span>
                                        {!ann.schoolName && (
                                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full border border-purple-100 dark:border-purple-800">
                                                <Globe size={10} /> Global
                                            </span>
                                        )}
                                        {ann.schoolName && (
                                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800">
                                                <School size={10} /> {ann.schoolName}
                                            </span>
                                        )}
                                     </div>
                                 </div>
                             </div>
                             <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                         </div>
                     ))
                 )}
              </div>
          </div>
      );
  }

  if (currentPage === 'assignments') {
      return (
          <div className="space-y-6">
              <header className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Assignments</h1>
                  <p className="text-slate-500 dark:text-slate-400">Tasks and homework for your class.</p>
              </header>

              <div className="grid grid-cols-1 gap-6">
                  {assignments.length === 0 ? (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400">
                          <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No assignments found for your class at this time.</p>
                      </div>
                  ) : (
                      assignments.map(assign => {
                          const mySubmission = assign.submissions?.find(s => s.studentId === user.uid);
                          return (
                          <div key={assign.id} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-purple-500">
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">{assign.title}</h3>
                                      <div className="flex flex-wrap items-center gap-2 mt-2">
                                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800">{assign.subject}</span>
                                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><UserIcon size={12}/> {assign.authorName}</span>
                                          <span className="text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1"><Clock size={12}/> Due: {assign.dueDate}</span>
                                      </div>
                                  </div>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">{assign.content}</p>
                              
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                  {mySubmission ? (
                                      <div className="flex flex-col gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                                          <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                  <CheckCircle size={18} />
                                                  <div>
                                                      <p className="font-medium text-sm">
                                                          {mySubmission.isOffline ? 'Submitted Offline' : 'Submitted'}
                                                      </p>
                                                      <p className="text-xs opacity-80">{new Date(mySubmission.submittedAt).toLocaleString()}</p>
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  {mySubmission.fileName && (
                                                      <span className="text-xs font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-green-200 dark:border-green-700 text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={mySubmission.fileName}>
                                                          {mySubmission.fileName}
                                                      </span>
                                                  )}
                                                  <label className="cursor-pointer text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 transition-colors">
                                                      {uploadingAssignmentId === assign.id ? 'Uploading...' : 'Re-upload'}
                                                      <input 
                                                          type="file" 
                                                          accept="application/pdf" 
                                                          className="hidden" 
                                                          onChange={(e) => handleFileUpload(e, assign.id)}
                                                          disabled={uploadingAssignmentId === assign.id}
                                                      />
                                                  </label>
                                              </div>
                                          </div>
                                          
                                          {/* Teacher Status */}
                                          <div className="flex items-center gap-4 text-xs border-t border-green-200 dark:border-green-800/50 pt-2 mt-1">
                                              <div className="flex items-center gap-1">
                                                  <span className="text-slate-500 dark:text-slate-400">Teacher Status:</span>
                                                  <span className={`font-medium ${
                                                      mySubmission.teacherVerified === 'verified' ? 'text-green-600 dark:text-green-400' :
                                                      mySubmission.teacherVerified === 'rejected' ? 'text-red-600 dark:text-red-400' :
                                                      'text-amber-600 dark:text-amber-400'
                                                  }`}>
                                                      {mySubmission.teacherVerified === 'verified' ? 'Verified' :
                                                       mySubmission.teacherVerified === 'rejected' ? 'Rejected' : 'Pending Review'}
                                                  </span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                  <span className="text-slate-500 dark:text-slate-400">Completion:</span>
                                                  <span className={`font-medium ${
                                                      mySubmission.completionStatus === 'complete' ? 'text-green-600 dark:text-green-400' :
                                                      mySubmission.completionStatus === 'incomplete' ? 'text-red-600 dark:text-red-400' :
                                                      'text-amber-600 dark:text-amber-400'
                                                  }`}>
                                                      {mySubmission.completionStatus === 'complete' ? 'Complete' :
                                                       mySubmission.completionStatus === 'incomplete' ? 'Incomplete' : 'Pending'}
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex items-center justify-between">
                                          <p className="text-sm text-slate-500 dark:text-slate-400">Not submitted yet</p>
                                          <div className="flex items-center gap-3">
                                              <button 
                                                  onClick={() => handleOfflineSubmit(assign.id)}
                                                  className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
                                              >
                                                  Mark as Submitted Offline
                                              </button>
                                              <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                                  {uploadingAssignmentId === assign.id ? (
                                                      <span>Uploading...</span>
                                                  ) : (
                                                      <>
                                                          <ClipboardList size={16} />
                                                          <span>Upload PDF</span>
                                                      </>
                                                  )}
                                                  <input 
                                                      type="file" 
                                                      accept="application/pdf" 
                                                      className="hidden" 
                                                      onChange={(e) => handleFileUpload(e, assign.id)}
                                                      disabled={uploadingAssignmentId === assign.id}
                                                  />
                                              </label>
                                          </div>
                                      </div>
                                  )}
                                  {uploadError && uploadingAssignmentId === assign.id && (
                                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                          <XCircle size={12} /> {uploadError}
                                      </p>
                                  )}
                              </div>
                          </div>
                          );
                      })
                  )}
              </div>
          </div>
      );
  }

  if (currentPage === 'grades') {
    const studentProfile = getStudentProfile();
    const marks = studentProfile?.marks || [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Academic Transcript</h1>
            
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4">Mid-Term</th>
                            <th className="px-6 py-4">Finals</th>
                            <th className="px-6 py-4">Avg Score</th>
                            <th className="px-6 py-4">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {marks.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No grades available yet.</td></tr>
                        ) : (
                            marks.map((m, i) => {
                                const avg = (m.midTerm + m.final) / 2;
                                return (
                                    <tr key={i}>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{m.subject}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{m.midTerm}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{m.final}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{avg.toFixed(1)}</td>
                                        <td className={`px-6 py-4 font-bold ${avg >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                            {calculateGrade(avg)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            {studentProfile && studentProfile.gradeAverage > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex justify-between items-center">
                    <span>Cumulative Grade Average</span>
                    <span className="font-bold text-lg">{studentProfile.gradeAverage}%</span>
                </div>
            )}
        </div>
    )
  }

  if (currentPage === 'messages') {
      const chatGroups = messages.reduce((acc, msg) => {
          const otherId = msg.senderId === user.uid ? msg.receiverId : msg.senderId;
          const otherName = msg.senderId === user.uid ? msg.receiverName : msg.senderName;
          
          if (!acc[otherId]) {
              acc[otherId] = {
                  userId: otherId,
                  userName: otherName,
                  messages: [],
                  unreadCount: 0,
                  lastMessageTime: msg.timestamp
              };
          }
          acc[otherId].messages.push(msg);
          if (msg.receiverId === user.uid && !msg.read) {
              acc[otherId].unreadCount++;
          }
          if (new Date(msg.timestamp) > new Date(acc[otherId].lastMessageTime)) {
              acc[otherId].lastMessageTime = msg.timestamp;
          }
          return acc;
      }, {} as Record<string, { userId: string, userName: string, messages: Message[], unreadCount: number, lastMessageTime: string }>);

      const conversations = (Object.values(chatGroups) as { userId: string, userName: string, messages: Message[], unreadCount: number, lastMessageTime: string }[]).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      const selectedConversation = selectedChatUserId ? chatGroups[selectedChatUserId] : null;

      const studentProfile = getStudentProfile();
      const allUsers = getStoredUsers();
      
      // Filter teachers: Must match Role, School, and Class (main or additional).
      const myTeachers = allUsers.filter(u => {
          if (u.role !== UserRole.TEACHER || u.schoolName !== user.schoolName) return false;
          
          const isMainClass = u.assignedClass === studentProfile?.className;
          const isAdditionalClass = u.additionalClasses?.some(ac => ac.className === studentProfile?.className);
          
          return isMainClass || isAdditionalClass;
      });

      return (
          <div className="h-[calc(100vh-120px)] flex flex-col">
              <ConfirmModal 
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
              />
              {isNewMessageModalOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
                          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">New Message</h2>
                          <form onSubmit={handleSendNewMessage} className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Teacher</label>
                                  <select 
                                      value={newMessageRecipientId}
                                      onChange={(e) => setNewMessageRecipientId(e.target.value)}
                                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                      required
                                  >
                                      <option value="">-- Select a teacher --</option>
                                      {myTeachers.map(teacher => (
                                          <option key={teacher.uid} value={teacher.uid}>{teacher.name} ({teacher.assignedSubject || 'Teacher'})</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                                  <textarea 
                                      value={newMessageContent}
                                      onChange={(e) => setNewMessageContent(e.target.value)}
                                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                      rows={4}
                                      placeholder="Type your message here..."
                                  />
                              </div>
                              {attachment && (
                                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          {attachment.type === 'image' ? (
                                              <img src={attachment.url} alt="attachment" className="w-10 h-10 object-cover rounded" />
                                          ) : (
                                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded flex items-center justify-center">
                                                  <Paperclip size={20} />
                                              </div>
                                          )}
                                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{attachment.name}</span>
                                      </div>
                                      <button 
                                          type="button" 
                                          onClick={() => setAttachment(null)}
                                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                      >
                                          <XCircle size={20} />
                                      </button>
                                  </div>
                              )}
                              <div className="flex justify-between items-center pt-2">
                                  <button 
                                      type="button" 
                                      onClick={() => fileInputRef.current?.click()}
                                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                                  >
                                      <Paperclip size={20} />
                                  </button>
                                  <div className="flex justify-end gap-3">
                                      <button 
                                          type="button"
                                          onClick={() => setIsNewMessageModalOpen(false)}
                                          className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                      >
                                          Cancel
                                      </button>
                                      <button 
                                          type="submit"
                                          disabled={!newMessageRecipientId || (!newMessageContent.trim() && !attachment)}
                                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors"
                                      >
                                          Send Message
                                      </button>
                                  </div>
                              </div>
                          </form>
                      </div>
                  </div>
              )}
              <header className="mb-4 shrink-0">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Messages</h1>
                  <p className="text-slate-500 dark:text-slate-400">Direct messages with your teachers</p>
              </header>

              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,.pdf,.doc,.docx,.txt"
              />

              <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex shadow-xl shadow-slate-200/40 dark:shadow-none min-h-0 relative">
                  {/* Sidebar */}
                  <div className={`w-full md:w-[350px] border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col bg-white dark:bg-slate-900 transition-transform duration-300 ${selectedChatUserId ? 'hidden md:flex' : 'flex'}`}>
                      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                          <h2 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                              Messages
                          </h2>
                          <div className="flex items-center gap-2">
                              <button 
                                  onClick={() => setIsNewMessageModalOpen(true)}
                                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                  title="New Message"
                              >
                                  <Plus size={20} />
                              </button>
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                          {conversations.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                      <MessageSquare size={24} className="opacity-40" />
                                  </div>
                                  <p className="text-sm font-medium">No conversations yet.</p>
                                  <p className="text-xs mt-1 opacity-70">Click + to start chatting.</p>
                              </div>
                          ) : (
                              conversations.map(conv => (
                                  <button 
                                      key={conv.userId}
                                      onClick={() => setSelectedChatUserId(conv.userId)}
                                      className={`w-full text-left p-3 transition-all flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50 ${selectedChatUserId === conv.userId ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                  >
                                      <div className="relative">
                                          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600">
                                              {conv.userName.charAt(0)}
                                          </div>
                                          {conv.unreadCount > 0 && (
                                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                  {conv.unreadCount}
                                              </div>
                                          )}
                                      </div>
                                      <div className="flex-1 min-w-0 py-1">
                                          <div className="flex justify-between items-baseline mb-0.5">
                                              <h3 className="font-semibold text-[15px] truncate text-slate-900 dark:text-slate-100">{conv.userName}</h3>
                                              <span className={`text-xs shrink-0 ${conv.unreadCount > 0 ? 'text-green-500 font-semibold' : 'text-slate-400'}`}>
                                                  {new Date(conv.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                              </span>
                                          </div>
                                          <p className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                              {conv.messages[conv.messages.length - 1].senderId === user.uid ? 'You: ' : ''}
                                              {conv.messages[conv.messages.length - 1].content}
                                          </p>
                                      </div>
                                  </button>
                              ))
                          )}
                      </div>
                  </div>

                  {/* Chat Area */}
                  <div className={`flex-1 flex flex-col bg-slate-50/80 dark:bg-slate-900/80 relative ${!selectedChatUserId ? 'hidden md:flex' : 'flex'}`}>
                      {/* Premium background pattern */}
                      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-indigo-900/10 pointer-events-none"></div>
                      
                      {selectedConversation ? (
                          <>
                              {/* Chat Header */}
                              <div className="px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10 border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <button 
                                          onClick={() => setSelectedChatUserId(null)}
                                          className="md:hidden p-1 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                                      >
                                          <ChevronLeft size={24} />
                                      </button>
                                      <div className="relative">
                                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 cursor-pointer">
                                              {selectedConversation.userName.charAt(0)}
                                          </div>
                                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                      </div>
                                      <div className="cursor-pointer">
                                          <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{selectedConversation.userName}</h3>
                                          <p className="text-xs text-green-500 font-medium">Online</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                      {/* Removed non-functional buttons (Video, Phone, MoreVertical) as requested */}
                                  </div>
                              </div>
                              
                              {/* Messages List */}
                              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col z-0">
                                  {selectedConversation.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(msg => {
                                      const isSentByMe = msg.senderId === user.uid;
                                      return (
                                          <div key={msg.id} className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'} group`}>
                                              {editingMessageId === msg.id ? (
                                                  <div className="flex flex-col gap-2 w-full max-w-[85%] md:max-w-[70%] bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
                                                      <textarea
                                                          value={editMessageContent}
                                                          onChange={(e) => setEditMessageContent(e.target.value)}
                                                          className="w-full bg-slate-50 dark:bg-slate-900 border-transparent rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                                          rows={3}
                                                      />
                                                      <div className="flex justify-end gap-2 mt-1">
                                                          <button
                                                              onClick={() => {
                                                                  setEditingMessageId(null);
                                                                  setEditMessageContent('');
                                                              }}
                                                              className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                          >
                                                              Cancel
                                                          </button>
                                                          <button
                                                              onClick={() => handleEditMessageSubmit(msg.id)}
                                                              disabled={!editMessageContent.trim() || editMessageContent === msg.content}
                                                              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-sm"
                                                          >
                                                              Save
                                                          </button>
                                                      </div>
                                                  </div>
                                              ) : (
                                                  <div className={`relative max-w-[85%] md:max-w-[70%] px-4 py-2.5 shadow-md ${
                                                      isSentByMe 
                                                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-blue-500/20' 
                                                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700/50'
                                                  }`}>
                                                      {msg.attachment && (
                                                          <div className="mb-2">
                                                              {msg.attachment.type === 'image' ? (
                                                                  <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer">
                                                                      <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-full h-auto rounded-lg max-h-48 object-cover" />
                                                                  </a>
                                                              ) : (
                                                                  <a href={msg.attachment.url} download={msg.attachment.name} className={`flex items-center gap-2 p-2 rounded-lg ${isSentByMe ? 'bg-white/20 hover:bg-white/30' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'} transition-colors`}>
                                                                      <Paperclip size={16} />
                                                                      <span className="text-sm truncate max-w-[150px]">{msg.attachment.name}</span>
                                                                  </a>
                                                              )}
                                                          </div>
                                                      )}
                                                      {msg.content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>}
                                                      
                                                      <div className={`flex items-center gap-1.5 mt-1.5 justify-end ${isSentByMe ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                                          {msg.isEdited && (
                                                              <span className="text-[10px] italic">edited</span>
                                                          )}
                                                          <span className="text-[10px] font-medium">
                                                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                          </span>
                                                          {isSentByMe && (
                                                              <span className="text-blue-200">
                                                                  <svg viewBox="0 0 16 15" width="14" height="13" className="fill-current"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                                              </span>
                                                          )}
                                                      </div>
                                                  </div>
                                              )}
                                              
                                              {/* Actions menu (hover) */}
                                              {isSentByMe && !editingMessageId && (
                                                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                                      <button
                                                          onClick={() => {
                                                              setEditingMessageId(msg.id);
                                                              setEditMessageContent(msg.content);
                                                          }}
                                                          className="p-1.5 text-slate-500 hover:text-blue-600 bg-white/80 dark:bg-slate-800/80 rounded-full transition-colors backdrop-blur-sm shadow-sm"
                                                          title="Edit message"
                                                      >
                                                          <Pencil size={12} />
                                                      </button>
                                                      <button
                                                          onClick={() => handleDeleteMessage(msg.id)}
                                                          className="p-1.5 text-slate-500 hover:text-red-600 bg-white/80 dark:bg-slate-800/80 rounded-full transition-colors backdrop-blur-sm shadow-sm"
                                                          title="Delete message"
                                                      >
                                                          <Trash2 size={12} />
                                                      </button>
                                                  </div>
                                              )}
                                          </div>
                                      );
                                  })}
                              </div>
                              
                              {/* Input Area */}
                              <div className="p-3 sm:p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 border-t border-slate-200/60 dark:border-slate-800/60">
                                  {attachment && (
                                      <div className="max-w-4xl mx-auto mb-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                              {attachment.type === 'image' ? (
                                                  <img src={attachment.url} alt="attachment" className="w-10 h-10 object-cover rounded" />
                                              ) : (
                                                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded flex items-center justify-center">
                                                      <Paperclip size={20} />
                                                  </div>
                                              )}
                                              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{attachment.name}</span>
                                          </div>
                                          <button 
                                              type="button" 
                                              onClick={() => setAttachment(null)}
                                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                          >
                                              <XCircle size={20} />
                                          </button>
                                      </div>
                                  )}
                                  <form onSubmit={(e) => handleSendReply(e, selectedConversation.userId, selectedConversation.userName)} className="flex gap-2 items-end max-w-4xl mx-auto">
                                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-3xl border border-transparent focus-within:border-blue-500/30 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner flex items-end overflow-hidden">
                                          <button 
                                              type="button" 
                                              onClick={() => fileInputRef.current?.click()}
                                              className="p-3 text-slate-400 hover:text-blue-500 transition-colors shrink-0"
                                          >
                                              <Paperclip size={20} />
                                          </button>
                                          <textarea 
                                              value={replyContent}
                                              onChange={(e) => setReplyContent(e.target.value)}
                                              onKeyDown={(e) => {
                                                  if (e.key === 'Enter' && !e.shiftKey) {
                                                      e.preventDefault();
                                                      if (replyContent.trim() || attachment) {
                                                          handleSendReply(e, selectedConversation.userId, selectedConversation.userName);
                                                      }
                                                  }
                                              }}
                                              placeholder="Message..."
                                              className="w-full bg-transparent py-3 pr-5 text-[15px] text-slate-800 dark:text-slate-200 outline-none resize-none max-h-32 min-h-[48px]"
                                              rows={1}
                                          />
                                      </div>
                                      <button 
                                          type="submit" 
                                          disabled={!replyContent.trim() && !attachment}
                                          className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:opacity-90 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 shrink-0 mb-0.5"
                                      >
                                          <Send size={18} className="ml-1" />
                                      </button>
                                  </form>
                              </div>
                          </>
                      ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 z-10 bg-slate-50 dark:bg-[#222e35] border-l border-slate-200 dark:border-slate-800">
                              <div className="w-64 h-64 mb-8 opacity-50">
                                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-300 dark:text-slate-600" fill="currentColor">
                                      <path d="M50 10C27.9 10 10 27.9 10 50c0 8.5 2.7 16.4 7.3 22.9L13 90l17.1-4.3c6.5 4.6 14.4 7.3 22.9 7.3 22.1 0 40-17.9 40-40S72.1 10 50 10zm0 75c-7.3 0-14.2-2.3-19.9-6.3l-1.4-.9-10.9 2.7 2.8-10.6-.9-1.5C15.3 62.6 13 56.5 13 50c0-20.4 16.6-37 37-37s37 16.6 37 37-16.6 37-37 37z" />
                                      <path d="M33 45h34v6H33zm0-12h34v6H33zm0 24h24v6H33z" />
                                  </svg>
                              </div>
                              <h2 className="text-3xl font-light text-slate-700 dark:text-slate-200 mb-4">Nexus Chat</h2>
                              <p className="text-sm text-center max-w-md leading-relaxed">
                                  Select a conversation from the sidebar to start messaging your teachers.
                                  <br />Messages are end-to-end encrypted.
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  const studentProfile = getStudentProfile();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
      <header className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <div className="relative">
            <img 
              src={user.avatarUrl} 
              alt="Profile" 
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white/20 bg-slate-800 object-cover shadow-2xl"
            />
            {studentProfile?.house && (
              <div className={`absolute -bottom-3 -right-3 w-10 h-10 rounded-xl border-4 border-indigo-800 flex items-center justify-center shadow-lg ${getHouseColor(studentProfile.house)}`}>
                <Flag size={16} />
              </div>
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Hello, {user.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-blue-100 font-mono text-sm">
              <span className="bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10 flex items-center gap-2">
                <Hash size={14} /> {user.loginId}
              </span>
              <span className="bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10 flex items-center gap-2">
                <Book size={14} /> Class {user.className || 'N/A'}
              </span>
              {studentProfile?.rollNumber && (
                <span className="bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10 flex items-center gap-2">
                  <UserIcon size={14} /> Roll: {studentProfile.rollNumber}
                </span>
              )}
            </div>
            {user.schoolName && (
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                <School size={14} /> {user.schoolName}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Profile Details Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
            <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                <UserIcon className="text-indigo-500" size={20} />
                Student Details
            </h2>
            <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Date of Birth</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{studentProfile?.dob || 'Not provided'}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Age</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{studentProfile?.age ? `${studentProfile.age} years` : 'Not provided'}</p>
                    </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Gender</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{studentProfile?.gender || 'Not provided'}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate">{studentProfile?.email || user.email || 'Not provided'}</span>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Emergency Contacts</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            <Phone size={14} className="text-slate-400" />
                            <span>Father: {studentProfile?.fatherContact || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            <Phone size={14} className="text-slate-400" />
                            <span>Mother: {studentProfile?.motherContact || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {studentProfile?.studentPost && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-500 mb-1 flex items-center gap-1">
                            <Shield size={12} /> Leadership Role
                        </p>
                        <p className="text-sm font-black text-yellow-800 dark:text-yellow-400">{studentProfile.studentPost}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Attendance Calendar */}
        {renderCalendar()}

        {/* Recent Grades */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <Award className="text-yellow-500" size={20} />
                Recent Grades
              </h2>
              {studentProfile && studentProfile.gradeAverage > 0 && (
                  <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-500">Avg</span>
                      <span className="text-sm font-black text-green-700 dark:text-green-400">{studentProfile.gradeAverage}%</span>
                  </div>
              )}
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {studentProfile?.marks?.slice(0, 4)?.map((item, idx) => {
                const score = (item.midTerm + item.final) / 2;
                const grade = calculateGrade(score);
                const isPassing = score >= 60;
                return (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${isPassing ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {grade}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.subject}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Latest Assessment</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-black text-slate-800 dark:text-white">{score.toFixed(1)}%</span>
                        </div>
                    </div>
                );
            })}
             {(!studentProfile?.marks || studentProfile?.marks?.length === 0) && (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 opacity-60">
                     <GraduationCap size={40} />
                     <p className="text-sm font-medium">No grades recorded yet.</p>
                 </div>
             )}
          </div>
        </div>

        {/* Assignments (Dashboard View) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 md:col-span-2 lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <ClipboardList className="text-purple-500" size={20} />
                Active Assignments
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {assignments.slice(0, 3).map(assign => (
                 <div key={assign.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/5 transition-all cursor-pointer group bg-slate-50 dark:bg-slate-800/30">
                    <div className="flex justify-between items-start mb-3">
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800">{assign.subject}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> Due {assign.dueDate}
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate mb-2">{assign.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{assign.content}</p>
                </div>
             ))}
             {assignments.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-400 space-y-3 opacity-60">
                    <ClipboardList size={48} />
                    <p className="text-sm font-medium">No assignments due at the moment.</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
