const fs = require('fs');
let code = fs.readFileSync('pages/PrincipalDashboard.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\n\s*setUsers\(getStoredUsers\(\)\);[\s\S]*?\}, \[currentPage\]\);/g;

code = code.replace(regex, `useEffect(() => {
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
  }, [currentPage]);`);

fs.writeFileSync('pages/PrincipalDashboard.tsx', code);
