// scripts/fix-wods.js
// 修正已插入的 WODs 結構，或重新插入正確結構的 WODs

const mongoose = require('mongoose');

// ===== 重要：請修改這裡的設定 =====
const USER_ID = '684e5aa5bc397c17b8e5b86f'; // 請替換為您的實際用戶 ID
// ==================================

// WOD Schema 定義（完整版）
const wodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scope: { type: String, enum: ['public', 'personal'], default: 'personal' },
  
  classification: {
    type: { type: String, required: true },
    timeType: { type: String },
    scoringType: { type: String, required: true }
  },
  
  movements: [{
    name: { type: String, required: true },
    reps: { type: Number },
    weight: {
      male: { type: String },
      female: { type: String }
    },
    distance: { type: String },
    calories: { type: Number },
    height: { type: String }
  }],
  
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    tags: [{ type: String }],
    equipment: [{ type: String }],
    difficulty: { type: Number, min: 1, max: 5 }
  },
  
  rounds: { type: Number },
  tags: [{ type: String }],
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const WOD = mongoose.model('WOD', wodSchema);

async function fixWODs() {
  try {
    // 連接到 MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    console.log(`Using User ID: ${USER_ID}`);
    
    // 方案 1：刪除舊的 WODs 並重新插入
    console.log('\n🗑️  Deleting old WODs created by this user...');
    const deleteResult = await WOD.deleteMany({ 
      createdBy: new mongoose.Types.ObjectId(USER_ID),
      // 只刪除沒有 metadata 的（舊結構）
      'metadata': { $exists: false }
    });
    console.log(`Deleted ${deleteResult.deletedCount} old WODs`);

    // 方案 2：更新現有的 WODs（如果您想保留它們）
    // console.log('\n🔧 Updating existing WODs...');
    // const updateResult = await WOD.updateMany(
    //   { 
    //     createdBy: new mongoose.Types.ObjectId(USER_ID),
    //     'metadata': { $exists: false }
    //   },
    //   {
    //     $set: {
    //       'metadata.createdBy': new mongoose.Types.ObjectId(USER_ID),
    //       'metadata.isPublic': true,
    //       'metadata.tags': '$tags'
    //     },
    //     $unset: { 'scope': 1 }
    //   }
    // );
    // console.log(`Updated ${updateResult.modifiedCount} WODs`);

    console.log('\n✅ Done! Now run the seed script again with the corrected structure.');
    console.log('Run: node scripts/seed-wods-fixed.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// 執行腳本
console.log('🚀 Starting WOD fix script...\n');
fixWODs();