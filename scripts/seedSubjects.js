// scripts/seedSubjects.js
import { Subject } from '../models/index.js';

const defaultSubjects = [
  'Mathematics',
  'English Language',
  'Basic Science',
  'Basic Technology',
  'Social Studies',
  'Civic Education',
  'Christian Religious Studies',
  'Islamic Religious Studies',
  'French',
  'Hausa',
  'Igbo',
  'Yoruba',
  'Physical and Health Education',
  'Cultural and Creative Arts',
  'Business Studies',
  'Home Economics',
  'Agricultural Science',
  'Computer Studies',
  'Security Education'
];

async function seedSubjects() {
  try {
    console.log('🌱 Starting subjects seeding...');
    
    for (const subjectName of defaultSubjects) {
      const [subject, created] = await Subject.findOrCreate({
        where: { name: subjectName },
        defaults: { name: subjectName }
      });
      
      if (created) {
        console.log(`✅ Created subject: ${subjectName}`);
      } else {
        console.log(`⏭️  Subject already exists: ${subjectName}`);
      }
    }
    
    console.log('🎉 Subjects seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
    process.exit(1);
  }
}

seedSubjects();