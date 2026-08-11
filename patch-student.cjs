const fs = require('fs');
let code = fs.readFileSync('pages/StudentDashboard.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\n\s*\/\/ Fetch Announcements[\s\S]*?refreshMessages\(\);\n  \}, \[user\.className, user\.schoolName, user\.uid\]\);/g;

code = code.replace(regex, `useEffect(() => {
    const loadData = () => {
        const allAnn = getStoredAnnouncements();
        const relevantAnn = allAnn.filter(a => 
            (a.audience === 'all' || a.audience === 'student') &&
            (!a.schoolName || a.schoolName === user.schoolName)
        );
        setAnnouncements(relevantAnn);

        if (user.className && user.schoolName) {
            const allAssign = getStoredAssignments();
            const relevantAssign = allAssign.filter(a => 
                a.schoolName === user.schoolName && 
                a.targetClass === user.className
            );
            setAssignments(relevantAssign);
        }

        refreshMessages();
    };
    
    loadData();
    window.addEventListener('nexus_data_changed', loadData);
    return () => window.removeEventListener('nexus_data_changed', loadData);
  }, [user.className, user.schoolName, user.uid]);`);

fs.writeFileSync('pages/StudentDashboard.tsx', code);
