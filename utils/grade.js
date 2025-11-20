// utils/grade.js
function getGrade(score) {
    if(score >= 70) return 'A';
    if(score >= 60) return 'B';
    if(score >= 50) return 'C';
    if(score >= 40) return 'D';
    if(score >= 35) return 'E';
    return 'F';
}

export default getGrade;
