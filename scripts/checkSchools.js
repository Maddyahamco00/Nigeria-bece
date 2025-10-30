// scripts/checkSchools.js
import sequelize from '../config/database.js';
import { School, State, LGA } from '../models/index.js';

const checkSchools = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get all schools with their state and LGA information
    const schools = await School.findAll({
      include: [
        { model: State, attributes: ['id', 'name'] },
        { model: LGA, attributes: ['id', 'name'] }
      ],
      order: [['id', 'ASC']]
    });

    console.log(`📊 Found ${schools.length} schools in database:`);
    
    schools.forEach(school => {
      console.log(`🏫 School ID: ${school.id} | Name: ${school.name} | State: ${school.State?.name} | LGA: ${school.LGA?.name}`);
    });

    // Also show states and LGAs for reference
    console.log('\n📋 Available States:');
    const states = await State.findAll({ order: [['id', 'ASC']] });
    states.forEach(state => {
      console.log(`📍 State ID: ${state.id} | Name: ${state.name}`);
    });

    console.log('\n📋 Available LGAs:');
    const lgas = await LGA.findAll({ 
      include: [{ model: State, attributes: ['name'] }],
      order: [['id', 'ASC']] 
    });
    lgas.forEach(lga => {
      console.log(`🏘️ LGA ID: ${lga.id} | Name: ${lga.name} | State: ${lga.State?.name}`);
    });

  } catch (error) {
    console.error('❌ Error checking schools:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

checkSchools();