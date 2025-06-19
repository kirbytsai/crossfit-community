// scripts/seed-wods-fixed.js
// 使用正確結構的 WOD 種子腳本

const mongoose = require('mongoose');

// ===== 重要：請修改這裡的設定 =====
const USER_ID = '684e5aa5bc397c17b8e5b86f'; // 請替換為您的實際用戶 ID
// ==================================

// WOD Schema 定義
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

// Dummy Data 定義（使用正確的結構）
const dummyWODs = [
  // AMRAP WODs
  {
    name: "Cindy",
    classification: {
      type: "AMRAP",
      timeType: "20 minutes",
      scoringType: "AMRAP"
    },
    movements: [
      { name: "Pull-ups", reps: 5 },
      { name: "Push-ups", reps: 10 },
      { name: "Air Squats", reps: 15 }
    ],
    tags: ["bodyweight", "benchmark", "hero"],
    description: "Classic CrossFit benchmark workout",
    scope: "public",
    metadata: {
      isPublic: true,
      tags: ["bodyweight", "benchmark", "hero"],
      equipment: ["pull-up bar"],
      difficulty: 3
    }
  },
  {
    name: "Mary",
    classification: {
      type: "AMRAP",
      timeType: "20 minutes",
      scoringType: "AMRAP"
    },
    movements: [
      { name: "Handstand Push-ups", reps: 5 },
      { name: "Pistols", reps: 10 },
      { name: "Pull-ups", reps: 15 }
    ],
    tags: ["bodyweight", "benchmark", "advanced"],
    description: "Advanced bodyweight benchmark",
    scope: "public",
    metadata: {
      isPublic: true,
      tags: ["bodyweight", "benchmark", "advanced"],
      equipment: ["pull-up bar", "wall"],
      difficulty: 5
    }
  },
  {
    name: "Quick Burner",
    classification: {
      type: "AMRAP",
      timeType: "8 minutes",
      scoringType: "AMRAP"
    },
    movements: [
      { name: "Burpees", reps: 10 },
      { name: "Box Jumps", reps: 10, height: "24/20 inches" },
      { name: "Kettlebell Swings", reps: 10, weight: { male: "24kg", female: "16kg" } }
    ],
    tags: ["short", "conditioning"],
    description: "Quick metabolic conditioning",
    scope: "public",
    metadata: {
      isPublic: true,
      tags: ["short", "conditioning"],
      equipment: ["box", "kettlebell"],
      difficulty: 2
    }
  },

  // For Time WODs
  {
    name: "Fran",
    classification: {
      type: "For Time",
      scoringType: "For Time"
    },
    movements: [
      { name: "Thrusters", reps: 21, weight: { male: "95 lbs", female: "65 lbs" } },
      { name: "Pull-ups", reps: 21 },
      { name: "Thrusters", reps: 15, weight: { male: "95 lbs", female: "65 lbs" } },
      { name: "Pull-ups", reps: 15 },
      { name: "Thrusters", reps: 9, weight: { male: "95 lbs", female: "65 lbs" } },
      { name: "Pull-ups", reps: 9 }
    ],
    tags: ["benchmark", "classic", "21-15-9"],
    description: "The most famous CrossFit workout",
    scope: "public",
    metadata: {
      isPublic: true,
      tags: ["benchmark", "classic", "21-15-9"],
      equipment: ["barbell", "pull-up bar"],
      difficulty: 4
    }
  },
  {
    name: "Helen",
    classification: {
      type: "For Time",
      scoringType: "For Time"
    },
    rounds: 3,
    movements: [
      { name: "Run", distance: "400m" },
      { name: "Kettlebell Swings", reps: 21, weight: { male: "24kg", female: "16kg" } },
      { name: "Pull-ups", reps: 12 }
    ],
    tags: ["benchmark", "running", "mixed"],
    description: "3 rounds for time",
    scope: "public",
    metadata: {
      isPublic: true,
      tags: ["benchmark", "running", "mixed"],
      equipment: ["kettlebell", "pull-up bar"],
      difficulty: 3
    }
  },
  {
    name: "Grace",
    classification: {
      type: "For Time",
      scoringType: "For Time"
    },
    movements: [
      { name: "Clean and Jerk", reps: 30, weight: { male: "135 lbs", female: "95 lbs" } }
    ],
    tags: ["benchmark", "barbell", "power"],
    description: "30 clean and jerks for time",
    scope: "public",
    metadata: {
      isPublic: true,
      tags: ["benchmark", "barbell", "power"],
      equipment: ["barbell"],
      difficulty: 4
    }
  },

  // EMOM WODs
  {
    name: "Power EMOM",
    classification: {
      type: "EMOM",
      timeType: "12 minutes",
      scoringType: "Not Scored"
    },
    movements: [
      { name: "Power Cleans", reps: 3, weight: { male: "155 lbs", female: "105 lbs" } },
      { name: "Push Jerks", reps: 3, weight: { male: "155 lbs", female: "105 lbs" } }
    ],
    tags: ["strength", "olympic", "barbell"],
    description: "Alternate movements each minute",
    scope: "personal",
    metadata: {
      isPublic: false,
      tags: ["strength", "olympic", "barbell"],
      equipment: ["barbell"],
      difficulty: 4
    }
  },

  // Strength WODs
  {
    name: "Back Squat Day",
    classification: {
      type: "Strength",
      scoringType: "Not Scored"
    },
    movements: [
      { name: "Back Squat", reps: 5 },
      { name: "Back Squat", reps: 5 },
      { name: "Back Squat", reps: 3 },
      { name: "Back Squat", reps: 3 },
      { name: "Back Squat", reps: 1 },
      { name: "Back Squat", reps: 1 }
    ],
    tags: ["strength", "squats", "powerlifting"],
    description: "Work up to a heavy single",
    scope: "personal",
    metadata: {
      isPublic: false,
      tags: ["strength", "squats", "powerlifting"],
      equipment: ["barbell", "squat rack"],
      difficulty: 3
    }
  },

  // Partner WODs
  {
    name: "Partner Relay",
    classification: {
      type: "Partner",
      scoringType: "For Time"
    },
    movements: [
      { name: "Calorie Row", calories: 50 },
      { name: "Wall Balls", reps: 40, weight: { male: "20 lbs", female: "14 lbs" } },
      { name: "Box Jumps", reps: 30, height: "24/20 inches" },
      { name: "Toes-to-Bar", reps: 20 },
      { name: "Burpees", reps: 10 }
    ],
    rounds: 3,
    tags: ["partner", "teamwork", "competition"],
    description: "Partner A completes full round, then Partner B. 3 rounds each.",
    scope: "public",
    metadata: {
      isPublic: true,
      tags: ["partner", "teamwork", "competition"],
      equipment: ["rower", "wall ball", "box", "pull-up bar"],
      difficulty: 3
    }
  },

  // More WODs...
  {
    name: "DT",
    classification: {
      type: "For Time",
      scoringType: "For Time"
    },
    rounds: 5,
    movements: [
      { name: "Deadlifts", reps: 12, weight: { male: "155 lbs", female: "105 lbs" } },
      { name: "Hang Power Cleans", reps: 9, weight: { male: "155 lbs", female: "105 lbs" } },
      { name: "Push Jerks", reps: 6, weight: { male: "155 lbs", female: "105 lbs" } }
    ],
    tags: ["hero", "barbell", "benchmark"],
    description: "5 rounds for time",
    scope: "public",
    metadata: {
      isPublic: true,
      tags: ["hero", "barbell", "benchmark"],
      equipment: ["barbell"],
      difficulty: 4
    }
  }
];

