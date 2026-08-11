const fs = require('fs');
let code = fs.readFileSync('pages/TeacherDashboard.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\n\s*\/\/\s*Load students and sort[\s\S]*?refreshMessages\(\);\n  \}, \[selectedClass, currentUser\.schoolName, currentUser\.uid\]\);/g;

code = code.replace(regex, `useEffect(() => {
    const loadData = () => {
        const loadedStudents = getStoredStudents();
        const schoolStudents = loadedStudents.filter(s => 
            s.schoolName === currentUser.schoolName &&
            s.className === selectedClass
        );
        const sortedStudents = schoolStudents.sort((a, b) => a.rollNumber - b.rollNumber);
        setStudents(sortedStudents);
        setUsers(getStoredUsers());

        const allAnn = getStoredAnnouncements();
        const relevantAnn = allAnn.filter(a => 
            (a.audience === 'all' || a.audience === 'teacher') && 
            (!a.schoolName || a.schoolName === currentUser.schoolName)
        );
        setAnnouncements(relevantAnn);
        
        refreshAssignments();
        refreshMessages();
    };
    
    loadData();
    window.addEventListener('nexus_data_changed', loadData);
    return () => window.removeEventListener('nexus_data_changed', loadData);
  }, [selectedClass, currentUser.schoolName, currentUser.uid]);`);

fs.writeFileSync('pages/TeacherDashboard.tsx', code);
