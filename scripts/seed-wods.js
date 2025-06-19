// scripts/seed-wods.js
// 使用方式: node scripts/seed-wods.js

const mongoose = require('mongoose');

// ===== 重要：請修改這裡的設定 =====

const USER_ID = '684e5aa5bc397c17b8e5b86f'; // 請替換為您的實際用戶 ID
// ==================================
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
  rounds: { type: Number },
  tags: [{ type: String }],
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const WOD = mongoose.model('WOD', wodSchema);

// Dummy Data 定義
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
    metadata: {
      isPublic: true
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
    scope: "public"
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
    scope: "public"
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
    scope: "public"
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
    scope: "public"
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
    scope: "public"
  },
  {
    name: "Murph",
    classification: {
      type: "For Time",
      scoringType: "For Time"
    },
    movements: [
      { name: "Run", distance: "1 mile" },
      { name: "Pull-ups", reps: 100 },
      { name: "Push-ups", reps: 200 },
      { name: "Air Squats", reps: 300 },
      { name: "Run", distance: "1 mile" }
    ],
    tags: ["hero", "benchmark", "long", "bodyweight"],
    description: "Partition the pull-ups, push-ups, and squats as needed. If you've got a 20lb vest, wear it.",
    scope: "public"
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
    scope: "public"
  },
  {
    name: "Cardio EMOM",
    classification: {
      type: "EMOM",
      timeType: "20 minutes",
      scoringType: "Not Scored"
    },
    movements: [
      { name: "Calorie Row", calories: 15 },
      { name: "Burpees", reps: 10 },
      { name: "Double Unders", reps: 30 },
      { name: "Wall Balls", reps: 15, weight: { male: "20 lbs", female: "14 lbs" } }
    ],
    tags: ["conditioning", "cardio"],
    description: "5 rounds, rotating through movements",
    scope: "public"
  },

  // Tabata WODs
  {
    name: "Tabata Core",
    classification: {
      type: "Tabata",
      timeType: "4 minutes",
      scoringType: "Max Reps"
    },
    movements: [
      { name: "Sit-ups" }
    ],
    tags: ["core", "short", "tabata"],
    description: "8 rounds of 20 seconds work, 10 seconds rest",
    scope: "public"
  },
  {
    name: "Tabata Mix",
    classification: {
      type: "Tabata",
      timeType: "16 minutes",
      scoringType: "Max Reps"
    },
    movements: [
      { name: "Air Squats" },
      { name: "Push-ups" },
      { name: "Sit-ups" },
      { name: "Burpees" }
    ],
    tags: ["bodyweight", "tabata", "conditioning"],
    description: "4 minutes per movement, 1 minute rest between",
    scope: "public"
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
    scope: "personal"
  },
  {
    name: "Deadlift 5x5",
    classification: {
      type: "Strength",
      scoringType: "Not Scored"
    },
    movements: [
      { name: "Deadlift", reps: 5 }
    ],
    rounds: 5,
    tags: ["strength", "deadlift", "5x5"],
    description: "5 sets of 5 reps at 80% 1RM",
    scope: "personal"
  },

  // Chipper WODs
  {
    name: "Filthy Fifty",
    classification: {
      type: "Chipper",
      scoringType: "For Time"
    },
    movements: [
      { name: "Box Jumps", reps: 50, height: "24/20 inches" },
      { name: "Jumping Pull-ups", reps: 50 },
      { name: "Kettlebell Swings", reps: 50, weight: { male: "16kg", female: "12kg" } },
      { name: "Walking Lunges", reps: 50 },
      { name: "Knees-to-Elbows", reps: 50 },
      { name: "Push Press", reps: 50, weight: { male: "45 lbs", female: "35 lbs" } },
      { name: "Back Extensions", reps: 50 },
      { name: "Wall Balls", reps: 50, weight: { male: "20 lbs", female: "14 lbs" } },
      { name: "Burpees", reps: 50 },
      { name: "Double Unders", reps: 50 }
    ],
    tags: ["benchmark", "chipper", "long"],
    description: "Complete all reps of each movement before moving to the next",
    scope: "public"
  },

  // Max Reps WODs
  {
    name: "Max Pull-ups",
    classification: {
      type: "Test",
      scoringType: "Max Reps"
    },
    movements: [
      { name: "Pull-ups" }
    ],
    tags: ["test", "bodyweight", "pulling"],
    description: "Max unbroken pull-ups",
    scope: "personal"
  },
  {
    name: "2 Min Burpee Test",
    classification: {
      type: "Test",
      scoringType: "Max Reps"
    },
    movements: [
      { name: "Burpees" }
    ],
    tags: ["test", "conditioning", "benchmark"],
    description: "Max burpees in 2 minutes",
    scope: "public"
  },

  // Complex WODs
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
    scope: "public"
  },
  {
    name: "The Chief",
    classification: {
      type: "AMRAP",
      timeType: "5 rounds of 3 minutes",
      scoringType: "AMRAP"
    },
    movements: [
      { name: "Power Cleans", reps: 3, weight: { male: "135 lbs", female: "95 lbs" } },
      { name: "Push-ups", reps: 6 },
      { name: "Air Squats", reps: 9 }
    ],
    tags: ["benchmark", "intervals"],
    description: "5 rounds of 3 minute AMRAPs with 1 minute rest between",
    scope: "public"
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
    scope: "public"
  },

  // Custom/Personal WODs
  {
    name: "Morning Routine",
    classification: {
      type: "AMRAP",
      timeType: "15 minutes",
      scoringType: "AMRAP"
    },
    movements: [
      { name: "Dumbbell Snatches", reps: 10, weight: { male: "50 lbs", female: "35 lbs" } },
      { name: "Box Step-ups", reps: 20, height: "20 inches" },
      { name: "Ring Rows", reps: 15 }
    ],
    tags: ["morning", "moderate", "dumbbell"],
    scope: "personal"
  },
  {
    name: "Leg Destroyer",
    classification: {
      type: "For Time",
      scoringType: "For Time"
    },
    movements: [
      { name: "Front Squats", reps: 21, weight: { male: "115 lbs", female: "75 lbs" } },
      { name: "Box Jumps", reps: 21, height: "30/24 inches" },
      { name: "Front Squats", reps: 15, weight: { male: "115 lbs", female: "75 lbs" } },
      { name: "Box Jumps", reps: 15, height: "30/24 inches" },
      { name: "Front Squats", reps: 9, weight: { male: "115 lbs", female: "75 lbs" } },
      { name: "Box Jumps", reps: 9, height: "30/24 inches" }
    ],
    tags: ["legs", "squats", "jumping"],
    scope: "personal"
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
    console.log(`Preparing to insert ${dummyWODs.length} WODs...`);

    // 為每個 WOD 添加 createdBy 和隨機的 createdAt 日期
    const wodsToInsert = dummyWODs.map(wod => {
      // 生成過去 6 個月內的隨機日期
      const daysAgo = Math.floor(Math.random() * 180);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      return {
        ...wod,
        createdBy: new mongoose.Types.ObjectId(USER_ID),
        createdAt
      };
    });

    // 插入 WODs
    console.log('Inserting WODs...');
    const insertedWODs = await WOD.insertMany(wodsToInsert);
    console.log(`✅ Successfully inserted ${insertedWODs.length} WODs`);

    // 顯示插入的 WOD 摘要
    console.log('\n📊 Inserted WODs summary:');
    const summary = {};
    insertedWODs.forEach(wod => {
      const type = wod.classification.type;
      summary[type] = (summary[type] || 0) + 1;
    });
    
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} WODs`);
    });

    // 顯示一些範例
    console.log('\n📝 Sample WODs inserted:');
    insertedWODs.slice(0, 5).forEach(wod => {
      console.log(`   - ${wod.name} (${wod.classification.type}, ${wod.scope})`);
    });

    console.log('\n🎉 Done! You can now test the WOD filter selector with plenty of data.');
    
  } catch (error) {
    console.error('❌ Error seeding WODs:', error.message);
    console.log('\n⚠️  請確認：');
    console.log('1. MongoDB 正在運行');
    console.log('2. 連接字串正確（目前使用: ' + MONGODB_URI + '）');
    console.log('3. 用戶 ID 是有效的 ObjectId（目前使用: ' + USER_ID + '）');
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// 執行腳本
console.log('🚀 Starting WOD seeding script...\n');
seedWODs();