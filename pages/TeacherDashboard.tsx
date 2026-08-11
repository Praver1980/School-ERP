
import React, { useState, useEffect, useRef } from 'react';
import { StudentRecord, User, UserRole, MarkEntry, Announcement, HouseTeam, SchoolConfig, Assignment, Message } from '../types';
import { getStoredStudents, addStudent, updateStudent, generateId, getStoredUsers, addUser, updateUser, getStoredAnnouncements, saveAllStudents, removeStudent, removeStudent as removeUserFromDb, removeUser, getStoredSchools, getStoredAssignments, addAssignment, deleteAssignment, updateSubmissionStatus, getStoredMessages, addMessage, editMessage, deleteMessage } from '../services/storage';
import { CheckSquare, Square, Save, UserPlus, Pencil, GraduationCap, Plus, Trash2, Megaphone, SortAsc, Calendar, Shield, Flag, User as UserIcon, AlertCircle, Eye, EyeOff, Lock, Globe, School, CheckCircle, XCircle, Calculator, ClipboardList, Download, MessageSquare, Send, MoreVertical, ChevronLeft, Video, Phone, Smile, Paperclip, Image as ImageIcon, Mic } from 'lucide-react';
import { CLASS_GRADES, SECTIONS_JUNIOR, SECTIONS_SENIOR } from '../constants';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

interface Props {
  currentPage?: string;
  currentUser: User;
}

