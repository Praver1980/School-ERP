import React, { useState, useEffect } from 'react';

import { User, UserRole, StudentRecord, HouseTeam, Announcement, School as SchoolType, SchoolConfig, MarkEntry, Assignment } from '../types';
import { getStoredUsers, addUser, updateUser, removeUser, generateId, getStoredStudents, updateStudent, addStudent, removeStudent, getStoredAnnouncements, addAnnouncement, deleteAnnouncement, getStoredSchools, addSchool, removeSchool, updateSchool, getStoredAssignments, addAssignment, deleteAssignment, updateAssignment, getStoredPayments, updatePayment } from '../services/storage';
import { Shield, Plus, School, Trash2, Pencil, Users, GraduationCap, Filter, AlertCircle, Megaphone, Send, UserCog, Building2, Globe, Settings, Save, Calendar, CheckSquare, XCircle, CheckCircle, ClipboardList, CreditCard } from 'lucide-react';
import { CLASS_GRADES, SECTIONS_JUNIOR, SECTIONS_SENIOR } from '../constants';
import ConfirmModal from '../components/ConfirmModal';
import MonitoringDashboard from './MonitoringDashboard';

interface AdminDashboardProps {
  currentPage?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentPage = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'principals' | 'teachers' | 'students' | 'announcements' | 'schools' | 'assignments' | 'payments' | 'monitoring'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [payments, setPayments] = useState<import('../types').PaymentRecord[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'principal' | 'teacher' | 'student'>('principal');

  const [showAnnModal, setShowAnnModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [resetModal, setResetModal] = useState({ isOpen: false, step: 1, telOtp: '', emailOtp: '', pass: '', loading: false });


  // School Config Modal
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [scFormName, setScFormName] = useState('');
  const [scFormMaxMarks, setScFormMaxMarks] = useState('100');
  const [scFormHouses, setScFormHouses] = useState('');
  const [scFormStreams, setScFormStreams] = useState('');

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAudience, setAnnAudience] = useState<'all' | 'student' | 'teacher'>('all');
  const [annSchool, setAnnSchool] = useState('');
  const [annSpoofType, setAnnSpoofType] = useState<'admin' | 'impersonate' | 'custom'>('admin');
  const [annImpersonateId, setAnnImpersonateId] = useState('');
  const [annCustomName, setAnnCustomName] = useState('');
  
  // Generic Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);

  // Error State
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formID, setFormID] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSchool, setFormSchool] = useState(''); 
  
  const [formGrade, setFormGrade] = useState('');
  const [formSection, setFormSection] = useState('');

  const [formSubject, setFormSubject] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formHouse, setFormHouse] = useState<HouseTeam>('');
  const [formPost, setFormPost] = useState('');
  
  const [formEmail, setFormEmail] = useState('');
  const [formContact, setFormContact] = useState(''); 

  const [formDob, setFormDob] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formFatherContact, setFormFatherContact] = useState('');
  const [formMotherContact, setFormMotherContact] = useState('');

  // Derived State for Dropdowns
  const [currentSchoolConfig, setCurrentSchoolConfig] = useState<SchoolConfig | null>(null);

  // --- NEW: MARKS MANAGEMENT STATE ---
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [currentMarksStudent, setCurrentMarksStudent] = useState<StudentRecord | null>(null);
  const [marksList, setMarksList] = useState<MarkEntry[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newMidTerm, setNewMidTerm] = useState('');
  const [newFinal, setNewFinal] = useState('');

  // --- NEW: ATTENDANCE MANAGEMENT STATE ---
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentAttendanceStudent, setCurrentAttendanceStudent] = useState<StudentRecord | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // --- NEW: ASSIGNMENT MANAGEMENT STATE ---
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignSubject, setAssignSubject] = useState('');
  const [assignContent, setAssignContent] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignGrade, setAssignGrade] = useState('');
  const [assignSection, setAssignSection] = useState('');
  const [assignSchool, setAssignSchool] = useState('');
  const [assignTeacherUid, setAssignTeacherUid] = useState(''); // "Send on behalf of"

  useEffect(() => {
    refreshData();
    window.addEventListener('nexus_data_changed', refreshData);
    return () => window.removeEventListener('nexus_data_changed', refreshData);
  }, []);

  // Watch formSchool changes to update config for dropdowns
  useEffect(() => {
      if (formSchool) {
          const s = schools.find(s => s.name === formSchool);
          if (s) setCurrentSchoolConfig(s.config);
          else setCurrentSchoolConfig(null);
      } else {
          setCurrentSchoolConfig(null);
      }
  }, [formSchool, schools]);

  // Watch assignSchool changes to update config for dropdowns in assignment modal
  useEffect(() => {
    if (assignSchool) {
        const s = schools.find(s => s.name === assignSchool);
        if (s) setCurrentSchoolConfig(s.config);
        else setCurrentSchoolConfig(null);
    } else {
        setCurrentSchoolConfig(null);
    }
  }, [assignSchool, schools]);

  const refreshData = () => {
    setUsers(getStoredUsers());
    setStudents(getStoredStudents());
    setAnnouncements(getStoredAnnouncements());
    setSchools(getStoredSchools());
    setAssignments(getStoredAssignments());
    setPayments(getStoredPayments());
  };

  const parseClassString = (classStr: string) => {
    if (!classStr) return { grade: '', section: '' };
    const parts = classStr.split('-');
    if (parts.length >= 2) {
        return { grade: parts[0], section: parts.slice(1).join('-') };
    }
    return { grade: classStr, section: '' };
  };

  const getSectionOptions = (grade: string) => {
      // If we have a specific school config and it's a senior grade, try to use streams
      if (['11th', '12th'].includes(grade)) {
          if (currentSchoolConfig && currentSchoolConfig.streams.length > 0) {
              return currentSchoolConfig.streams;
          }
          return SECTIONS_SENIOR; // Fallback
      }
      return SECTIONS_JUNIOR;
  };

  const getHouseOptions = () => {
      if (currentSchoolConfig && currentSchoolConfig.houseNames.length > 0) {
          return currentSchoolConfig.houseNames;
      }
      return ['Green', 'Blue', 'Yellow', 'Red']; // Fallback
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
    setFormDob(newDob);
    setFormAge(calculateAge(newDob));
  };

  // --- MARKS HANDLERS (ADMIN) ---
  const openMarksModal = (student: StudentRecord) => {
      setCurrentMarksStudent(student);
      setMarksList(student.marks || []);
      setNewSubject('');
      setNewMidTerm('');
      setNewFinal('');
      setShowMarksModal(true);
  };

  const handleAddMark = () => {
    if (!newSubject || !newMidTerm || !newFinal) return;
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
    refreshData();
    setShowMarksModal(false);
  };

  // --- ATTENDANCE HANDLERS (ADMIN) ---
  const openAttendanceModal = (student: StudentRecord) => {
      setCurrentAttendanceStudent(student);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setShowAttendanceModal(true);
  };

  const toggleAttendanceForDate = (status: boolean) => {
      if (!currentAttendanceStudent) return;
      const newHistory = { ...(currentAttendanceStudent.attendanceHistory || {}) };
      newHistory[attendanceDate] = status;
      
      const updatedStudent = { ...currentAttendanceStudent, attendanceHistory: newHistory };
      
      // Update legacy field if date is today
      if (attendanceDate === new Date().toISOString().split('T')[0]) {
          updatedStudent.attendanceToday = status;
      }

      updateStudent(updatedStudent);
      setCurrentAttendanceStudent(updatedStudent); // Update local state for immediate UI feedback
      refreshData();
  };

  const getAttendanceStats = (student: StudentRecord) => {
      const history = student.attendanceHistory || {};
      const dates = Object.keys(history);
      const totalWorking = dates.length;
      const totalPresent = dates.filter(d => history[d] === true).length;
      const percentage = totalWorking > 0 ? ((totalPresent / totalWorking) * 100).toFixed(1) : '0.0';
      return { totalWorking, totalPresent, percentage };
  };

  // --- GENERIC HANDLERS ---
  const openPrincipalModal = (user?: User) => {
    resetForm();
    setModalType('principal');
    if (user) {
        setEditingUser(user);
        setFormName(user.name);
        setFormID(user.loginId);
        setFormPassword(user.password || '');
        setFormSchool(user.schoolName || '');
    }
    setShowAddModal(true);
  };

  const openTeacherModal = (user?: User) => {
    resetForm();
    setModalType('teacher');
    if (user) {
        setEditingUser(user);
        setFormName(user.name);
        setFormID(user.loginId);
        setFormPassword(user.password || '');
        setFormSchool(user.schoolName || '');
        
        const { grade, section } = parseClassString(user.assignedClass || '');
        setFormGrade(grade);
        setFormSection(section);

        setFormSubject(user.assignedSubject || '');
        setFormDesignation(user.designation || '');
        setFormHouse(user.house || '');
        setFormEmail(user.email || '');
        setFormContact(user.contactNumber || '');
        setFormGender(user.gender || 'Male');
    }
    setShowAddModal(true);
  };

  const openStudentModal = (studentRec?: StudentRecord) => {
    resetForm();
    setModalType('student');
    if (studentRec) {
        setEditingStudent(studentRec);
        const linkedUser = users.find(u => u.loginId === studentRec.loginId);
        setEditingUser(linkedUser || null);

        setFormName(studentRec.name);
        setFormID(studentRec.loginId);
        setFormPassword(linkedUser?.password || '');
        setFormSchool(studentRec.schoolName || '');
        
        const { grade, section } = parseClassString(studentRec.className);
        setFormGrade(grade);
        setFormSection(section);

        setFormHouse(studentRec.house || '');
        setFormPost(studentRec.studentPost || '');

        setFormDob(studentRec.dob || '');
        setFormAge(studentRec.age?.toString() || '');
        setFormGender(studentRec.gender || 'Male');
        setFormEmail(studentRec.email || '');
        setFormFatherContact(studentRec.fatherContact || '');
        setFormMotherContact(studentRec.motherContact || '');
    } else {
        setFormGender('Male');
    }
    setShowAddModal(true);
  };

  const openSchoolModal = (school?: SchoolType) => {
      setEditingSchool(school || null);
      if (school) {
          setScFormName(school.name);
          setScFormMaxMarks(school.config?.maxMarks.toString() || '100');
          setScFormHouses(school.config?.houseNames.join(', ') || 'Green, Blue, Yellow, Red');
          setScFormStreams(school.config?.streams.join(', ') || 'Science, Commerce, Humanities');
      } else {
          setScFormName('');
          setScFormMaxMarks('100');
          setScFormHouses('Green, Blue, Yellow, Red');
          setScFormStreams('Science, Commerce, Humanities');
      }
      setShowSchoolModal(true);
  };

  const openAnnouncementModal = () => {
      setAnnTitle('');
      setAnnContent('');
      setAnnAudience('all');
      setAnnSchool(''); 
      setAnnSpoofType('admin');
      setAnnImpersonateId('');
      setAnnCustomName('');
      setShowAnnModal(true);
  };

  // --- ASSIGNMENT HANDLERS ---
  const openAssignModal = (assignment?: Assignment) => {
      setFormError('');
      if (assignment) {
          setEditingAssignment(assignment);
          setAssignTitle(assignment.title);
          setAssignSubject(assignment.subject);
          setAssignContent(assignment.content);
          setAssignDueDate(assignment.dueDate);
          const { grade, section } = parseClassString(assignment.targetClass);
          setAssignGrade(grade);
          setAssignSection(section);
          setAssignSchool(assignment.schoolName);
          setAssignTeacherUid(assignment.teacherUid);
      } else {
          setEditingAssignment(null);
          setAssignTitle('');
          setAssignSubject('');
          setAssignContent('');
          setAssignDueDate('');
          setAssignGrade('');
          setAssignSection('');
          setAssignSchool('');
          setAssignTeacherUid('');
      }
      setShowAssignModal(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');

      if (!assignSchool) {
          setFormError('Please select a school.');
          return;
      }
      if (!assignTeacherUid) {
          setFormError('Please select a teacher to send on behalf of.');
          return;
      }
      if (!assignGrade || !assignSection) {
          setFormError('Please select grade and section.');
          return;
      }

      const selectedTeacher = users.find(u => u.uid === assignTeacherUid);
      if (!selectedTeacher) return;

      const assignmentData: Assignment = {
          id: editingAssignment ? editingAssignment.id : generateId('assign'),
          title: assignTitle,
          subject: assignSubject,
          content: assignContent,
          dueDate: assignDueDate,
          targetClass: `${assignGrade}-${assignSection}`,
          schoolName: assignSchool,
          schoolID: schools.find(s => s.name === assignSchool)?.id,
          authorName: selectedTeacher.name,
          teacherUid: selectedTeacher.uid,
          createdAt: new Date().toISOString()
      };

      if (editingAssignment) {
          updateAssignment(assignmentData);
      } else {
          addAssignment(assignmentData);
      }
      refreshData();
      setShowAssignModal(false);
  };

  const handleDeleteAssignment = (id: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Delete Assignment',
          message: 'Delete this assignment permanently?',
          onConfirm: () => {
              deleteAssignment(id);
              refreshData();
          }
      });
  };

  const resetForm = () => {
    setEditingUser(null);
    setEditingStudent(null);
    setFormError('');
    setFormName('');
    setFormID('');
    setFormPassword('');
    setFormGrade('');
    setFormSection('');
    setFormSubject('');
    setFormDesignation('');
    setFormHouse('');
    setFormPost('');
    setFormEmail('');
    setFormContact('');
    setFormSchool('');
    
    setFormDob('');
    setFormAge('');
    setFormGender('Male');
    setFormFatherContact('');
    setFormMotherContact('');
  };

  const handleSaveSchool = (e: React.FormEvent) => {
      e.preventDefault();
      const config: SchoolConfig = {
          maxMarks: parseInt(scFormMaxMarks) || 100,
          houseNames: scFormHouses.split(',').map(s => s.trim()).filter(s => s),
          streams: scFormStreams.split(',').map(s => s.trim()).filter(s => s)
      };

      if (editingSchool) {
          updateSchool({
              ...editingSchool,
              name: scFormName,
              config
          });
      } else {
          addSchool(scFormName, config);
      }
      refreshData();
      setShowSchoolModal(false);
  };

  const handleDeleteSchool = (id: string, name: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Delete School',
          message: `Delete school "${name}"? Users assigned to this school will retain the text value but may need reassignment.`,
          onConfirm: () => {
              removeSchool(id);
              refreshData();
          }
      });
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (modalType === 'principal') handleSavePrincipal(e);
      else if (modalType === 'teacher') handleSaveTeacher(e);
      else if (modalType === 'student') handleSaveStudent(e);
  }

  const handleSavePrincipal = (e: React.FormEvent) => {
    setFormError('');
    if (!formSchool) { setFormError("Please assign a School."); return; }
    
    const isDuplicate = users.some(u => u.loginId === formID && u.uid !== editingUser?.uid);
    if (isDuplicate) { 
        setFormError("School ID already exists."); 
        return; 
    }

    if (editingUser) {
        updateUser({ ...editingUser, name: formName, loginId: formID, password: formPassword, schoolName: formSchool, schoolID: schools.find(s => s.name === formSchool)?.id });
    } else {
        addUser({
            uid: generateId('u'), name: formName, loginId: formID, password: formPassword,
            role: UserRole.PRINCIPAL, schoolName: formSchool, schoolID: schools.find(s => s.name === formSchool)?.id,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formName)}&background=3b82f6&color=fff`
        });
    }
    refreshData();
    setShowAddModal(false);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    setFormError('');
    if (!formSchool) { setFormError("Please assign a School."); return; }
    
    // Class/Section is optional for Subject Teachers
    let fullClass = '';
    if (formGrade) {
        if (!formSection) { setFormError("Please select a Section if Grade is selected."); return; }
        fullClass = `${formGrade}-${formSection}`;
    }

    const isDuplicate = users.some(u => u.loginId === formID && u.uid !== editingUser?.uid);
    if (isDuplicate) { 
        setFormError("School ID already exists."); 
        return; 
    }

    const userData: User = {
        uid: editingUser ? editingUser.uid : generateId('u'),
        name: formName, loginId: formID, password: formPassword,
        role: UserRole.TEACHER, assignedClass: fullClass, assignedSubject: formSubject,
        designation: formDesignation, house: formHouse, email: formEmail, contactNumber: formContact,
        schoolName: formSchool, schoolID: schools.find(s => s.name === formSchool)?.id,
        gender: formGender,
        avatarUrl: editingUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formName)}&background=8b5cf6&color=fff`
    };

    if (editingUser) updateUser(userData); else addUser(userData);
    refreshData();
    setShowAddModal(false);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    setFormError('');
    if (!formSchool) { setFormError("Please assign a School."); return; }
    if (!formGrade || !formSection) { setFormError("Please select Class/Section."); return; }
    const fullClass = `${formGrade}-${formSection}`;
    
    const isDuplicate = users.some(u => u.loginId === formID && u.uid !== editingUser?.uid);
    if (isDuplicate) { 
        setFormError("School ID already exists."); 
        return; 
    }

    if (editingStudent) {
        updateStudent({
            ...editingStudent, name: formName, loginId: formID, className: fullClass,
            house: formHouse, studentPost: formPost, dob: formDob, age: parseInt(formAge) || 0,
            gender: formGender, email: formEmail, fatherContact: formFatherContact, motherContact: formMotherContact,
            schoolName: formSchool, schoolID: schools.find(s => s.name === formSchool)?.id
        });
        if (editingUser) {
            updateUser({ ...editingUser, name: formName, loginId: formID, password: formPassword, className: fullClass, email: formEmail, gender: formGender, dob: formDob, schoolName: formSchool, schoolID: schools.find(s => s.name === formSchool)?.id });
        }
    } else {
        addStudent({
            id: generateId('s'), name: formName, loginId: formID, rollNumber: 0, className: fullClass,
            attendanceToday: null, gradeAverage: 0, house: formHouse, studentPost: formPost, marks: [],
            dob: formDob, age: parseInt(formAge) || 0, gender: formGender, email: formEmail, fatherContact: formFatherContact, motherContact: formMotherContact,
            schoolName: formSchool, schoolID: schools.find(s => s.name === formSchool)?.id
        });
        addUser({
            uid: generateId('u'), name: formName, loginId: formID, password: formPassword,
            role: UserRole.STUDENT, className: fullClass, email: formEmail, gender: formGender, dob: formDob, schoolName: formSchool, schoolID: schools.find(s => s.name === formSchool)?.id,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formName)}&background=f59e0b&color=fff`
        });
    }
    refreshData();
    setShowAddModal(false);
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
      e.preventDefault();
      let authorName = 'System Administrator';
      if (annSpoofType === 'impersonate' && annImpersonateId) {
          const userToImpersonate = users.find(u => u.uid === annImpersonateId);
          if (userToImpersonate) authorName = userToImpersonate.name;
      } else if (annSpoofType === 'custom' && annCustomName) {
          authorName = annCustomName;
      }

      addAnnouncement({
          id: generateId('ann'), title: annTitle, content: annContent,
          date: new Date().toISOString().split('T')[0], audience: annAudience,
          author: authorName, ...(annSchool ? { schoolName: annSchool, schoolID: schools.find(s => s.name === annSchool)?.id } : {})
      });
      refreshData();
      setShowAnnModal(false);
  };

  const handleDeleteUser = (user: User) => {
      setConfirmState({
          isOpen: true,
          title: 'Delete User',
          message: `Delete user ${user.name}?`,
          onConfirm: () => {
              removeUser(user.uid);
              if(user.role === UserRole.STUDENT) {
                 const freshStudents = getStoredStudents();
                 const s = freshStudents.find(s => s.loginId === user.loginId);
                 if (s) removeStudent(s.id);
              }
              refreshData();
          }
      });
  };

  const handleDeleteStudentRecord = (student: StudentRecord) => {
      setConfirmState({
          isOpen: true,
          title: 'Delete Student',
          message: `Delete student ${student.name}?`,
          onConfirm: () => {
              removeStudent(student.id);
              const freshUsers = getStoredUsers();
              const u = freshUsers.find(user => user.loginId === student.loginId);
              if (u) removeUser(u.uid);
              refreshData();
          }
      });
  }

  const handleDeleteAnnouncement = (id: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Delete Announcement',
          message: 'Delete this announcement globally?',
          onConfirm: () => {
              deleteAnnouncement(id);
              refreshData();
          }
      });
  }

  const handleDeleteFromModal = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (modalType === 'student' && editingStudent) {
         setConfirmState({
             isOpen: true,
             title: 'Delete Student',
             message: `Delete student ${editingStudent.name}?`,
             onConfirm: () => {
                 removeStudent(editingStudent.id);
                 const freshUsers = getStoredUsers();
                 const u = freshUsers.find(u => u.loginId === editingStudent.loginId);
                 if (u) removeUser(u.uid);
                 refreshData();
                 setShowAddModal(false);
             }
         });
      } else if (editingUser) {
          setConfirmState({
              isOpen: true,
              title: 'Delete User',
              message: `Delete user ${editingUser.name}?`,
              onConfirm: () => {
                  removeUser(editingUser.uid);
                  if(editingUser.role === UserRole.STUDENT) {
                      const freshStudents = getStoredStudents();
                      const s = freshStudents.find(s => s.loginId === editingUser.loginId);
                      if (s) removeStudent(s.id);
                  }
                  refreshData();
                  setShowAddModal(false);
              }
          });
      }
  };


  
  const handleWipeDatabase = async () => {
    setResetModal({ isOpen: true, step: 1, telOtp: '', emailOtp: '', pass: '', loading: false });
  };

  const executeFactoryReset = async () => {
    setResetModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/factory-reset/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramOtp: resetModal.telOtp,
          emailOtp: resetModal.emailOtp,
          masterPassword: resetModal.pass
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Reset failed');
        setResetModal(prev => ({ ...prev, loading: false }));
        return;
      }
      
      localStorage.clear();
      const adminUser = users.find(u => u.role === UserRole.SUPREME_ADMIN);
      if (adminUser) {
        localStorage.setItem('nexus_erp_users_v2', JSON.stringify([adminUser]));
      }
      
      alert('FACTORY RESET COMPLETE.\n\n' + data.message);
      window.location.reload();
    } catch (e) {
      alert('Server error executing reset.');
      setResetModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSendTelegramReport = async () => {
    try {
      alert('...');
      
      const totalPayments = payments.length;
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const pendingCount = payments.filter(p => p.status === 'pending').length;
      const successCount = payments.filter(p => p.status === 'success').length;
      const failedCount = payments.filter(p => p.status === 'failed').length;

      let msg = `📊 *Platform Payments Status*\n\n`;
      msg += `Total Payments Recorded: ${totalPayments}\n`;
      msg += `Total Value: ₹${totalAmount}\n\n`;
      msg += `✅ Successful: ${successCount}\n`;
      msg += `⏳ Pending: ${pendingCount}\n`;
      msg += `❌ Failed: ${failedCount}\n\n`;
      
      if (pendingCount > 0) {
        msg += `*Pending Payments:*\n`;
        payments.filter(p => p.status === 'pending').forEach(p => {
           msg += `- ${p.schoolName} (₹${p.amount})\n`;
        });
      }

      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });

      if (res.ok) {
        alert('...');
      } else {
        alert('...');
      }
    } catch (err) {
      alert('...');
    }
  };

  const principals = users.filter(u => u.role === UserRole.PRINCIPAL);
  const teachers = users.filter(u => u.role === UserRole.TEACHER);
  
  const allClasses = Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort();
  const filteredStudents = selectedClass === 'All' ? students : students.filter(s => s.className === selectedClass);

    return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Console</h1>
          <p className="text-slate-500 dark:text-slate-400">Full System Control & Data Management</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Overview</button>
            <button onClick={() => setActiveTab('schools')} className={`px-4 py-2 rounded-md text-sm font-medium flex gap-1 ${activeTab === 'schools' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><School size={16} /> Schools</button>
            <button onClick={() => setActiveTab('principals')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'principals' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Principals</button>
            <button onClick={() => setActiveTab('teachers')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'teachers' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Teachers</button>
            <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'students' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Students</button>
            <button onClick={() => setActiveTab('announcements')} className={`px-4 py-2 rounded-md text-sm font-medium flex gap-1 ${activeTab === 'announcements' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Megaphone size={16} /> Posts</button>
            <button onClick={() => setActiveTab('assignments')} className={`px-4 py-2 rounded-md text-sm font-medium flex gap-1 ${activeTab === 'assignments' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><ClipboardList size={16} /> Assign</button>
            <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded-md text-sm font-medium flex gap-1 ${activeTab === 'payments' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><CreditCard size={16} /> Payments</button>
            <button onClick={() => setActiveTab('monitoring')} className={`px-4 py-2 rounded-md text-sm font-medium flex gap-1 ${activeTab === 'monitoring' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Shield size={16} /> Monitor</button>
        </div>
      </header>

      
      {/* MONITORING TAB */}
      {activeTab === 'monitoring' && (
        <MonitoringDashboard onFactoryReset={handleWipeDatabase} />
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 w-fit rounded-lg mb-4"><School className="text-indigo-600 dark:text-indigo-400" /></div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Schools</h3>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{schools.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 w-fit rounded-lg mb-4"><Building2 className="text-blue-600 dark:text-blue-400" /></div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Principals</h3>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{principals.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 w-fit rounded-lg mb-4"><Users className="text-purple-600 dark:text-purple-400" /></div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Teachers</h3>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{teachers.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="p-3 bg-green-100 dark:bg-green-900/50 w-fit rounded-lg mb-4"><GraduationCap className="text-green-600 dark:text-green-400" /></div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Students</h3>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{students.length}</p>
          </div>
        </div>
      )}
      
      {/* SCHOOLS TAB */}
      {activeTab === 'schools' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                 <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">School Directory</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage registered schools and their configurations.</p>
                 </div>
                 <button onClick={() => openSchoolModal()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg flex gap-2 items-center hover:bg-indigo-700 transition-colors"><Plus size={18} /> Add New School</button>
             </div>
             
             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800"><tr><th className="px-6 py-4">School Name</th><th className="px-6 py-4">Max Marks</th><th className="px-6 py-4">Houses Config</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {schools.map(s => (
                                <tr key={s.id || Math.random().toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {s.name}
                                        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">{s.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{s.config?.maxMarks || 100}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                                        <div className="flex gap-1 flex-wrap">
                                            {s.config?.houseNames.map((h, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs">{h}</span>
                                            )) || <span className="text-slate-400 italic">Default</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openSchoolModal(s)} className="text-blue-500 mr-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded"><Pencil size={18} /></button>
                                        <button onClick={() => handleDeleteSchool(s.id, s.name)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
      )}

      {/* PRINCIPALS TAB */}
      {activeTab === 'principals' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Principals</h2>
            <button onClick={() => openPrincipalModal()} className="flex gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={18} /> Add Principal</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">School</th><th className="px-6 py-4">ID</th><th className="px-6 py-4">Pass</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {principals.map(p => (
                    <tr key={p.uid || Math.random().toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 flex gap-3 text-slate-900 dark:text-white"><img src={p.avatarUrl} className="w-8 h-8 rounded-full" /> {p.name}</td>
                    <td className="px-6 py-4 text-blue-700 dark:text-blue-400 font-semibold">{p.schoolName || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.loginId}</td>
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500">{p.password}</td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => openPrincipalModal(p)} className="text-blue-500 mr-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteUser(p)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded"><Trash2 size={18} /></button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEACHERS TAB */}
      {activeTab === 'teachers' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Teachers</h2>
            <button onClick={() => openTeacherModal()} className="flex gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={18} /> Add Teacher</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">School</th><th className="px-6 py-4">ID</th><th className="px-6 py-4">Subject</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teachers.map(t => (
                    <tr key={t.uid || Math.random().toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 flex gap-3 text-slate-900 dark:text-white"><img src={t.avatarUrl} className="w-8 h-8 rounded-full" /> {t.name}</td>
                    <td className="px-6 py-4 text-blue-700 dark:text-blue-400 font-semibold">{t.schoolName || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{t.loginId}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{t.assignedSubject}</td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => openTeacherModal(t)} className="text-blue-500 mr-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteUser(t)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded"><Trash2 size={18} /></button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 border p-2 rounded-lg outline-none">
                        <option value="All">All Classes</option>
                        {allClasses.map(c => <option key={c || Math.random().toString()} value={c}>{c}</option>)}
                    </select>
                </div>
                <button onClick={() => openStudentModal()} className="flex gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={18} /> Add Student</button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">School</th>
                            <th className="px-6 py-4">Class</th>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4 text-center">Manage</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredStudents.map(s => (
                            <tr key={s.id || Math.random().toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{s.name}</td>
                                <td className="px-6 py-4 text-blue-700 dark:text-blue-400">{s.schoolName || 'Unassigned'}</td>
                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{s.className}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{s.loginId}</td>
                                <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => openMarksModal(s)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700" title="Edit Marks">
                                    <GraduationCap size={16} />
                                    </button>
                                    <button onClick={() => openAttendanceModal(s)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700" title="Attendance">
                                    <Calendar size={16} />
                                    </button>
                                </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openStudentModal(s)} className="text-blue-500 mr-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded"><Pencil size={18} /></button>
                                    <button onClick={() => handleDeleteStudentRecord(s)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Announcements</h2>
                  <button onClick={openAnnouncementModal} className="flex gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={18} /> Create Post</button>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800"><tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">School</th><th className="px-6 py-4">Audience</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {announcements.map(ann => (
                                  <tr key={ann.id || Math.random().toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{ann.title}</td>
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{ann.schoolName || 'Global'}</td>
                                      <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-300">{ann.audience}</td>
                                      <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded"><Trash2 size={18} /></button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
      
      {/* ASSIGNMENTS TAB */}
      {activeTab === 'assignments' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Assignments</h2>
                  <button onClick={() => openAssignModal()} className="flex gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={18} /> New Assignment</button>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-100 dark:border-slate-800"><tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">School</th><th className="px-6 py-4">Class</th><th className="px-6 py-4">By</th><th className="px-6 py-4">Submissions</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {assignments.map(assign => (
                                  <tr key={assign.id || Math.random().toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{assign.title}</td>
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{assign.schoolName}</td>
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{assign.targetClass}</td>
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{assign.authorName}</td>
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">{assign.submissions?.length || 0}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => openAssignModal(assign)} className="text-blue-500 mr-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded"><Pencil size={18} /></button>
                                          <button onClick={() => handleDeleteAssignment(assign.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded"><Trash2 size={18} /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: ADMIN MARKS MANAGEMENT */}
      {showMarksModal && currentMarksStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto py-10 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-3xl shadow-2xl relative border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Manage Marks (Admin)</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Student: {currentMarksStudent.name} ({currentMarksStudent.schoolName})</p>
                  </div>
                  <button onClick={() => setShowMarksModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl">&times;</button>
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-3 items-end bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Subject</label>
                          <input className="w-full px-3 py-2 border dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
                        </div>
                        <div className="w-full md:w-24">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Mid-Term</label>
                          <input type="number" className="w-full px-3 py-2 border dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" value={newMidTerm} onChange={e => setNewMidTerm(e.target.value)} />
                        </div>
                        <div className="w-full md:w-24">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Finals</label>
                          <input type="number" className="w-full px-3 py-2 border dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" value={newFinal} onChange={e => setNewFinal(e.target.value)} />
                        </div>
                        <button onClick={handleAddMark} className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium h-[38px] hover:bg-blue-700 flex items-center justify-center">
                          <Plus size={16} /> <span className="md:hidden ml-1">Add</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Mid</th>
                                <th className="px-4 py-3">Final</th>
                                <th className="px-4 py-3">Avg</th>
                                <th className="px-4 py-3 text-right"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {marksList.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No marks recorded.</td></tr>}
                            {marksList.map((m, idx) => (
                                <tr key={idx}>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.subject}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.midTerm}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.final}</td>
                                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{((m.midTerm + m.final) / 2).toFixed(1)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleRemoveMark(idx)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400">
                                    <Trash2 size={16} />
                                    </button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setShowMarksModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                  <button onClick={saveMarks} className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700">Save Grades</button>
                </div>
            </div>
          </div>
      )}

      {/* MODAL: ADMIN ATTENDANCE MANAGEMENT */}
      {showAttendanceModal && currentAttendanceStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto py-10 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Manage Attendance</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Student: {currentAttendanceStudent.name}</p>
                    </div>
                    <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 text-2xl hover:text-slate-600 dark:hover:text-slate-300">&times;</button>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                          <div className="text-xs text-slate-400 uppercase font-bold">Total Days</div>
                          <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{getAttendanceStats(currentAttendanceStudent).totalWorking}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                          <div className="text-xs text-slate-400 uppercase font-bold">Present</div>
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">{getAttendanceStats(currentAttendanceStudent).totalPresent}</div>
                      </div>
                       <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                          <div className="text-xs text-slate-400 uppercase font-bold">Percentage</div>
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{getAttendanceStats(currentAttendanceStudent).percentage}%</div>
                      </div>
                  </div>

                  {/* Edit Controls */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Select Date to Modify</label>
                      <input 
                          type="date" 
                          className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 text-slate-900 dark:text-white mb-4"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]} 
                      />
                      
                      <div className="flex gap-3">
                          <button 
                              onClick={() => toggleAttendanceForDate(true)}
                              className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border transition-colors ${
                                  currentAttendanceStudent.attendanceHistory?.[attendanceDate] === true
                                  ? 'bg-green-600 text-white border-green-700 shadow-sm'
                                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-500'
                              }`}
                          >
                              <CheckCircle size={18} /> Present
                          </button>
                          <button 
                              onClick={() => toggleAttendanceForDate(false)}
                              className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border transition-colors ${
                                  currentAttendanceStudent.attendanceHistory?.[attendanceDate] === false
                                  ? 'bg-red-600 text-white border-red-700 shadow-sm'
                                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-500'
                              }`}
                          >
                              <XCircle size={18} /> Absent
                          </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-3 text-center">Changes are saved immediately.</p>
                  </div>
                  
                  <div className="mt-6">
                      <button onClick={() => setShowAttendanceModal(false)} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">Close</button>
                  </div>
              </div>
          </div>
      )}

      {/* ASSIGNMENT MODAL (ADMIN) */}
      {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto py-10 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</h2>
                  <form onSubmit={handleSaveAssignment} className="space-y-4">
                      {formError && <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">{formError}</div>}
                      
                      {/* Admin Controls: School & Teacher Selection */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div className="col-span-2">
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target School</label>
                              <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={assignSchool} onChange={e => {setAssignSchool(e.target.value); setAssignTeacherUid('');}}>
                                  <option value="">Select School</option>
                                  {schools.map(s => <option key={s.id || Math.random().toString()} value={s.name}>{s.name}</option>)}
                              </select>
                          </div>
                          <div className="col-span-2">
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Send on Behalf Of (Teacher)</label>
                              <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={assignTeacherUid} onChange={e => setAssignTeacherUid(e.target.value)} disabled={!assignSchool}>
                                  <option value="">Select Teacher</option>
                                  {users.filter(u => u.schoolName === assignSchool && u.role === UserRole.TEACHER).map(t => (
                                      <option key={t.uid || Math.random().toString()} value={t.uid}>{t.name} ({t.assignedSubject || 'Teacher'})</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Title</label>
                          <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder="e.g. Chapter 1 Review" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Subject</label>
                               <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={assignSubject} onChange={e => setAssignSubject(e.target.value)} required />
                           </div>
                           <div>
                               <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Due Date</label>
                               <input type="date" className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} required />
                           </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Target Grade</label>
                              <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={assignGrade} onChange={e => {setAssignGrade(e.target.value); setAssignSection('');}}>
                                  <option value="">Select Grade</option>
                                  {CLASS_GRADES.map(g => <option key={g || Math.random().toString()} value={g}>{g}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Target Section</label>
                              <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={assignSection} onChange={e => setAssignSection(e.target.value)} disabled={!assignGrade}>
                                  <option value="">Select Section</option>
                                  <option value="All">All Sections</option>
                                  {getSectionOptions(assignGrade).map(s => <option key={s || Math.random().toString()} value={s}>{s}</option>)}
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Instructions / Content</label>
                          <textarea className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded h-32" value={assignContent} onChange={e => setAssignContent(e.target.value)} placeholder="Details about the assignment..." required />
                      </div>
                      <div className="flex gap-2 mt-4">
                          <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 border dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                          <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                             {editingAssignment ? 'Update Assignment' : 'Send Assignment'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* SCHOOL CONFIG MODAL */}
      {showSchoolModal && (
          <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto py-10 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{editingSchool ? 'Edit School Configuration' : 'Add New School'}</h2>
                  <form onSubmit={handleSaveSchool} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">School Name</label>
                          <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={scFormName} onChange={e => setScFormName(e.target.value)} required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Maximum Grading Marks (Global)</label>
                          <input type="number" className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={scFormMaxMarks} onChange={e => setScFormMaxMarks(e.target.value)} required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">House Teams (Comma Separated)</label>
                          <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={scFormHouses} onChange={e => setScFormHouses(e.target.value)} placeholder="e.g. Red, Blue, Green, Yellow" />
                          <p className="text-xs text-slate-400 mt-1">Define the house teams available for students.</p>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Senior Streams / Sections (Comma Separated)</label>
                          <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={scFormStreams} onChange={e => setScFormStreams(e.target.value)} placeholder="e.g. Science, Commerce, Humanities" />
                          <p className="text-xs text-slate-400 mt-1">Used for 11th and 12th grade class divisions.</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                          <button type="button" onClick={() => setShowSchoolModal(false)} className="flex-1 px-4 py-2 border dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                          <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Configuration</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* USER MODAL (PRINCIPAL, TEACHER, STUDENT) */}
      
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-red-500/30">
            <div className="bg-red-50 dark:bg-red-900/30 p-6 border-b border-red-100 dark:border-red-900/50 text-center">
               <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-500 mx-auto mb-4" />
               <h2 className="text-2xl font-black text-red-700 dark:text-red-400 uppercase tracking-wider">Restricted Area</h2>
               <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-2 font-medium">Multi-Factor Authentication Required</p>
            </div>
            <div className="p-6 space-y-6">
              {resetModal.step === 1 && (
                <div className="animate-fade-in text-center space-y-4">
                   <p className="text-slate-600 dark:text-slate-300 font-medium">
                     You are about to initiate a full system wipe. This requires 3-step verification.
                   </p>
                   <button 
                     onClick={async () => {
                       setResetModal(prev => ({...prev, loading: true}));
                       const res = await fetch('/api/factory-reset/request-telegram', { method: 'POST' });
                       const data = await res.json();
                       if (!res.ok) { alert(data.error || 'Request failed'); return setResetModal(prev => ({...prev, loading: false})); }
                       if (data.message) alert(data.message);
                       setResetModal(prev => ({...prev, loading: false, step: 2}));
                     }}
                     disabled={resetModal.loading}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                   >
                     {resetModal.loading ? 'Requesting...' : '1. Request Telegram OTP'}
                   </button>
                </div>
              )}

              {resetModal.step === 2 && (
                <div className="animate-fade-in space-y-4">
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Enter Telegram OTP</label>
                   <input type="text" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center text-2xl tracking-[0.5em] font-mono" 
                          value={resetModal.telOtp} onChange={e => setResetModal(prev => ({...prev, telOtp: e.target.value}))} />
                   
                   <button 
                     onClick={async () => {
                       if (!resetModal.telOtp) return alert('Enter OTP');
                       setResetModal(prev => ({...prev, loading: true}));
                       const res = await fetch('/api/factory-reset/request-email', { method: 'POST' });
                       const data = await res.json();
                       if (!res.ok) { alert(data.error || 'Request failed'); return setResetModal(prev => ({...prev, loading: false})); }
                       if (data.message) alert(data.message);
                       setResetModal(prev => ({...prev, loading: false, step: 3}));
                     }}
                     disabled={resetModal.loading}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all"
                   >
                     {resetModal.loading ? 'Verifying...' : 'Next: Request Email OTP'}
                   </button>
                </div>
              )}

              {resetModal.step === 3 && (
                <div className="animate-fade-in space-y-4">
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Enter Email OTP</label>
                   <input type="text" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center text-2xl tracking-[0.5em] font-mono" 
                          value={resetModal.emailOtp} onChange={e => setResetModal(prev => ({...prev, emailOtp: e.target.value}))} />
                   
                   <button 
                     onClick={() => {
                       if (!resetModal.emailOtp) return alert('Enter OTP');
                       setResetModal(prev => ({...prev, step: 4}));
                     }}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all"
                   >
                     Next: Master Password
                   </button>
                </div>
              )}

              {resetModal.step === 4 && (
                <div className="animate-fade-in space-y-4">
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Enter Master Secret Password</label>
                   <input type="password" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center text-xl font-mono" 
                          value={resetModal.pass} onChange={e => setResetModal(prev => ({...prev, pass: e.target.value}))} />
                   
                   <button 
                     onClick={executeFactoryReset}
                     disabled={resetModal.loading}
                     className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/30"
                   >
                     {resetModal.loading ? 'EXECUTING WIPE...' : 'EXECUTE FACTORY RESET'}
                   </button>
                </div>
              )}

              <button 
                onClick={() => setResetModal({ isOpen: false, step: 1, telOtp: '', emailOtp: '', pass: '', loading: false })}
                className="w-full text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors mt-4"
              >
                Cancel & Abort
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto py-10 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                {editingUser || editingStudent ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
                {formError && <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">{formError}</div>}
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                    <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formName} onChange={e => setFormName(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Assigned School</label>
                    <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formSchool} onChange={e => setFormSchool(e.target.value)} required>
                        <option value="">Select School</option>
                        {schools.map(s => <option key={s.id || Math.random().toString()} value={s.name}>{s.name}</option>)}
                    </select>
                </div>

                {/* Teacher/Student: Class & Section */}
                {(modalType === 'teacher' || modalType === 'student') && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Grade {modalType === 'teacher' && '(Optional)'}</label>
                            <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formGrade} onChange={e => { setFormGrade(e.target.value); setFormSection(''); }}>
                                <option value="">Select</option>
                                {CLASS_GRADES.map(g => <option key={g || Math.random().toString()} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Section / Stream</label>
                            <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formSection} onChange={e => setFormSection(e.target.value)} disabled={!formGrade}>
                                <option value="">Select</option>
                                {getSectionOptions(formGrade).map(s => <option key={s || Math.random().toString()} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Teacher Extras */}
                {modalType === 'teacher' && (
                    <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Gender</label>
                            <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formGender} onChange={e => setFormGender(e.target.value)}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Designation</label>
                            <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" placeholder="Designation" value={formDesignation} onChange={e => setFormDesignation(e.target.value)} />
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Subject</label>
                         <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" placeholder="Subject" value={formSubject} onChange={e => setFormSubject(e.target.value)} />
                    </div>
                    {/* HOUSE SELECT */}
                    <div>
                         <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">House Team</label>
                         <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formHouse} onChange={e => setFormHouse(e.target.value as HouseTeam)}>
                             <option value="">Select House</option>
                             {getHouseOptions().map(h => <option key={h || Math.random().toString()} value={h}>{h}</option>)}
                         </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email</label>
                            <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" placeholder="Email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Phone</label>
                             <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" placeholder="Phone" value={formContact} onChange={e => setFormContact(e.target.value)} />
                        </div>
                    </div>
                    </>
                )}

                {/* Student Extras */}
                {modalType === 'student' && (
                    <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Gender</label>
                            <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formGender} onChange={e => setFormGender(e.target.value)}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Date of Birth</label>
                            <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" type="date" value={formDob} onChange={handleDobChange} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Student Post</label>
                            <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" placeholder="e.g. Head Boy" value={formPost} onChange={e => setFormPost(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email</label>
                            <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" placeholder="student@school.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Father Contact</label>
                            <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formFatherContact} onChange={e => setFormFatherContact(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Mother Contact</label>
                            <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formMotherContact} onChange={e => setFormMotherContact(e.target.value)} />
                        </div>
                    </div>
                     {/* HOUSE SELECT */}
                    <div>
                         <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">House Team</label>
                         <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formHouse} onChange={e => setFormHouse(e.target.value as HouseTeam)}>
                             <option value="">Select House</option>
                             {getHouseOptions().map(h => <option key={h || Math.random().toString()} value={h}>{h}</option>)}
                         </select>
                    </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">School ID</label>
                    <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formID} onChange={e => setFormID(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Password</label>
                    <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={formPassword} onChange={e => setFormPassword(e.target.value)} required />
                </div>

                <div className="flex gap-2 mt-4">
                    {(editingUser || editingStudent) && (
                        <button type="button" onClick={handleDeleteFromModal} className="px-4 py-2 text-red-600 border border-red-200 dark:border-red-900/50 rounded hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                    )}
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnModal && (
          <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto py-10 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Post Announcement</h2>
                  <form onSubmit={handlePostAnnouncement} className="space-y-4">
                      <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label><input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required /></div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target School</label>
                          <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={annSchool} onChange={e => setAnnSchool(e.target.value)}>
                              <option value="">All Schools</option>
                              {schools.map(s => <option key={s.id || Math.random().toString()} value={s.name}>{s.name}</option>)}
                          </select>
                      </div>
                      
                      {/* SENDER IDENTITY SPOOFING */}
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Sender Identity (Who is this from?)</label>
                          <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                                  <input type="radio" name="spoof" checked={annSpoofType === 'admin'} onChange={() => setAnnSpoofType('admin')} />
                                  System Administrator (Default)
                              </label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                                  <input type="radio" name="spoof" checked={annSpoofType === 'impersonate'} onChange={() => setAnnSpoofType('impersonate')} />
                                  Impersonate User
                              </label>
                              {annSpoofType === 'impersonate' && (
                                  <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded text-sm ml-6" value={annImpersonateId} onChange={e => setAnnImpersonateId(e.target.value)}>
                                      <option value="">Select User...</option>
                                      {users.filter(u => !annSchool || u.schoolName === annSchool).map(u => (
                                          <option key={u.uid || Math.random().toString()} value={u.uid}>{u.name} ({u.role})</option>
                                      ))}
                                  </select>
                              )}
                              <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                                  <input type="radio" name="spoof" checked={annSpoofType === 'custom'} onChange={() => setAnnSpoofType('custom')} />
                                  Custom Name / Department
                              </label>
                              {annSpoofType === 'custom' && (
                                  <input className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded text-sm ml-6" placeholder="e.g. Sports Department" value={annCustomName} onChange={e => setAnnCustomName(e.target.value)} />
                              )}
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Audience</label>
                          <select className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded" value={annAudience} onChange={(e: any) => setAnnAudience(e.target.value)}>
                              <option value="all">Everyone</option>
                              <option value="student">Students</option>
                              <option value="teacher">Teachers</option>
                          </select>
                      </div>
                      <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Content</label><textarea className="w-full p-2 border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded h-32" value={annContent} onChange={e => setAnnContent(e.target.value)} required /></div>
                      <div className="flex gap-2"><button type="button" onClick={() => setShowAnnModal(false)} className="flex-1 p-2 border dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button><button type="submit" className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Post</button></div>
                  </form>
              </div>
          </div>
      )}
      
      
      {activeTab === 'payments' && (
        <div className="space-y-6 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><CreditCard size={28} className="text-blue-500" /> Platform Payments</h1>
            <p className="text-slate-500 dark:text-slate-400">Verify and manage fee payments from schools</p>
          </div>
          <button
            onClick={handleSendTelegramReport}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Send size={18} /> Send Telegram Report
          </button>
        </header>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                 <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                     <tr>
                         <th className="px-6 py-4 font-medium">School</th>
                         <th className="px-6 py-4 font-medium">Principal</th>
                         <th className="px-6 py-4 font-medium">Amount</th>
                         <th className="px-6 py-4 font-medium">Txn Details</th>
                         <th className="px-6 py-4 font-medium">Date</th>
                         <th className="px-6 py-4 font-medium text-right">Status / Action</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {payments.length === 0 ? (
                         <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No payment records found.</td></tr>
                     ) : (
                         payments.map(p => (
                             <tr key={p.id || Math.random().toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                 <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.schoolName}</td>
                                 <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.principalName}</td>
                                 <td className="px-6 py-4 font-bold text-blue-500">₹{p.amount}</td>
                                 <td className="px-6 py-4">
                                     <div className="font-mono text-xs text-slate-500">{p.transactionId}</div>
                                     {p.senderUpiId && (
                                         <div className="text-xs text-slate-400 mt-1">UPI: {p.senderUpiId}</div>
                                     )}
                                 </td>
                                 <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{p.date}</td>
                                 <td className="px-6 py-4 text-right">
                                     {p.status === 'success' ? (
                                         <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold">
                                             <CheckCircle size={14} /> Verified
                                         </span>
                                     ) : p.status === 'failed' ? (
                                         <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold">
                                             <XCircle size={14} /> Failed
                                         </span>
                                     ) : (
                                         <div className="flex items-center justify-end gap-2">
                                             <button 
                                                 onClick={() => {
                                                     updatePayment({ ...p, status: 'success' });
                                                     refreshData();
                                                 }}
                                                 className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors" title="Verify Payment"
                                             >
                                                 <CheckCircle size={18} />
                                             </button>
                                             <button 
                                                 onClick={() => {
                                                     updatePayment({ ...p, status: 'failed' });
                                                     refreshData();
                                                 }}
                                                 className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Reject Payment"
                                             >
                                                 <XCircle size={18} />
                                             </button>
                                         </div>
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
      )}

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminDashboard;