// utils/generateStudentCode.js
import { Student, State, LGA, School } from '../models/index.js';

const generateStudentCode = async (stateId, lgaId, schoolId) => {
  try {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Get the next sequence number for this school
    const lastStudent = await Student.findOne({
      where: { schoolId },
      order: [['id', 'DESC']]
    });
    
    const sequence = lastStudent ? (lastStudent.id + 1) : 1;
    
    // Format: BECE + Year + StateCode + LGACode + SchoolCode + Sequence
    const studentCode = `BECE${currentYear}${stateId.toString().padStart(2, '0')}${lgaId.toString().padStart(2, '0')}${schoolId.toString().padStart(3, '0')}${sequence.toString().padStart(4, '0')}`;
    
    return studentCode;
  } catch (error) {
    console.error('Error generating student code:', error);
    // Fallback to timestamp-based code
    const timestamp = Date.now().toString().slice(-6);
    return `BECE${new Date().getFullYear().toString().slice(-2)}${timestamp}`;
  }
};

export default generateStudentCode;