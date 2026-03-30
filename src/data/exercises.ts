export type BodyPart =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'full-body'
  | 'cardio'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance-band'
  | 'pull-up-bar'

export interface Exercise {
  id: string
  name: string
  bodyParts: BodyPart[]
  equipment: Equipment[]
  bodyweightOnly?: boolean
  popularity?: number  // 1–100, higher = more popular; omitted = 50
  lastUsed?: string    // ISO date string
}

export const exercises: Exercise[] = [
  // Chest
  { id: 'ex-001', name: 'Barbell Bench Press',          bodyParts: ['chest', 'triceps', 'shoulders'],  equipment: ['barbell'],     popularity: 98, lastUsed: '2026-03-28' },
  { id: 'ex-002', name: 'Incline Dumbbell Press',       bodyParts: ['chest', 'shoulders'],             equipment: ['dumbbell'],    popularity: 82, lastUsed: '2026-03-25' },
  { id: 'ex-003', name: 'Decline Barbell Press',        bodyParts: ['chest', 'triceps'],               equipment: ['barbell'],     popularity: 60, lastUsed: '2026-02-10' },
  { id: 'ex-004', name: 'Dumbbell Flye',                bodyParts: ['chest'],                          equipment: ['dumbbell'],    popularity: 72, lastUsed: '2026-03-14' },
  { id: 'ex-005', name: 'Cable Crossover',              bodyParts: ['chest'],                          equipment: ['cable'],       popularity: 75, lastUsed: '2026-03-20' },
  { id: 'ex-006', name: 'Push-Up',                      bodyParts: ['chest', 'triceps', 'core'],       equipment: ['bodyweight'],  popularity: 95, lastUsed: '2026-03-29', bodyweightOnly: true },
  { id: 'ex-007', name: 'Incline Push-Up',              bodyParts: ['chest', 'triceps'],               equipment: ['bodyweight'],  popularity: 55, lastUsed: '2025-11-03', bodyweightOnly: true },
  { id: 'ex-008', name: 'Pec Deck Machine',             bodyParts: ['chest'],                          equipment: ['machine'],     popularity: 58, lastUsed: '2026-01-18' },

  // Back
  { id: 'ex-009', name: 'Barbell Deadlift',             bodyParts: ['back', 'glutes', 'hamstrings'],   equipment: ['barbell'],     popularity: 97, lastUsed: '2026-03-27' },
  { id: 'ex-010', name: 'Pull-Up',                      bodyParts: ['back', 'biceps'],                 equipment: ['pull-up-bar'], popularity: 93, lastUsed: '2026-03-26' },
  { id: 'ex-011', name: 'Chin-Up',                      bodyParts: ['back', 'biceps'],                 equipment: ['pull-up-bar'], popularity: 85, lastUsed: '2026-03-19' },
  { id: 'ex-012', name: 'Barbell Row',                  bodyParts: ['back', 'biceps'],                 equipment: ['barbell'],     popularity: 88, lastUsed: '2026-03-22' },
  { id: 'ex-013', name: 'Single-Arm Dumbbell Row',      bodyParts: ['back', 'biceps'],                 equipment: ['dumbbell'],    popularity: 84, lastUsed: '2026-03-15' },
  { id: 'ex-014', name: 'Seated Cable Row',             bodyParts: ['back', 'biceps'],                 equipment: ['cable'],       popularity: 80, lastUsed: '2026-03-08' },
  { id: 'ex-015', name: 'Lat Pulldown',                 bodyParts: ['back', 'biceps'],                 equipment: ['cable'],       popularity: 87, lastUsed: '2026-03-24' },
  { id: 'ex-016', name: 'T-Bar Row',                    bodyParts: ['back'],                           equipment: ['barbell'],     popularity: 65, lastUsed: '2026-01-30' },
  { id: 'ex-017', name: 'Face Pull',                    bodyParts: ['back', 'shoulders'],              equipment: ['cable'],       popularity: 78, lastUsed: '2026-03-10' },
  { id: 'ex-018', name: 'Straight-Arm Pulldown',        bodyParts: ['back'],                           equipment: ['cable'],       popularity: 55, lastUsed: '2025-12-14' },
  { id: 'ex-019', name: 'Hyperextension',               bodyParts: ['back', 'glutes'],                 equipment: ['bodyweight'],  popularity: 62, lastUsed: '2026-02-02' },

  // Shoulders
  { id: 'ex-020', name: 'Overhead Press',               bodyParts: ['shoulders', 'triceps'],           equipment: ['barbell'],     popularity: 92 },
  { id: 'ex-021', name: 'Dumbbell Shoulder Press',      bodyParts: ['shoulders', 'triceps'],           equipment: ['dumbbell'],    popularity: 83 },
  { id: 'ex-022', name: 'Lateral Raise',                bodyParts: ['shoulders'],                      equipment: ['dumbbell'],    popularity: 89 },
  { id: 'ex-023', name: 'Front Raise',                  bodyParts: ['shoulders'],                      equipment: ['dumbbell'],    popularity: 68 },
  { id: 'ex-024', name: 'Rear Delt Flye',               bodyParts: ['shoulders', 'back'],              equipment: ['dumbbell'],    popularity: 74 },
  { id: 'ex-025', name: 'Arnold Press',                 bodyParts: ['shoulders'],                      equipment: ['dumbbell'],    popularity: 76 },
  { id: 'ex-026', name: 'Cable Lateral Raise',          bodyParts: ['shoulders'],                      equipment: ['cable'],       popularity: 70 },
  { id: 'ex-027', name: 'Upright Row',                  bodyParts: ['shoulders', 'biceps'],            equipment: ['barbell'],     popularity: 58 },

  // Biceps
  { id: 'ex-028', name: 'Barbell Curl',                 bodyParts: ['biceps'],                         equipment: ['barbell'],     popularity: 91 },
  { id: 'ex-029', name: 'Dumbbell Curl',                bodyParts: ['biceps'],                         equipment: ['dumbbell'],    popularity: 88 },
  { id: 'ex-030', name: 'Hammer Curl',                  bodyParts: ['biceps', 'forearms'],             equipment: ['dumbbell'],    popularity: 85 },
  { id: 'ex-031', name: 'Preacher Curl',                bodyParts: ['biceps'],                         equipment: ['barbell'],     popularity: 72 },
  { id: 'ex-032', name: 'Concentration Curl',           bodyParts: ['biceps'],                         equipment: ['dumbbell'],    popularity: 69 },
  { id: 'ex-033', name: 'Cable Curl',                   bodyParts: ['biceps'],                         equipment: ['cable'],       popularity: 74 },
  { id: 'ex-034', name: 'Incline Dumbbell Curl',        bodyParts: ['biceps'],                         equipment: ['dumbbell'],    popularity: 66 },

  // Triceps
  { id: 'ex-035', name: 'Tricep Pushdown',              bodyParts: ['triceps'],                        equipment: ['cable'],       popularity: 87 },
  { id: 'ex-036', name: 'Skull Crusher',                bodyParts: ['triceps'],                        equipment: ['barbell'],     popularity: 80 },
  { id: 'ex-037', name: 'Overhead Tricep Extension',    bodyParts: ['triceps'],                        equipment: ['dumbbell'],    popularity: 75 },
  { id: 'ex-038', name: 'Close-Grip Bench Press',       bodyParts: ['triceps', 'chest'],               equipment: ['barbell'],     popularity: 76 },
  { id: 'ex-039', name: 'Diamond Push-Up',              bodyParts: ['triceps', 'chest'],               equipment: ['bodyweight'],  popularity: 62, bodyweightOnly: true },
  { id: 'ex-040', name: 'Dip',                          bodyParts: ['triceps', 'chest', 'shoulders'],  equipment: ['bodyweight'],  popularity: 84 },
  { id: 'ex-041', name: 'Rope Pushdown',                bodyParts: ['triceps'],                        equipment: ['cable'],       popularity: 78 },

  // Forearms
  { id: 'ex-042', name: 'Wrist Curl',                   bodyParts: ['forearms'],                       equipment: ['barbell'] },
  { id: 'ex-043', name: 'Reverse Wrist Curl',           bodyParts: ['forearms'],                       equipment: ['barbell'] },
  { id: 'ex-044', name: 'Farmer\'s Carry',              bodyParts: ['forearms', 'core', 'full-body'],  equipment: ['dumbbell'] },
  { id: 'ex-045', name: 'Dead Hang',                    bodyParts: ['forearms', 'back'],               equipment: ['pull-up-bar'] },

  // Core
  { id: 'ex-046', name: 'Plank',                        bodyParts: ['core'],                           equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-047', name: 'Side Plank',                   bodyParts: ['core'],                           equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-048', name: 'Crunch',                       bodyParts: ['core'],                           equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-049', name: 'Bicycle Crunch',               bodyParts: ['core'],                           equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-050', name: 'Leg Raise',                    bodyParts: ['core'],                           equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-051', name: 'Hanging Leg Raise',            bodyParts: ['core'],                           equipment: ['pull-up-bar'] },
  { id: 'ex-052', name: 'Ab Wheel Rollout',             bodyParts: ['core'],                           equipment: ['bodyweight'] },
  { id: 'ex-053', name: 'Cable Crunch',                 bodyParts: ['core'],                           equipment: ['cable'] },
  { id: 'ex-054', name: 'Russian Twist',                bodyParts: ['core'],                           equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-055', name: 'Dead Bug',                     bodyParts: ['core'],                           equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-056', name: 'Pallof Press',                 bodyParts: ['core'],                           equipment: ['cable'] },
  { id: 'ex-057', name: 'Mountain Climber',             bodyParts: ['core', 'cardio'],                 equipment: ['bodyweight'], bodyweightOnly: true },

  // Glutes
  { id: 'ex-058', name: 'Hip Thrust',                   bodyParts: ['glutes', 'hamstrings'],           equipment: ['barbell'] },
  { id: 'ex-059', name: 'Glute Bridge',                 bodyParts: ['glutes'],                         equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-060', name: 'Cable Kickback',               bodyParts: ['glutes'],                         equipment: ['cable'] },
  { id: 'ex-061', name: 'Donkey Kick',                  bodyParts: ['glutes'],                         equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-062', name: 'Sumo Deadlift',                bodyParts: ['glutes', 'hamstrings', 'back'],   equipment: ['barbell'] },
  { id: 'ex-063', name: 'Romanian Deadlift',            bodyParts: ['glutes', 'hamstrings'],           equipment: ['barbell'] },

  // Quads
  { id: 'ex-064', name: 'Back Squat',                   bodyParts: ['quads', 'glutes'],                equipment: ['barbell'],     popularity: 97 },
  { id: 'ex-065', name: 'Front Squat',                  bodyParts: ['quads', 'core'],                  equipment: ['barbell'],     popularity: 79 },
  { id: 'ex-066', name: 'Goblet Squat',                 bodyParts: ['quads', 'glutes'],                equipment: ['kettlebell'],  popularity: 81 },
  { id: 'ex-067', name: 'Leg Press',                    bodyParts: ['quads', 'glutes'],                equipment: ['machine'],     popularity: 88 },
  { id: 'ex-068', name: 'Leg Extension',                bodyParts: ['quads'],                          equipment: ['machine'],     popularity: 82 },
  { id: 'ex-069', name: 'Walking Lunge',                bodyParts: ['quads', 'glutes'],                equipment: ['bodyweight'],  popularity: 83, bodyweightOnly: true },
  { id: 'ex-070', name: 'Bulgarian Split Squat',        bodyParts: ['quads', 'glutes'],                equipment: ['dumbbell'],    popularity: 86 },
  { id: 'ex-071', name: 'Step-Up',                      bodyParts: ['quads', 'glutes'],                equipment: ['dumbbell'] },
  { id: 'ex-072', name: 'Hack Squat',                   bodyParts: ['quads'],                          equipment: ['machine'] },

  // Hamstrings
  { id: 'ex-073', name: 'Leg Curl',                     bodyParts: ['hamstrings'],                     equipment: ['machine'] },
  { id: 'ex-074', name: 'Nordic Curl',                  bodyParts: ['hamstrings'],                     equipment: ['bodyweight'] },
  { id: 'ex-075', name: 'Good Morning',                 bodyParts: ['hamstrings', 'back'],             equipment: ['barbell'] },
  { id: 'ex-076', name: 'Dumbbell Romanian Deadlift',   bodyParts: ['hamstrings', 'glutes'],           equipment: ['dumbbell'] },
  { id: 'ex-077', name: 'Swiss Ball Leg Curl',          bodyParts: ['hamstrings', 'glutes'],           equipment: ['bodyweight'] },

  // Calves
  { id: 'ex-078', name: 'Standing Calf Raise',          bodyParts: ['calves'],                         equipment: ['machine'] },
  { id: 'ex-079', name: 'Seated Calf Raise',            bodyParts: ['calves'],                         equipment: ['machine'] },
  { id: 'ex-080', name: 'Single-Leg Calf Raise',        bodyParts: ['calves'],                         equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-081', name: 'Donkey Calf Raise',            bodyParts: ['calves'],                         equipment: ['machine'] },

  // Full Body / Compound
  { id: 'ex-082', name: 'Power Clean',                  bodyParts: ['full-body'],                      equipment: ['barbell'] },
  { id: 'ex-083', name: 'Hang Clean',                   bodyParts: ['full-body'],                      equipment: ['barbell'] },
  { id: 'ex-084', name: 'Snatch',                       bodyParts: ['full-body'],                      equipment: ['barbell'] },
  { id: 'ex-085', name: 'Thruster',                     bodyParts: ['full-body'],                      equipment: ['barbell'] },
  { id: 'ex-086', name: 'Kettlebell Swing',             bodyParts: ['full-body', 'glutes'],            equipment: ['kettlebell'] },
  { id: 'ex-087', name: 'Turkish Get-Up',               bodyParts: ['full-body', 'core'],              equipment: ['kettlebell'] },
  { id: 'ex-088', name: 'Burpee',                       bodyParts: ['full-body', 'cardio'],            equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-089', name: 'Clean and Press',              bodyParts: ['full-body', 'shoulders'],         equipment: ['barbell'] },
  { id: 'ex-090', name: 'Sled Push',                    bodyParts: ['full-body', 'quads'],             equipment: ['machine'] },
  { id: 'ex-091', name: 'Bear Crawl',                   bodyParts: ['full-body', 'core'],              equipment: ['bodyweight'], bodyweightOnly: true },

  // Cardio
  { id: 'ex-092', name: 'Treadmill Run',                bodyParts: ['cardio'],                         equipment: ['machine'] },
  { id: 'ex-093', name: 'Stationary Bike',              bodyParts: ['cardio', 'quads'],                equipment: ['machine'] },
  { id: 'ex-094', name: 'Rowing Machine',               bodyParts: ['cardio', 'back'],                 equipment: ['machine'] },
  { id: 'ex-095', name: 'Jump Rope',                    bodyParts: ['cardio', 'calves'],               equipment: ['bodyweight'] },
  { id: 'ex-096', name: 'Box Jump',                     bodyParts: ['cardio', 'quads', 'glutes'],      equipment: ['bodyweight'] },
  { id: 'ex-097', name: 'Jumping Jack',                 bodyParts: ['cardio', 'full-body'],            equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-098', name: 'Stair Climber',                bodyParts: ['cardio', 'quads', 'glutes'],      equipment: ['machine'] },
  { id: 'ex-099', name: 'Sprint Interval',              bodyParts: ['cardio'],                         equipment: ['bodyweight'], bodyweightOnly: true },
  { id: 'ex-100', name: 'Battle Ropes',                 bodyParts: ['cardio', 'shoulders', 'core'],    equipment: ['machine'] },
]