// 主要執行函數
async function seedWODs() {
  try {
    // 連接到 MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // 檢查用戶 ID
    console.log(`Using User ID: ${USER_ID}`);
    console.log(`Preparing to insert ${dummyWODs.length} WODs with correct structure...`);

    // 為每個 WOD 添加完整的資料
    const wodsToInsert = dummyWODs.map(wod => {
      // 生成過去 6 個月內的隨機日期
      const daysAgo = Math.floor(Math.random() * 180);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const userId = new mongoose.Types.ObjectId(USER_ID);

      return {
        ...wod,
        createdBy: userId,
        metadata: {
          ...wod.metadata,
          createdBy: userId
        },
        createdAt
      };
    });

    // 插入 WODs
    console.log('Inserting WODs...');
    const insertedWODs = await WOD.insertMany(wodsToInsert);
    console.log(`✅ Successfully inserted ${insertedWODs.length} WODs`);

    // 顯示插入的 WOD 摘要
    console.log('\n📊 Inserted WODs summary:');
    const publicCount = insertedWODs.filter(w => w.metadata.isPublic).length;
    const personalCount = insertedWODs.filter(w => !w.metadata.isPublic).length;
    console.log(`   - Public WODs: ${publicCount}`);
    console.log(`   - Personal WODs: ${personalCount}`);

    console.log('\n📝 Sample WODs inserted:');
    insertedWODs.slice(0, 5).forEach(wod => {
      console.log(`   - ${wod.name} (${wod.classification.type}, ${wod.metadata.isPublic ? 'Public' : 'Personal'})`);
    });

    console.log('\n🎉 Done! You should now see the WODs in your application.');
    
  } catch (error) {
    console.error('❌ Error seeding WODs:', error.message);
    console.log('\n⚠️  請確認：');
    console.log('1. MongoDB 正在運行');
    console.log('2. 連接字串正確');
    console.log('3. 用戶 ID 是有效的 ObjectId');
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// 執行腳本
console.log('🚀 Starting WOD seeding script (Fixed version)...\n');
seedWODs();