// Test script to check if Kaduna school data exists
import { sequelize } from '../config/index.js';
import { State, LGA, School } from '../models/index.js';

async function testSchoolData() {
  try {
    console.log('🔍 Testing school data...');
    
    // Check states
    const states = await State.findAll();
    console.log(`📍 Total states: ${states.length}`);
    
    const kaduna = await State.findOne({ where: { name: 'Kaduna' } });
    if (kaduna) {
      console.log(`✅ Kaduna state found: ID ${kaduna.id}`);
      
      // Check LGAs in Kaduna
      const lgas = await LGA.findAll({ where: { stateId: kaduna.id } });
      console.log(`🏢 LGAs in Kaduna: ${lgas.length}`);
      lgas.forEach(lga => console.log(`  - ${lga.name} (ID: ${lga.id})`));
      
      const kadunaSouth = lgas.find(lga => lga.name === 'Kaduna South');
      if (kadunaSouth) {
        console.log(`✅ Kaduna South LGA found: ID ${kadunaSouth.id}`);
        
        // Check schools in Kaduna South
        const schools = await School.findAll({ where: { lgaId: kadunaSouth.id } });
        console.log(`🏫 Schools in Kaduna South: ${schools.length}`);
        schools.forEach(school => console.log(`  - ${school.name} (ID: ${school.id})`));
      } else {
        console.log('❌ Kaduna South LGA not found');
      }
    } else {
      console.log('❌ Kaduna state not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing school data:', error);
  }
}

testSchoolData();