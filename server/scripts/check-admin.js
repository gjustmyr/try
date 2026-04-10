const User = require('../models/user.model');
const { sequelize } = require('../config/database');

(async () => {
  await sequelize.authenticate();
  const u = await User.findOne({ where: { email: 'admin1@multishop.com' } });
  if (!u) { console.log('NOT FOUND'); process.exit(0); }
  console.log('userType:', u.userType);
  console.log('emailVerified:', u.emailVerified);
  console.log('isActive:', u.isActive);
  console.log('password hash:', u.password.substring(0, 20) + '...');
  const ok = await u.comparePassword('admin123');
  console.log('password match:', ok);
  process.exit(0);
})();
