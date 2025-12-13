// Add school in Kaduna, Kaduna South for testing
import { sequelize } from '../config/index.js';
import { State, LGA, School } from '../models/index.js';

async function addKadunaSchool() {
  try {
    // Find or create Kaduna state
    const [kadunaState] = await State.findOrCreate({
      where: { name: 'Kaduna' },
      defaults: { name: 'Kaduna', code: 'KD' }
    });

    // Find or create Kaduna South LGA
    const [kadunaSouthLGA] = await LGA.findOrCreate({
      where: { name: 'Kaduna South', stateId: kadunaState.id },
      defaults: { name: 'Kaduna South', stateId: kadunaState.id }
    });

    // Create test school
    const [school] = await School.findOrCreate({
      where: { name: 'Government Secondary School Kaduna South' },
      defaults: {
        name: 'Government Secondary School Kaduna South',
        address: 'Kaduna South, Kaduna State',
        stateId: kadunaState.id,
        lgaId: kadunaSouthLGA.id,
        stateCode: 'KD',
        schoolSerial: 1,
        userId: 1
      }
    });

    console.log('✅ Kaduna school added successfully:');
    console.log(`- State: ${kadunaState.name}`);
    console.log(`- LGA: ${kadunaSouthLGA.name}`);
    console.log(`- School: ${school.name}`);
    
  } catch (error) {
    console.error('❌ Error adding Kaduna school:', error);
  }
}

export default addKadunaSchool;