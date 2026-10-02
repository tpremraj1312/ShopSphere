require('dotenv').config();
const mongoose = require('mongoose');

async function inspectUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find().limit(10);
  console.log('Sample users:', users.map(u => ({ id: u._id, email: u.email, role: u.role, name: u.name, sellerProfile: u.sellerProfile })));
  await mongoose.disconnect();
}

inspectUsers().catch(console.error);