const TeacherDashboard: React.FC<Props> = ({ currentPage = 'dashboard', currentUser }) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [alertState, setAlertState] = useState<{ isOpen: boolean, title?: string, message: string }>({ isOpen: false, message: '' });
  
  const [currentSchoolConfig, setCurrentSchoolConfig] = useState<SchoolConfig | null>(null);

  // Get all classes assigned to this teacher
  const allAssignedClasses = [
    ...(currentUser.assignedClass ? [{ className: currentUser.assignedClass, subject: currentUser.assignedSubject || '' }] : []),
    ...(currentUser.additionalClasses || [])
  ];

  const [selectedClassObj, setSelectedClassObj] = useState<{className: string, subject: string}>(allAssignedClasses[0] || {className: '', subject: ''});
  const selectedClass = selectedClassObj.className;

  // Attendance State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Profile Edit State
  const [editHouseMode, setEditHouseMode] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<HouseTeam>(currentUser.house || '');

  // Form Error State
  const [formError, setFormError] = useState('');

  // Student Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male'); 
  const [schoolID, setSchoolID] = useState('');
  const [password, setPassword] = useState(''); 
  
  // Split Class State
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');

  const [email, setEmail] = useState('');
  const [fatherContact, setFatherContact] = useState('');
  const [motherContact, setMotherContact] = useState('');
  const [house, setHouse] = useState<HouseTeam>('');
  const [studentPost, setStudentPost] = useState('');

  // Marks Form State
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [currentMarksStudent, setCurrentMarksStudent] = useState<StudentRecord | null>(null);
  const [marksList, setMarksList] = useState<MarkEntry[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newMidTerm, setNewMidTerm] = useState('');
  const [newFinal, setNewFinal] = useState('');

  // Assignment Form State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignSubject, setAssignSubject] = useState('');
  const [assignContent, setAssignContent] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignGrade, setAssignGrade] = useState('');
  const [assignSection, setAssignSection] = useState('');

  // Message Form State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTargetStudent, setMessageTargetStudent] = useState<StudentRecord | null>(null);
  const [messageContent, setMessageContent] = useState('');
  
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
                  type: file.type.startsWith('image/') ? 'image' : 'file'
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

  useEffect(() => {
    // Load students and sort by roll number initially for display consistency
    const loadedStudents = getStoredStudents();
    
    // FILTER: Only show students in the Teacher's School AND Assigned Class
    const schoolStudents = loadedStudents.filter(s => 
        s.schoolName === currentUser.schoolName &&
        s.className === selectedClass
    );
    
    const sortedStudents = schoolStudents.sort((a, b) => a.rollNumber - b.rollNumber);
    setStudents(sortedStudents);

    setUsers(getStoredUsers());
    
    // Fetch and filter announcements
    const allAnn = getStoredAnnouncements();
    const relevantAnn = allAnn.filter(a => 
        // Audience filter
        (a.audience === 'all' || a.audience === 'teacher') && 
        // School Filter: Global (no schoolName) OR Matches User's School
        (!a.schoolName || a.schoolName === currentUser.schoolName)
    );
    setAnnouncements(relevantAnn);

    // Fetch Assignments
    refreshAssignments();

    // Fetch Messages
    refreshMessages();

    // Fetch School Config
    if (currentUser.schoolName) {
        const schools = getStoredSchools();
        const mySchool = schools.find(s => s.name === currentUser.schoolName);
        if (mySchool) setCurrentSchoolConfig(mySchool.config);
    }
  }, [currentUser, selectedClass]);

  useEffect(() => {
      if (currentPage === 'messages' && selectedChatUserId) {
          let hasUnread = false;
          const currentMessages = getStoredMessages();
          currentMessages.forEach(msg => {
              if (msg.receiverId === currentUser.uid && msg.senderId === selectedChatUserId && !msg.read) {
                  msg.read = true;
                  hasUnread = true;
              }
          });
          if (hasUnread) {
              localStorage.setItem('erp_messages', JSON.stringify(currentMessages));
              refreshMessages();
          }
      }
  }, [currentPage, currentUser.uid, selectedChatUserId]);

  const refreshAssignments = () => {
      const allAssign = getStoredAssignments();
      // Only show assignments from this school created by this teacher
      const myAssign = allAssign.filter(a => 
          a.schoolName === currentUser.schoolName && 
          a.teacherUid === currentUser.uid
      );
      setAssignments(myAssign);
  };

  const refreshMessages = () => {
      const allMessages = getStoredMessages();
      const myMessages = allMessages.filter(m => m.senderId === currentUser.uid || m.receiverId === currentUser.uid);
      setMessages(myMessages);
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageTargetStudent || !messageContent.trim()) return;

      const targetUser = users.find(u => u.schoolID === messageTargetStudent.schoolID);
      if (!targetUser) {
          setAlertState({ isOpen: true, title: 'Error', message: 'Could not find user account for this student.' });
          return;
      }

      const newMessage: Message = {
          id: generateId('msg'),
          senderId: currentUser.uid,
          senderName: currentUser.name,
          receiverId: targetUser.uid,
          receiverName: messageTargetStudent.name,
          content: messageContent,
          timestamp: new Date().toISOString(),
          read: false
      };

      addMessage(newMessage);
      refreshMessages();
      setShowMessageModal(false);
      setMessageContent('');
      setAlertState({ isOpen: true, message: 'Message sent successfully!' });
  };

  const handleSendReply = (e: React.FormEvent, studentId: string, studentName: string) => {
      e.preventDefault();
      if (!replyContent.trim() && !attachment) return;

      const newMessage: Message = {
          id: `msg-${Math.floor(Math.random() * 10000)}`,
          senderId: currentUser.uid,
          senderName: currentUser.name,
          receiverId: studentId,
          receiverName: studentName || "",
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
      const studentRecord = getStoredStudents().find(s => s.schoolID === newMessageRecipientId);
      const recipientUser = allUsers.find(u => u.schoolID === newMessageRecipientId && u.role === UserRole.STUDENT);
      
      const rId = recipientUser ? recipientUser.uid : (studentRecord ? studentRecord.id : newMessageRecipientId);
      const rName = recipientUser ? recipientUser.name : (studentRecord ? studentRecord.name : 'Student');

      const newMessage: Message = {
          id: `msg-${Math.floor(Math.random() * 10000)}`,
          senderId: currentUser.uid,
          senderName: currentUser.name,
          receiverId: rId,
          receiverName: rName,
          content: newMessageContent,
          timestamp: new Date().toISOString(),
          read: false,
          ...(attachment ? { attachment } : {})
      };

      addMessage(newMessage);
      setNewMessageContent('');
      setNewMessageRecipientId('');
      setAttachment(null);
      setIsNewMessageModalOpen(false);
      refreshMessages();
      setSelectedChatUserId(rId);
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
  
  const openMessageModal = (student: StudentRecord) => {
      setMessageTargetStudent(student);
      setMessageContent('');
      setShowMessageModal(true);
  };

  const refreshStudentList = () => {
    const freshStudents = getStoredStudents();
    const schoolStudents = freshStudents.filter(s => 
        s.schoolName === currentUser.schoolName &&
        s.className === selectedClass
    );
    setStudents(schoolStudents.sort((a, b) => a.rollNumber - b.rollNumber));
  };

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

  const calculateAge = (dobString: string): string => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge.toString();
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDob = e.target.value;
    setDob(newDob);
    const calculatedAge = calculateAge(newDob);
    setAge(calculatedAge);
  };

  // --- ATTENDANCE LOGIC ---

  const getStudentAttendanceForDate = (student: StudentRecord, date: string): boolean | undefined => {
      if (!student.attendanceHistory) return undefined;
      return student.attendanceHistory[date];
  }

  const handleAttendanceChange = (studentId: string, status: boolean) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const newHistory = { ...(s.attendanceHistory || {}) };
        newHistory[selectedDate] = status;
        
        // Update 'attendanceToday' mainly for legacy Principal view compatibility if date is today
        const isToday = selectedDate === new Date().toISOString().split('T')[0];
        const newAttendanceToday = isToday ? status : s.attendanceToday;

        return { ...s, attendanceHistory: newHistory, attendanceToday: newAttendanceToday };
      }
      return s;
    }));
    setHasChanges(true);
  };

  const markAllForDate = (status: boolean) => {
    setStudents(prev => prev.map(s => {
        // Only mark if it's their class teacher or admin
        if (s.className !== selectedClass) return s;

        const newHistory = { ...(s.attendanceHistory || {}) };
        newHistory[selectedDate] = status;
        
        const isToday = selectedDate === new Date().toISOString().split('T')[0];
        const newAttendanceToday = isToday ? status : s.attendanceToday;

        return { ...s, attendanceHistory: newHistory, attendanceToday: newAttendanceToday };
    }));
    setHasChanges(true);
  };

  const saveAttendance = () => {
    students.forEach(s => updateStudent(s));
    setHasChanges(false);
    setAlertState({ isOpen: true, message: `Attendance for ${selectedDate} saved!` });
  };

  const getAttendanceStats = (student: StudentRecord) => {
      const history = student.attendanceHistory || {};
      const dates = Object.keys(history);
      const totalWorking = dates.length;
      const totalPresent = dates.filter(d => history[d] === true).length;
      const percentage = totalWorking > 0 ? ((totalPresent / totalWorking) * 100).toFixed(1) : '0.0';
      return { totalWorking, totalPresent, percentage };
  };

  const updateOwnHouse = () => {
      const updatedUser = { ...currentUser, house: selectedHouse };
      updateUser(updatedUser);
      setEditHouseMode(false);
      setAlertState({ isOpen: true, message: "House updated successfully. Please re-login to see changes in sidebar." });
  };

  // --- STUDENT MODAL LOGIC ---

  const openAddModal = () => {
    if (!currentUser.schoolName) {
        setAlertState({ isOpen: true, title: 'Error', message: "Error: You are not assigned to a school. Cannot add students." });
        return;
    }
    setEditingId(null);
    setFormError('');
    setName('');
    setAge('');
    setDob('');
    setGender('Male');
    setSchoolID('');
    setPassword('');
    
    // Default class logic if user has a class selected, parse it, else defaults
    if (selectedClass) {
        const { pGrade, pSection } = parseClassString(selectedClass);
        setGrade(pGrade);
        setSection(pSection);
    } else {
        setGrade('10th');
        setSection('A');
    }

    setEmail('');
    setFatherContact('');
    setMotherContact('');
    setHouse('');
    setStudentPost('');
    setShowModal(true);
  };

  const openEditModal = (student: StudentRecord) => {
    if (student.className !== selectedClass) {
        setAlertState({ isOpen: true, title: 'Error', message: `You can only edit students in the currently selected class (${selectedClass || 'None'}).` });
        return;
    }

    setEditingId(student.id);
    setFormError('');
    const userLogin = users.find(u => u.schoolID === student.schoolID);
    
    setName(student.name);
    setAge(student.age?.toString() || '');
    setDob(student.dob || '');
    setGender(student.gender || 'Male');
    setSchoolID(student.schoolID);
    setPassword(userLogin?.password || '');
    
    const { pGrade, pSection } = parseClassString(student.className);
    setGrade(pGrade);
    setSection(pSection);

    setEmail(student.email || '');
    setFatherContact(student.fatherContact || '');
    setMotherContact(student.motherContact || '');
    setHouse(student.house || '');
    setStudentPost(student.studentPost || '');
    setShowModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!grade || !section) {
        setFormError("Please select both Class Grade and Section.");
        return;
    }
    const fullClass = `${grade}-${section}`;
    
    // --- VALIDATION START ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        setFormError("Please enter a valid school email address (e.g., student@school.edu).");
        return;
    }

    const phoneRegex = /^\d{10}$/;
    if (fatherContact && !phoneRegex.test(fatherContact)) {
        setFormError("Father's contact number must be exactly 10 digits.");
        return;
    }
    if (motherContact && !phoneRegex.test(motherContact)) {
        setFormError("Mother's contact number must be exactly 10 digits.");
        return;
    }
    
    const isDuplicate = users.some(u => {
        if (editingId) {
             const originalStudent = students.find(s => s.id === editingId);
             if (originalStudent && u.schoolID === originalStudent.schoolID) {
                 return false; 
             }
        }
        return u.schoolID === schoolID;
    });

    if (isDuplicate) {
        setFormError("School ID already exists. Please use a unique ID.");
        return;
    }

    let updatedList = [...getStoredStudents()];
    
    if (editingId) {
      const existingIndex = updatedList.findIndex(s => s.id === editingId);
      if (existingIndex === -1) return;
      
      const existingStudent = updatedList[existingIndex];

      const updatedRecord: StudentRecord = {
        ...existingStudent,
        name, schoolID, className: fullClass, age: parseInt(age), dob, gender,
        email, fatherContact, motherContact, house, studentPost,
        schoolName: currentUser.schoolName
      };
      
      updateStudent(updatedRecord);

      const associatedUser = users.find(u => u.schoolID === existingStudent.schoolID);
      if (associatedUser) {
        const updatedUser: User = {
          ...associatedUser, name, schoolID, password, className: fullClass, gender, dob, email: email, schoolName: currentUser.schoolName
        };
        updateUser(updatedUser);
      }
      
      setAlertState({ isOpen: true, message: `Student ${name} updated successfully.` });

    } else {
      const newRecord: StudentRecord = {
        id: generateId('s'), name, schoolID, rollNumber: 0, attendanceToday: null, attendanceHistory: {}, gradeAverage: 0, className: fullClass,
        age: parseInt(age), dob, gender, email, fatherContact, motherContact, marks: [], house, studentPost,
        schoolName: currentUser.schoolName
      };

      addStudent(newRecord);

      const newUser: User = {
        uid: generateId('u'), name, schoolID, role: UserRole.STUDENT, className: fullClass, password, gender, dob,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f59e0b&color=fff`,
        schoolName: currentUser.schoolName
      };

      addUser(newUser);
      setAlertState({ isOpen: true, message: `Student Added! Login ID: ${schoolID}, Password: ${password}` });
    }

    refreshStudentList();
    setUsers(getStoredUsers());
    setShowModal(false);
  };

  const handleDeleteStudent = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editingId) return;
      
      setConfirmState({
          isOpen: true,
          title: 'Delete Student',
          message: 'Are you sure you want to remove this student? This will delete all their data including grades.',
          onConfirm: () => {
              // 1. Remove Student Record
              removeStudent(editingId);

              // 2. Remove User Record
              const freshUsers = getStoredUsers();
              const user = freshUsers.find(u => u.schoolID === schoolID); // schoolID is from state
              if (user) {
                  removeUser(user.uid);
              }
              
              // 3. Update UI
              refreshStudentList();
              setUsers(getStoredUsers());
              setShowModal(false);
          }
      });
  };

  // --- MARKS LOGIC ---

  const openMarksModal = (student: StudentRecord) => {
    if (student.className !== selectedClass) {
        setAlertState({ isOpen: true, title: 'Error', message: `You can only manage marks for students in the currently selected class (${selectedClass || 'None'}).` });
        return;
    }
    setCurrentMarksStudent(student);
    setMarksList(student.marks || []);
    setNewSubject('');
    setNewMidTerm('');
    setNewFinal('');
    setShowMarksModal(true);
  };

  const handleAddMark = () => {
    if (!newSubject || !newMidTerm || !newFinal) {
        setAlertState({ isOpen: true, title: 'Error', message: "Please fill all fields." });
        return;
    }
    const newEntry: MarkEntry = {
        subject: newSubject,
        midTerm: parseFloat(newMidTerm),
        final: parseFloat(newFinal)
    };
    setMarksList([...marksList, newEntry]);
    setNewSubject('');
    setNewMidTerm('');
    setNewFinal('');
  };

  const handleRemoveMark = (index: number) => {
    const updated = [...marksList];
    updated.splice(index, 1);
    setMarksList(updated);
  };

  const saveMarks = () => {
    if (!currentMarksStudent) return;
    
    let totalScore = 0;
    let count = 0;
    marksList.forEach(m => {
        totalScore += (m.midTerm + m.final) / 2;
        count++;
    });
    const newAverage = count > 0 ? parseFloat((totalScore / count).toFixed(1)) : 0;

    const updatedStudent: StudentRecord = {
        ...currentMarksStudent,
        marks: marksList,
        gradeAverage: newAverage
    };

    updateStudent(updatedStudent);
    refreshStudentList();
    setShowMarksModal(false);
    setAlertState({ isOpen: true, message: `Marks updated for ${currentMarksStudent.name}` });
  };

  // --- ASSIGNMENT LOGIC ---
  const openAssignModal = () => {
      if (!currentUser.schoolName) {
          setAlertState({ isOpen: true, title: 'Error', message: "Error: You must be assigned to a school to post assignments." });
          return;
      }
      setAssignTitle('');
      setAssignSubject(selectedClassObj.subject || '');
      setAssignContent('');
      setAssignDueDate('');
      
      if (selectedClass) {
          const { pGrade, pSection } = parseClassString(selectedClass);
          setAssignGrade(pGrade);
          setAssignSection(pSection);
      } else {
          setAssignGrade('');
          setAssignSection('');
      }
      
      setShowAssignModal(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!assignGrade || !assignSection) {
          setAlertState({ isOpen: true, title: 'Error', message: "Please select target grade and section." });
          return;
      }

      const newAssignment: Assignment = {
          id: generateId('assign'),
          title: assignTitle,
          subject: assignSubject,
          content: assignContent,
          dueDate: assignDueDate,
          targetClass: `${assignGrade}-${assignSection}`,
          schoolName: currentUser.schoolName!,
          authorName: currentUser.name,
          teacherUid: currentUser.uid,
          createdAt: new Date().toISOString()
      };

      addAssignment(newAssignment);
      refreshAssignments();
      setShowAssignModal(false);
      setAlertState({ isOpen: true, message: 'Assignment sent successfully!' });
  };

  const handleDeleteAssignment = (id: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Delete Assignment',
          message: 'Delete this assignment?',
          onConfirm: () => {
              deleteAssignment(id);
              refreshAssignments();
          }
      });
  };

  const handleUpdateSubmission = (
      assignmentId: string, 
      studentId: string, 
      teacherVerified: 'pending' | 'verified' | 'rejected', 
      completionStatus: 'pending' | 'complete' | 'incomplete'
  ) => {
      updateSubmissionStatus(assignmentId, studentId, teacherVerified, completionStatus);
      refreshAssignments();
  };

  const getHouseColor = (house?: HouseTeam) => {
    if (!house) return 'bg-slate-50 text-slate-500 border-slate-100';
    
    // Check standard colors
    if (house.includes('Green')) return 'bg-green-100 text-green-700 border-green-200';
    if (house.includes('Blue')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (house.includes('Yellow')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (house.includes('Red')) return 'bg-red-100 text-red-700 border-red-200';

    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  // --- RENDERING ---

  if (currentPage === 'assignments') {
      return (
          <div className="space-y-6">
              <header className="flex justify-between items-center mb-6">
                  <div>
                      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assignments</h1>
                      <p className="text-slate-500 dark:text-slate-400">Create and manage class assignments</p>
                  </div>
                  <button onClick={openAssignModal} className="flex gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Plus size={18} /> New Assignment
                  </button>
              </header>

              <div className="grid gap-6">
                 {assignments.length === 0 ? (
                     <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400">
                         <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                         <p>No active assignments. Click "New Assignment" to create one.</p>
                     </div>
                 ) : (
                     assignments.map(assign => (
                         <div key={assign.id || Math.random().toString()} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                             <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <h3 className="font-bold text-lg text-slate-800 dark:text-white">{assign.title}</h3>
                                     <div className="flex items-center gap-3 mt-1">
                                         <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">{assign.subject}</span>
                                         <span className="text-xs text-slate-500 dark:text-slate-400">Target: Class {assign.targetClass}</span>
                                         <span className="text-xs text-slate-400 dark:text-slate-500">Due: {assign.dueDate}</span>
                                     </div>
                                 </div>
                                 <button onClick={() => handleDeleteAssignment(assign.id)} className="text-red-400 hover:text-red-600">
                                     <Trash2 size={18} />
                                 </button>
                             </div>
                             <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap mb-4">{assign.content}</p>
                             
                             {/* Submissions Section */}
                             <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                     <ClipboardList size={16} />
                                     Submissions ({assign.submissions?.length || 0})
                                 </h4>
                                 
                                 {(!assign.submissions || assign.submissions.length === 0) ? (
                                     <p className="text-xs text-slate-500 dark:text-slate-400 italic">No submissions yet.</p>
                                 ) : (
                                     <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                         {assign.submissions.map((sub, idx) => (
                                             <div key={idx} className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                                 <div className="flex items-center justify-between">
                                                     <div className="flex items-center gap-3">
                                                         <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                             {sub.studentName.charAt(0)}
                                                         </div>
                                                         <div>
                                                             <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                                 {sub.studentName}
                                                                 {sub.isOffline && <span className="ml-2 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">Offline</span>}
                                                             </p>
                                                             <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(sub.submittedAt).toLocaleString()}</p>
                                                         </div>
                                                     </div>
                                                     {sub.fileData && (
                                                         <a 
                                                             href={sub.fileData} 
                                                             download={sub.fileName}
                                                             className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600 transition-colors"
                                                         >
                                                             <Download size={14} />
                                                             <span>Download PDF</span>
                                                         </a>
                                                     )}
                                                 </div>
                                                 
                                                 <div className="flex items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                                                     <div className="flex items-center gap-2">
                                                         <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                                                         <select 
                                                             value={sub.teacherVerified || 'pending'}
                                                             onChange={(e) => handleUpdateSubmission(assign.id, sub.studentId, e.target.value as any, sub.completionStatus || 'pending')}
                                                             className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-700 dark:text-slate-300 outline-none"
                                                         >
                                                             <option value="pending">Pending</option>
                                                             <option value="verified">Verified</option>
                                                             <option value="rejected">Rejected</option>
                                                         </select>
                                                     </div>
                                                     <div className="flex items-center gap-2">
                                                         <span className="text-xs text-slate-500 dark:text-slate-400">Completion:</span>
                                                         <select 
                                                             value={sub.completionStatus || 'pending'}
                                                             onChange={(e) => handleUpdateSubmission(assign.id, sub.studentId, sub.teacherVerified || 'pending', e.target.value as any)}
                                                             className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-700 dark:text-slate-300 outline-none"
                                                         >
                                                             <option value="pending">Pending</option>
                                                             <option value="complete">Complete</option>
                                                             <option value="incomplete">Incomplete</option>
                                                         </select>
                                                     </div>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         </div>
                     ))
                 )}
              </div>

              {/* Create Assignment Modal */}
              {showAssignModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10 backdrop-blur-sm">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800">
                          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Send Assignment</h2>
                          <form onSubmit={handleSaveAssignment} className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Title</label>
                                  <input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg" value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder="e.g. Chapter 1 Review" required />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Subject</label>
                                       <input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg" value={assignSubject} onChange={e => setAssignSubject(e.target.value)} required />
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Due Date</label>
                                       <input type="date" className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} required />
                                   </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Target Grade</label>
                                      <select className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg" value={assignGrade} onChange={e => {setAssignGrade(e.target.value); setAssignSection('');}}>
                                          <option value="">Select Grade</option>
                                          {CLASS_GRADES.map(g => <option key={g || Math.random().toString()} value={g}>{g}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Target Section</label>
                                      <select className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg" value={assignSection} onChange={e => setAssignSection(e.target.value)} disabled={!assignGrade}>
                                          <option value="">Select Section</option>
                                          <option value="All">All Sections</option>
                                          {getSectionOptions(assignGrade).map(s => <option key={s || Math.random().toString()} value={s}>{s}</option>)}
                                      </select>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Instructions / Content</label>
                                  <textarea className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg h-32" value={assignContent} onChange={e => setAssignContent(e.target.value)} placeholder="Details about the assignment..." required />
                              </div>
                              <div className="flex gap-2 mt-4">
                                  <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 border dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">Cancel</button>
                                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Send to Class</button>
                              </div>
                          </form>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  if (currentPage === 'messages') {
      const chatGroups = messages.reduce((acc, msg) => {
          const otherId = msg.senderId === currentUser.uid ? msg.receiverId : msg.senderId;
          const otherName = msg.senderId === currentUser.uid ? msg.receiverName : msg.senderName;
          
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
          if (msg.receiverId === currentUser.uid && !msg.read) {
              acc[otherId].unreadCount++;
          }
          if (new Date(msg.timestamp) > new Date(acc[otherId].lastMessageTime)) {
              acc[otherId].lastMessageTime = msg.timestamp;
          }
          return acc;
      }, {} as Record<string, { userId: string, userName: string, messages: Message[], unreadCount: number, lastMessageTime: string }>);

      const conversations = (Object.values(chatGroups) as { userId: string, userName: string, messages: Message[], unreadCount: number, lastMessageTime: string }[]).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      const selectedConversation = selectedChatUserId ? chatGroups[selectedChatUserId] : null;

      const allStudents = getStoredStudents();
      const myStudents = allStudents.filter(s => {
          if (s.schoolName !== currentUser.schoolName) return false;
          const isMainClass = s.className === currentUser.assignedClass;
          const isAdditionalClass = currentUser.additionalClasses?.some(ac => ac.className === s.className);
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
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Student</label>
                                  <select 
                                      value={newMessageRecipientId}
                                      onChange={(e) => setNewMessageRecipientId(e.target.value)}
                                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                      required
                                  >
                                      <option value="">-- Select a student --</option>
                                      {myStudents.map(student => (
                                          <option key={student.id || Math.random().toString()} value={student.schoolID}>{student.name} ({student.className})</option>
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
                  <p className="text-slate-500 dark:text-slate-400">Direct messages with students</p>
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
                              <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                  <MoreVertical size={20} />
                              </button>
                          </div>
                      </div>
                      
                      {/* Search Bar (Visual only for now) */}
                      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60">
                          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                              <input type="text" placeholder="Search or start new chat" className="bg-transparent border-none outline-none w-full text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
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
                                      key={conv.userId || Math.random().toString()}
                                      onClick={() => setSelectedChatUserId(conv.userId)}
                                      className={`w-full text-left p-3 transition-all flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50 ${selectedChatUserId === conv.userId ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                  >
                                      <div className="relative">
                                          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
                                              {conv.userName.charAt(0)}
                                          </div>
                                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                          {conv.unreadCount > 0 && (
                                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
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
                                              {conv.messages[conv.messages.length - 1].senderId === currentUser.uid ? 'You: ' : ''}
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
                                      const isSentByMe = msg.senderId === currentUser.uid;
                                      return (
                                          <div key={msg.id || Math.random().toString()} className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'} group`}>
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
                                  Select a conversation from the sidebar to start messaging your students.
                                  <br />Messages are end-to-end encrypted.
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  if (currentPage === 'announcements') {
      return (
          <div className="space-y-6">
              <header className="mb-6"><h1 className="text-2xl font-bold text-slate-800 dark:text-white">News & Events</h1><p className="text-slate-500 dark:text-slate-400">School-wide announcements and teacher updates.</p></header>
              <div className="grid gap-6">
                 {announcements.length === 0 ? (<div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400"><Megaphone size={48} className="mx-auto mb-4 opacity-20" /><p>No announcements at this time.</p></div>) : (announcements.map(ann => (<div key={ann.id || Math.random().toString()} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-blue-500"><div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-lg text-slate-800 dark:text-white">{ann.title}</h3><div className="flex items-center gap-2 mt-1"><span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{ann.date} • From {ann.author}</span>{ann.schoolName && <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800"><School size={10} /> {ann.schoolName}</span>}</div></div></div><p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{ann.content}</p></div>)))}
              </div>
          </div>
      );
  }

  if (currentPage === 'grades') {
      return (
          <div className="space-y-6">
              <header className="flex justify-between items-center mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {allAssignedClasses.length > 1 && (
                      <select 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                        value={selectedClass}
                        onChange={(e) => {
                          const selected = allAssignedClasses.find(c => c.className === e.target.value);
                          if (selected) setSelectedClassObj(selected);
                        }}
                      >
                        {allAssignedClasses.map((c, i) => (
                          <option key={i || Math.random().toString()} value={c.className}>
                            {c.className} ({c.subject}) {i === 0 ? '- Main' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Student Grades</h1>
                  <p className="text-slate-500 dark:text-slate-400">Manage Assessments & Results for Class {selectedClass}</p>
                </div>
              </header>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[800px] border-separate border-spacing-0">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800">Student Name</th>
                            <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800">Roll No</th>
                            <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800">Overall GPA</th>
                            <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {students.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-8 py-16 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-3">
                                  <GraduationCap size={48} className="opacity-10" />
                                  <p className="font-medium italic">No students found in this roster.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            students.map(s => { 
                              const canEdit = s.className === selectedClass; 
                              return (
                                <tr key={s.id || Math.random().toString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">
                                        {s.name.charAt(0)}
                                      </div>
                                      <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{s.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 text-slate-500 dark:text-slate-400 font-mono text-xs bg-slate-50/30 dark:bg-slate-800/30">{s.rollNumber}</td>
                                  <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${s.gradeAverage > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800' : 'text-slate-400 italic border-transparent'}`}>
                                      {s.gradeAverage > 0 ? `${s.gradeAverage}%` : 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    {canEdit ? (
                                      <button 
                                        onClick={() => openMarksModal(s)} 
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2 ml-auto border border-blue-500"
                                      >
                                        <GraduationCap size={14} /> 
                                        Manage Marks
                                      </button>
                                    ) : (
                                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 italic flex items-center justify-end gap-1.5 opacity-60">
                                        <Lock size={12} /> View Only
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ) 
                            })
                          )}
                        </tbody>
                    </table>
                </div>
              </div>
              {showMarksModal && currentMarksStudent && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4"><div><h2 className="text-xl font-bold text-slate-800 dark:text-white">Manage Marks</h2><p className="text-slate-500 dark:text-slate-400 text-sm">Student: {currentMarksStudent.name}</p></div><button onClick={() => setShowMarksModal(false)} className="text-slate-400 text-2xl hover:text-slate-600 dark:hover:text-slate-300">&times;</button></div>
                        <div className="space-y-6">
                            <div className="flex gap-3 items-end bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Subject</label><input className="w-full px-3 py-2 border dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" value={newSubject} onChange={e => setNewSubject(e.target.value)} /></div>
                                <div className="w-24"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Mid-Term</label><input type="number" className="w-full px-3 py-2 border dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" value={newMidTerm} onChange={e => setNewMidTerm(e.target.value)} /></div>
                                <div className="w-24"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Finals</label><input type="number" className="w-full px-3 py-2 border dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" value={newFinal} onChange={e => setNewFinal(e.target.value)} /></div>
                                <button onClick={handleAddMark} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium h-[38px]"><Plus size={16} /> Add</button>
                            </div>
                            <table className="w-full text-left border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Mid</th><th className="px-4 py-3">Final</th><th className="px-4 py-3">Avg</th><th className="px-4 py-3 text-right"></th></tr></thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{marksList.map((m, idx) => (<tr key={idx}><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.subject}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.midTerm}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.final}</td><td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{((m.midTerm + m.final) / 2).toFixed(1)}</td><td className="px-4 py-3 text-right"><button onClick={() => handleRemoveMark(idx)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 size={16} /></button></td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800"><button onClick={() => setShowMarksModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button><button onClick={saveMarks} className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700">Save Grades</button></div>
                    </div>
                  </div>
              )}
          </div>
      );
  }

  // DEFAULT DASHBOARD (Attendance & Roster)
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-6 px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                {allAssignedClasses.length > 1 && (
                  <select 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                    value={selectedClass}
                    onChange={(e) => {
                      const selected = allAssignedClasses.find(c => c.className === e.target.value);
                      if (selected) setSelectedClassObj(selected);
                    }}
                  >
                    {allAssignedClasses.map((c, i) => (
                      <option key={i || Math.random().toString()} value={c.className}>
                        {c.className} ({c.subject}) {i === 0 ? '- Main' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-display text-2xl md:text-3xl lg:text-4xl">
                    Class {selectedClass || 'Unassigned'} {selectedClassObj.subject && <span className="text-blue-600 dark:text-blue-400">({selectedClassObj.subject})</span>}
                </h1>
              </div>
              <p className="text-label text-[10px] md:text-xs text-slate-500 dark:text-slate-400">Attendance Manager & Student Roster</p>
              {currentUser.schoolName && (
                <div className="mt-3 inline-flex items-center gap-2 bg-blue-500/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-blue-500/20 text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400">
                  <School size={12} className="md:w-[14px] md:h-[14px]" /> {currentUser.schoolName}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
               <button onClick={openAddModal} className="btn-primary flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-[10px] md:text-xs w-full md:w-auto">
                 <Plus size={16} className="md:w-[18px] md:h-[18px]" /> Add Student
               </button>
            </div>
        </div>
        
        {/* Attendance Controls Bar */}
        <div className="premium-card p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold w-full md:w-auto justify-center md:justify-start">
                    <Calendar size={14} className="md:w-4 md:h-4" />
                    Today: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto justify-center md:justify-end">
                <button onClick={() => markAllForDate(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-wider hover:bg-green-500/20 transition-all">
                  <CheckCircle size={14} className="md:w-4 md:h-4" /> Present
                </button>
                <button onClick={() => markAllForDate(false)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-wider hover:bg-red-500/20 transition-all">
                  <XCircle size={14} className="md:w-4 md:h-4" /> Absent
                </button>
                <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
                <button 
                  onClick={saveAttendance} 
                  disabled={!hasChanges} 
                  className={`btn-primary flex items-center justify-center gap-2 px-6 md:px-8 py-2 md:py-2.5 text-[10px] md:text-xs w-full md:w-auto ${!hasChanges ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  <Save size={16} className="md:w-[18px] md:h-[18px]" /> Save Changes
                </button>
            </div>
        </div>
      </header>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[1000px] border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                    <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800">Roll</th>
                    <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800">Student Name</th>
                    <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-center">Status ({selectedDate})</th>
                    <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-center">Total Working</th>
                    <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-center">Total Present</th>
                    <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-center">%</th>
                    <th className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                      <ClipboardList size={64} className="opacity-10" />
                      <p className="text-display text-xl opacity-40">No students found in this roster.</p>
                      <button onClick={openAddModal} className="btn-secondary text-xs px-6 py-2">Add Your First Student</button>
                    </div>
                  </td>
                </tr>
              ) : (students.map((student) => {
                    const status = getStudentAttendanceForDate(student, selectedDate);
                    const isPresent = status === true;
                    const isAbsent = status === false;
                    const stats = getAttendanceStats(student);
                    
                    const canEdit = student.className === selectedClass;
                    
                    return (
                    <tr key={student.id || Math.random().toString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-8 py-5 text-slate-500 dark:text-slate-400 font-mono text-xs bg-slate-50/30 dark:bg-slate-800/30">{student.rollNumber}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm border border-blue-500/20">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{student.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-tighter">{student.schoolID}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-3 md:gap-4">
                          <button 
                            onClick={() => canEdit && handleAttendanceChange(student.id, true)}
                            disabled={!canEdit}
                            className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all border ${status === true ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                          >
                            <CheckCircle size={22} className="md:w-6 md:h-6" />
                          </button>
                          <button 
                            onClick={() => canEdit && handleAttendanceChange(student.id, false)}
                            disabled={!canEdit}
                            className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all border ${status === false ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                          >
                            <XCircle size={22} className="md:w-6 md:h-6" />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">{stats.totalWorking}</td>
                      <td className="px-8 py-5 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">{stats.totalPresent}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${parseFloat(stats.percentage) >= 75 ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                          {stats.percentage}%
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openMessageModal(student)}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-all active:scale-90"
                            title="Send Message"
                          >
                            <MessageSquare size={16} />
                          </button>
                          {canEdit ? (
                            <>
                              <button 
                                onClick={() => openEditModal(student)} 
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-all active:scale-90"
                                title="Edit Student"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => openMarksModal(student)} 
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 transition-all active:scale-90"
                                title="Manage Marks"
                              >
                                <GraduationCap size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 italic flex items-center justify-end gap-1.5 opacity-60">
                              <Lock size={12} /> View Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                }))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{editingId ? 'Edit Student' : 'Add Student'}</h2>
            <form onSubmit={handleSaveStudent} className="space-y-4">
               {formError && <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">{formError}</div>}
               <div><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name</label><input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" value={name} onChange={e => setName(e.target.value)} required /></div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Grade</label>
                        <select 
                            className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded"
                            value={grade} 
                            onChange={e => {setGrade(e.target.value); setSection('');}}
                        >
                            <option value="">Select</option>
                            {CLASS_GRADES.map(g => <option key={g || Math.random().toString()} value={g}>{g}</option>)}
                        </select>
                   </div>
                   <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Section</label>
                        <select 
                            className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded"
                            value={section} 
                            onChange={e => setSection(e.target.value)}
                            disabled={!grade}
                        >
                            <option value="">Select</option>
                            {getSectionOptions(grade).map(s => <option key={s || Math.random().toString()} value={s}>{s}</option>)}
                        </select>
                   </div>
               </div>
               
               {/* EXTENDED STUDENT FIELDS START */}
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Gender</label>
                       <select className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" value={gender} onChange={e => setGender(e.target.value)}>
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                           <option value="Other">Other</option>
                       </select>
                   </div>
                   <div>
                       <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">House Team</label>
                       <select className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" value={house} onChange={e => setHouse(e.target.value as HouseTeam)}>
                           <option value="">Select House</option>
                           {getHouseOptions().map(h => <option key={h || Math.random().toString()} value={h}>{h}</option>)}
                       </select>
                   </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Student Post</label>
                        <input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" placeholder="e.g. Head Boy" value={studentPost} onChange={e => setStudentPost(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email</label>
                        <input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" type="email" placeholder="student@school.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Father's Contact</label>
                        <input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" placeholder="10 digits" value={fatherContact} onChange={e => setFatherContact(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Mother's Contact</label>
                        <input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" placeholder="10 digits" value={motherContact} onChange={e => setMotherContact(e.target.value)} />
                    </div>
               </div>
               {/* EXTENDED STUDENT FIELDS END */}

               <div className="grid grid-cols-2 gap-4">
                   <input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" type="date" value={dob} onChange={handleDobChange} />
                   <input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" placeholder="Age" value={age} readOnly />
               </div>
               <div><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">School ID</label><input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" value={schoolID} onChange={e => setSchoolID(e.target.value)} required /></div>
               <div><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Password</label><input className="w-full p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded" value={password} onChange={e => setPassword(e.target.value)} required /></div>
               
               <div className="flex gap-2 mt-4">
                   {editingId && <button type="button" onClick={handleDeleteStudent} className="px-4 py-2 text-red-600 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>}
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded">Cancel</button>
                   <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">Save</button>
               </div>
            </form>
          </div>
        </div>
      )}
      
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

      {/* Message Modal */}
      {showMessageModal && messageTargetStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageSquare size={20} />
                      Message {messageTargetStudent.name}
                  </h2>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Message Content</label>
                          <textarea 
                              className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none" 
                              value={messageContent} 
                              onChange={e => setMessageContent(e.target.value)} 
                              placeholder="Type your message here..." 
                              required 
                          />
                      </div>
                      <div className="flex gap-2 mt-4">
                          <button type="button" onClick={() => setShowMessageModal(false)} className="flex-1 px-4 py-2 border dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                          <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                              <Send size={16} /> Send Message
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
