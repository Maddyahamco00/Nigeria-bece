// controllers/gazetteController.js
import { Student, School, State, LGA, Subject } from '../models/index.js';
import { Parser } from 'json2csv';
import db from '../config/database.js';

export const generateGazette = async (req, res) => {
  try {
    const { format = 'csv', stateId, lgaId, schoolId } = req.query;
    
    let whereClause = { paymentStatus: 'paid' };
    let includeClause = [
      { model: School, include: [State, LGA] },
      { model: State },
      { model: LGA }
    ];

    // Apply filters
    if (stateId) whereClause.stateId = stateId;
    if (lgaId) whereClause.lgaId = lgaId;
    if (schoolId) whereClause.schoolId = schoolId;

    const students = await Student.findAll({
      where: whereClause,
      include: includeClause,
      order: [['regNumber', 'ASC']]
    });

    if (format === 'json') {
      return res.json({
        success: true,
        data: students,
        total: students.length,
        generatedAt: new Date().toISOString()
      });
    }

    // Generate CSV
    const csvData = students.map(student => ({
      regNumber: student.regNumber,
      name: student.name,
      email: student.email || '',
      gender: student.gender || '',
      dateOfBirth: student.dateOfBirth || '',
      guardianPhone: student.guardianPhone || '',
      school: student.School?.name || '',
      lga: student.LGA?.name || '',
      state: student.State?.name || '',
      paymentStatus: student.paymentStatus,
      registrationDate: student.createdAt
    }));

    const csvFields = [
      'regNumber', 'name', 'email', 'gender', 'dateOfBirth', 
      'guardianPhone', 'school', 'lga', 'state', 'paymentStatus', 'registrationDate'
    ];

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(csvData);

    const filename = `bece_gazette_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);

  } catch (error) {
    console.error('Gazette generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate gazette' });
  }
};

export const getGazetteStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalRegistered,
        COUNT(CASE WHEN paymentStatus = 'paid' THEN 1 END) as totalPaid,
        COUNT(CASE WHEN paymentStatus = 'pending' THEN 1 END) as totalPending,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as totalMale,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as totalFemale
      FROM students
    `);

    const [stateStats] = await db.query(`
      SELECT s.name as state, COUNT(st.id) as count
      FROM students st
      JOIN states s ON st.stateId = s.id
      WHERE st.paymentStatus = 'paid'
      GROUP BY s.name
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      stats: stats[0],
      stateBreakdown: stateStats
    });

  } catch (error) {
    console.error('Gazette stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get gazette stats' });
  }
};