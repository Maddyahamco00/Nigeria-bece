// utils/grade.js
function getGrade(score) {
    if(score >= 70) return 'A';
    if(score >= 60) return 'B';
    if(score >= 50) return 'C';
    if(score >= 40) return 'D';
    if(score >= 35) return 'E';
    return 'F';
}

function getGradeBadge(grade) {
    const badges = {
        'A': 'success', 'B': 'info', 'C': 'warning',
        'D': 'secondary', 'E': 'danger', 'F': 'danger'
    };
    return badges[grade] || 'secondary';
}

function getGradeRemark(grade) {
    const remarks = {
        'A': 'Excellent', 'B': 'Very Good', 'C': 'Good',
        'D': 'Pass', 'E': 'Pass', 'F': 'Fail'
    };
    return remarks[grade] || 'N/A';
}

export { getGrade, getGradeBadge, getGradeRemark };
