// server.js

import app from './app.js';
import config from './config/index.js';
import db from './config/db.js';

const PORT = config.port || 3000;

db.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully.');
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => console.error('❌ Database connection failed:', err));
