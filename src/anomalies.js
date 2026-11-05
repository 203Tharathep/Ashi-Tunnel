// Complete Poster & Anomaly Definitions for ASHI TUNNEL (ทางออกที่ 10)

export const POSTER_SLOTS = {
  L1: {
    id: "L1",
    number: "01",
    title: "เจ้าชายนิทรา",
    subtitle: "SLEEPING ASHI EXPRESS",
    baseUrl: "/ashi/base/L1_sleep.jpg",
    aspect: 4 / 3,
  },
  L2: {
    id: "L2",
    number: "02",
    title: "เหนียงแห่งสันติภาพ",
    subtitle: "DOUBLE CHIN COMFORT",
    baseUrl: "/ashi/base/L2_chin.jpg",
    aspect: 4 / 3,
  },
  L3: {
    id: "L3",
    number: "03",
    title: "ราชาฟาสต์ฟู้ด",
    subtitle: "McASHI JUMBO SET",
    baseUrl: "/ashi/base/L3_sofa.jpg",
    aspect: 4 / 3,
  },
  L4: {
    id: "L4",
    number: "04",
    title: "พนักงานส่งพิซซ่าปริศนา",
    subtitle: "HOT PIZZA 24 HRS",
    baseUrl: "/ashi/base/L4_pizza.jpg",
    aspect: 4 / 3,
  },
  L5: {
    id: "L5",
    number: "05",
    title: "เหินเวหาท้าเมฆา",
    subtitle: "ASHI AIRLINES",
    baseUrl: "/ashi/base/L5_skydive.jpg",
    aspect: 4 / 3,
  },
  R1: {
    id: "R1",
    number: "06",
    title: "เด็กดีศรีห้องเรียน",
    subtitle: "STUDENT OF THE YEAR",
    baseUrl: "/ashi/base/R1_class.jpg",
    aspect: 3 / 4,
  },
  R2: {
    id: "R2",
    number: "07",
    title: "โกลเด้นอชิแสนรู้",
    subtitle: "GOOD BOY PET CARE",
    baseUrl: "/ashi/base/R2_dog.jpg",
    aspect: 3 / 4,
  },
  R3: {
    id: "R3",
    number: "08",
    title: "สไปเดอร์อชิ บาร์โฮสต์",
    subtitle: "MIDNIGHT CLUB SHOW",
    baseUrl: "/ashi/base/R3_spider.jpg",
    aspect: 3 / 4,
  },
  R4: {
    id: "R4",
    number: "09",
    title: "รักใสๆ ในโรงอาหาร",
    subtitle: "CAMPUS ROMANCE",
    baseUrl: "/ashi/base/R4_cafe.jpg",
    aspect: 3 / 4,
  },
  R5: {
    id: "R5",
    number: "10",
    title: "สายตาพิฆาต",
    subtitle: "OPTICAL CLINIC",
    baseUrl: "/ashi/base/R5_sideeye.jpg",
    aspect: 3 / 4,
  },
  S1: {
    id: "S1",
    number: "AD-A",
    title: "ป้ายแขวน VALORANT GEKKO",
    subtitle: "ESPORTS ARENA",
    baseUrl: "/ashi/base/S1_gekko.jpg",
    aspect: 2 / 1,
  },
  S2: {
    id: "S2",
    number: "AD-B",
    title: "โฟร์อาร์มส์ จอมพลัง 4 ตา",
    subtitle: "OMNITRIX GYM",
    baseUrl: "/ashi/base/S2_fourarms.jpg",
    aspect: 840 / 1260,
  },
  S3: {
    id: "S3",
    number: "AD-C",
    title: "หนอนหรรษา LARVA™",
    subtitle: "CARTOON CHANNEL",
    baseUrl: "/ashi/base/S3_larva.jpg",
    aspect: 840 / 1260,
  },
  S4: {
    id: "S4",
    number: "DOOR",
    title: "ป้ายเตือนประตูห้องเครื่อง",
    subtitle: "STAFF ONLY",
    baseUrl: "/ashi/base/S4_bald_sticker.jpg",
    aspect: 400 / 580,
  },
};

export const DIFFICULTY_TIERS = {
  0: { tier: 0, stars: "☆☆☆☆☆", label: "ด่านต้นแบบ (ปกติ 100%)", color: "#4ade80" },
  1: { tier: 1, stars: "★☆☆☆☆", label: "ง่ายมาก (Warm-up)", color: "#60a5fa" },
  2: { tier: 1, stars: "★★☆☆☆", label: "ง่าย (Easy)", color: "#38bdf8" },
  3: { tier: 2, stars: "★★☆☆☆", label: "ปานกลาง (Normal)", color: "#facc15" },
  4: { tier: 2, stars: "★★★☆☆", label: "ปานกลาง+ (Medium)", color: "#fbbf24" },
  5: { tier: 2, stars: "★★★☆☆", label: "เริ่มตึงมือ (Tricky)", color: "#fb923c" },
  6: { tier: 3, stars: "★★★★☆", label: "ยาก (Hard)", color: "#f97316" },
  7: { tier: 3, stars: "★★★★☆", label: "ยากมาก (Very Hard)", color: "#ef4444" },
  8: { tier: 3, stars: "★★★★☆", label: "ตาเหยี่ยว (Eagle Eye)", color: "#dc2626" },
  9: { tier: 4, stars: "★★★★★", label: "ระดับนรก (Extreme)", color: "#e11d48" },
  10: { tier: 4, stars: "★★★★★", label: "ด่านตัดสินชะตา (Nightmare)", color: "#be123c" },
};

// 37 Unique Anomalies organized by Tier (1 = Easy, 2 = Medium, 3 = Hard, 4 = Extreme)
export const ANOMALIES = [
  // ================= TIER 1: EASY (Stages 1 - 2) =================
  {
    id: "easy_bird_pink",
    tier: 1,
    type: "poster",
    slot: "L1",
    variantUrl: "/ashi/variants/L1_var_bird_pink.jpg",
    title: "นกอ้วนสีชมพู Angry Sleeper Bird",
    desc: "โปสเตอร์ 01: อชิตอนหลับกลายร่างเป็นนกฟูสีชมพูสุดเกรี้ยวกราด!",
    focus: [0.5, 0.5],
  },
  {
    id: "easy_bird_yellow",
    tier: 1,
    type: "poster",
    slot: "L1",
    variantUrl: "/ashi/variants/L1_var_bird_yellow.jpg",
    title: "นกเหลืองปากแหลม Chuck",
    desc: "โปสเตอร์ 01: อชิตอนหลับกลายร่างเป็นนกเหลืองปากแหลม!",
    focus: [0.52, 0.5],
  },
  {
    id: "easy_shrek",
    tier: 1,
    type: "poster",
    slot: "L1",
    variantUrl: "/ashi/variants/L1_var_shrek.jpg",
    title: "ยักษ์เขียว Shrek อชิ",
    desc: "โปสเตอร์ 01: อชิกลายพันธุ์เป็น Shrek ตัวเขียวหูตั้งลืมตาแป๋ว!",
    focus: [0.5, 0.42],
  },
  {
    id: "easy_red_bikini",
    tier: 1,
    type: "poster",
    slot: "L4",
    variantUrl: "/ashi/variants/L4_var_red_bikini.jpg",
    title: "บิกินี่สีแดงสุดแซ่บ",
    desc: "โปสเตอร์ 04: พนักงานส่งพิซซ่าทิ้งกล่อง แล้วเปลี่ยนมาใส่ชุดบิกินี่สีแดง!",
    focus: [0.5, 0.62],
  },
  {
    id: "easy_green_dress",
    tier: 1,
    type: "poster",
    slot: "L4",
    variantUrl: "/ashi/variants/L4_var_green_dress.jpg",
    title: "เดรสสายเดี่ยวสีเขียวเหนี่ยวทรัพย์",
    desc: "โปสเตอร์ 04: พนักงานส่งพิซซ่าสวมชุดเดรสสีเขียวพร้อมสร้อยคาดเอวทอง!",
    focus: [0.5, 0.6],
  },
  {
    id: "easy_torn_shirt",
    tier: 1,
    type: "poster",
    slot: "R1",
    variantUrl: "/ashi/variants/R1_var_torn_shirt.jpg",
    title: "เสื้อนักเรียนขาดวิ่น",
    desc: "โปสเตอร์ 06: เสื้อเชิ้ตขาวของอชิขาดกระจุยเหมือนเพิ่งรอดจากระเบิด!",
    focus: [0.5, 0.72],
  },
  {
    id: "easy_cerberus_dog",
    tier: 1,
    type: "poster",
    slot: "R2",
    variantUrl: "/ashi/variants/R2_var_cerberus.jpg",
    title: "โกลเด้นอชิร่างปีศาจตาแดง",
    desc: "โปสเตอร์ 07: น้องหมาโกลเด้นอชิตาเรืองแสงสีแดงเลือด แยกเขี้ยวสยอง!",
    focus: [0.51, 0.41],
  },
  {
    id: "easy_red_lights",
    tier: 1,
    type: "env_red_lights",
    title: "อุโมงค์ไฟสีเลือด",
    desc: "บรรยากาศอุโมงค์: หลอดไฟนีออนบนเพดานเปลี่ยนเป็นสีแดงกะพริบหลอนทั้งทางเดิน!",
  },

  // ================= TIER 2: MEDIUM (Stages 3 - 5) =================
  {
    id: "med_sleep_eyes_open",
    tier: 2,
    type: "poster",
    slot: "L1",
    variantUrl: "/ashi/variants/L1_var_eyes_open.jpg",
    title: "คนหลับลืมตาโพลง!",
    desc: "โปสเตอร์ 01: รูปอชิที่ควรจะหลับตา... จู่ๆ ก็ลืมตาโตจ้องมองคุณ!",
    focus: [0.48, 0.22],
  },
  {
    id: "med_kaneki",
    tier: 2,
    type: "poster",
    slot: "L1",
    variantUrl: "/ashi/variants/L1_var_kaneki.jpg",
    title: "คาเนกิ อชิ กูลตาเดียว",
    desc: "โปสเตอร์ 01: ผมเปลี่ยนเป็นสีขาวและตาข้างขวาเป็นสีแดงดำแบบ Tokyo Ghoul!",
    focus: [0.68, 0.2],
  },
  {
    id: "med_bird_bomb",
    tier: 2,
    type: "poster",
    slot: "L1",
    variantUrl: "/ashi/variants/L1_var_bird_bomb.jpg",
    title: "นกดำลูกระเบิด",
    desc: "โปสเตอร์ 01: อชิกลายเป็นนกสีดำติดชนวนระเบิดไฟลุกบนหัว!",
    focus: [0.48, 0.42],
  },
  {
    id: "med_gigachad",
    tier: 2,
    type: "poster",
    slot: "L2",
    variantUrl: "/ashi/variants/L2_var_gigachad.jpg",
    title: "สันกราม GigaChad คมบาดใจ",
    desc: "โปสเตอร์ 02: เหนียงอูมๆ หายวับ กลายเป็นกรามเหลี่ยมคมกริบระดับนายแบบ!",
    focus: [0.5, 0.58],
  },
  {
    id: "med_clown_peek",
    tier: 2,
    type: "poster",
    slot: "L3",
    variantUrl: "/ashi/variants/L3_var_clown.jpg",
    title: "ตัวตลกสยองแอบหลังโซฟา",
    desc: "โปสเตอร์ 03: มีตัวตลกหน้าขาวแอบยองๆ แสยะยิ้มอยู่ด้านหลังโซฟาฝั่งขวา!",
    focus: [0.8, 0.39],
  },
  {
    id: "med_hair_pizza",
    tier: 2,
    type: "poster",
    slot: "L4",
    variantUrl: "/ashi/variants/L4_var_hair_pizza.jpg",
    title: "พิซซ่าหน้าเส้นผมผีสิง",
    desc: "โปสเตอร์ 04: มีเส้นผมสีดำและชีสเยิ้มไหลทะลักออกมาจากกล่องพิซซ่า!",
    focus: [0.5, 0.89],
  },
  {
    id: "med_skydive_scream",
    tier: 2,
    type: "poster",
    slot: "L5",
    variantUrl: "/ashi/variants/L5_var_scream.jpg",
    title: "ตื่นมากรี๊ดกลางเวหา!",
    desc: "โปสเตอร์ 05: อชิที่เคยหลับพริ้มตอนดิ่งพสุธา ตาเหลือกอ้าปากกรี๊ดสุดขีด!",
    focus: [0.39, 0.45],
  },
  {
    id: "med_chubby_class",
    tier: 2,
    type: "poster",
    slot: "R1",
    variantUrl: "/ashi/variants/R1_var_chubby.jpg",
    title: "อชิร่างอวบ 150 กิโล",
    desc: "โปสเตอร์ 06: อชิในห้องเรียนตัวพองขยายร่างคับเสื้อเชิ้ต!",
    focus: [0.5, 0.56],
  },
  {
    id: "med_symbiote_spider",
    tier: 2,
    type: "poster",
    slot: "R3",
    variantUrl: "/ashi/variants/R3_var_symbiote.jpg",
    title: "สไปเดอร์อชิ ชุดดำ Venom",
    desc: "โปสเตอร์ 08: ชุดสไปเดอร์แมนสีแดง-น้ำเงิน เปลี่ยนเป็นชุดดำแมงมุมขาว Symbiote!",
    focus: [0.52, 0.5],
  },
  {
    id: "med_tv_hijack",
    tier: 2,
    type: "tv_hijack",
    variantUrl: "/ashi/variants/TV_urinal.jpg",
    title: "จอทีวีโดนแฮ็กเป็นคลิปลับห้องน้ำ!",
    desc: "จอมอนิเตอร์ข้างผนัง: แทนที่จะเล่นวิดีโอปกติ กลับโชว์ภาพลับกอดกันหน้าโถฉี่!",
    focus: [0.5, 0.5],
  },
  {
    id: "med_walker_ashi",
    tier: 2,
    type: "npc_ashi_head",
    title: "คนเดินสวนหัวกลายเป็นอชิ!",
    desc: "คนเดินสวนในอุโมงค์: พนักงานออฟฟิศที่เดินผ่าน มีใบหน้าเป็นรูปอชิขนาดใหญ่จ้องมองคุณ!",
  },

  // ================= TIER 3: HARD (Stages 6 - 8) =================
  {
    id: "hard_sofa_eyes",
    tier: 3,
    type: "poster",
    slot: "L3",
    variantUrl: "/ashi/variants/L3_var_eyes_open.jpg",
    title: "แอบลืมตายิ้มหลอนบนโซฟา",
    desc: "โปสเตอร์ 03: ทุกอย่างบนโซฟาเหมือนเดิมเป๊ะ ยกเว้นอชิลืมตาโพลงยิ้มมองคุณ!",
    focus: [0.21, 0.33],
  },
  {
    id: "hard_cafe_stare",
    tier: 3,
    type: "poster",
    slot: "R4",
    variantUrl: "/ashi/variants/R4_var_stare.jpg",
    title: "คู่รักเหลือกตามองแรง",
    desc: "โปสเตอร์ 09: ทั้งคู่ยังจมูกชนกันท่าเดิม แต่เหลือกตาขาวจ้องมองมาทางคุณ!",
    focus: [0.5, 0.31],
  },
  {
    id: "hard_sideeye_stare",
    tier: 3,
    type: "poster",
    slot: "R5",
    variantUrl: "/ashi/variants/R5_var_stare.jpg",
    title: "ตาดำเลื่อนมาจ้องหน้าคุณ!",
    desc: "โปสเตอร์ 10: จากเดิมที่เหลือบมองไปด้านข้าง ตาดำเลื่อนกลับมาจ้องตรงๆ ที่คุณ!",
    focus: [0.57, 0.27],
  },
  {
    id: "hard_cafe_six_fingers",
    tier: 3,
    type: "poster",
    slot: "R4",
    variantUrl: "/ashi/variants/R4_surg_six_fingers.jpg",
    title: "มือปริศนา 6 นิ้ว!",
    desc: "โปสเตอร์ 09: มือที่วางทาบอยู่บนหน้าอกเสื้อขาว มีนิ้วงอกเกินมาเป็น 6 นิ้ว!",
    focus: [0.2, 0.64],
  },
  {
    id: "hard_fourarms_two_eyes",
    tier: 3,
    type: "poster",
    slot: "S2",
    variantUrl: "/ashi/variants/S2_surg_two_eyes.jpg",
    title: "โฟร์อาร์มส์เหลือแค่ 2 ตา!",
    desc: "โปสเตอร์พิเศษ Four-Arms: ปกติร่างนี้ต้องมี 4 ตา แต่คราวนี้ตาคู่ล่างหายไปเหลือแค่ 2 ตา!",
    focus: [0.64, 0.06],
  },
  {
    id: "hard_gekko_red_orbs",
    tier: 3,
    type: "poster",
    slot: "S1",
    variantUrl: "/ashi/variants/S1_surg_red_orbs.jpg",
    title: "ลูกแก้ว Gekko กลายเป็นสีแดงเลือด",
    desc: "ป้ายแขวน Valorant: ลูกแก้วกลมๆ ที่เอวของ Gekko เปลี่ยนจากสีเขียวเป็นสีแดง!",
    focus: [0.51, 0.47],
  },
  {
    id: "hard_larva_no_antenna",
    tier: 3,
    type: "poster",
    slot: "S3",
    variantUrl: "/ashi/variants/S3_surg_no_antenna.jpg",
    title: "เสาอากาศหนอนสีเหลืองหายไป!",
    desc: "โปสเตอร์พิเศษ Larva: เสากลมๆ บนหัวของหนอน Larva ตัวสีเหลืองหายวับไป!",
    focus: [0.65, 0.38],
  },
  {
    id: "hard_tv_choke",
    tier: 3,
    type: "tv_hijack",
    variantUrl: "/ashi/variants/TV_choke.jpg",
    title: "จอทีวีเปลี่ยนเป็นภาพแลบลิ้นบีบคอ",
    desc: "จอมอนิเตอร์ข้างผนัง: ภาพวิดีโอค้างกลายเป็นภาพโดนบีบคอแลบลิ้นใส่แว่น!",
    focus: [0.5, 0.5],
  },
  {
    id: "hard_upside_door_sign",
    tier: 3,
    type: "door_anomaly",
    title: "ป้ายหน้าประตูห้องเครื่องกลับหัว + แง้มดูคุณ",
    desc: "ประตูเหล็กห้องเครื่อง: สติกเกอร์อชิหัวล้านติดกลับหัว 180° และมีดวงตาสีแดงแอบมองในช่องลม!",
  },

  // ================= TIER 4: EXTREME / NIGHTMARE (Stages 9 - 10) =================
  {
    id: "ext_dog_bg_man",
    tier: 4,
    type: "poster",
    slot: "R2",
    variantUrl: "/ashi/variants/R2_surg_bg_man.jpg",
    title: "คนเสื้อขาวด้านหลังสุดหันมามอง!",
    desc: "โปสเตอร์ 07: ผู้ชายเสื้อขาวที่เคยนั่งหันหลังตรงโต๊ะมุมซ้ายบน หันหน้ากลับมาจ้องคุณ!",
    focus: [0.16, 0.16],
  },
  {
    id: "ext_dog_no_collar",
    tier: 4,
    type: "poster",
    slot: "R2",
    variantUrl: "/ashi/variants/R2_surg_no_collar.jpg",
    title: "ปลอกคอและป้ายกระดูกหายไป!",
    desc: "โปสเตอร์ 07: ปลอกคอและป้ายชื่อรูปกระดูกสีดำตรงอกโกลเด้นอชิ หายไปเหลือแต่ขน!",
    focus: [0.52, 0.54],
  },
  {
    id: "ext_cafe_bg_girl",
    tier: 4,
    type: "poster",
    slot: "R4",
    variantUrl: "/ashi/variants/R4_surg_bg_girl.jpg",
    title: "ผู้หญิงริมซ้ายสุดหันมาถลึงตาใส่!",
    desc: "โปสเตอร์ 09: ผู้หญิงที่นั่งอยู่ขอบซ้ายสุดของฉากหลัง หันหน้าถลึงตามองกล้อง!",
    focus: [0.05, 0.34],
  },
  {
    id: "ext_sofa_w_fries",
    tier: 4,
    type: "poster",
    slot: "L3",
    variantUrl: "/ashi/variants/L3_surg_w_fries.jpg",
    title: "โลโก้เฟรนช์ฟรายส์กลับหัวเป็นตัว W!",
    desc: "โปสเตอร์ 03: ตัว M สีเหลืองบนซองเฟรนช์ฟรายส์แดงด้านล่าง กลับหัวเป็นตัว W!",
    focus: [0.565, 0.9],
  },
  {
    id: "ext_sofa_no_bottle",
    tier: 4,
    type: "poster",
    slot: "L3",
    variantUrl: "/ashi/variants/L3_surg_no_bottle.jpg",
    title: "ขวดน้ำบนพนักโซฟาหายไป!",
    desc: "โปสเตอร์ 03: ขวดน้ำพลาสติกใสที่ตั้งอยู่บนพนักพิงโซฟาด้านหลังหายไปไร้ร่องรอย!",
    focus: [0.675, 0.36],
  },
  {
    id: "ext_pizza_one_nipple",
    tier: 4,
    type: "poster",
    slot: "L4",
    variantUrl: "/ashi/variants/L4_surg_one_nipple.jpg",
    title: "หัวนมหายไป 1 ข้าง!",
    desc: "โปสเตอร์ 04: หัวนมฝั่งซ้ายของภาพของพนักงานส่งพิซซ่า ถูกลบหายไปเหลือข้างเดียว!",
    focus: [0.425, 0.57],
  },
  {
    id: "ext_skydive_twin",
    tier: 4,
    type: "poster",
    slot: "L5",
    variantUrl: "/ashi/variants/L5_surg_mini_twin.jpg",
    title: "ร่างแยกอชิจิ๋วบนก้อนเมฆ!",
    desc: "โปสเตอร์ 05: มีร่างอชิตัวจิ๋วอีกคนกำลังดิ่งพสุธาอยู่ไกลๆ เหนือก้อนเมฆมุมขวาบน!",
    focus: [0.84, 0.21],
  },
  {
    id: "ext_class_blue_badge",
    tier: 4,
    type: "poster",
    slot: "R1",
    variantUrl: "/ashi/variants/R1_surg_blue_badge.jpg",
    title: "ตราบนเนคไทเปลี่ยนเป็นสีฟ้า!",
    desc: "โปสเตอร์ 06: ตราสัญลักษณ์วงกลมบนเนคไทสีดำ เปลี่ยนจากสีแดงเป็นสีฟ้า!",
    focus: [0.565, 0.735],
  },
  {
    id: "ext_class_no_hinge",
    tier: 4,
    type: "poster",
    slot: "R1",
    variantUrl: "/ashi/variants/R1_surg_no_hinge.jpg",
    title: "บานพับประตูเหล็กด้านขวาหายไป!",
    desc: "โปสเตอร์ 06: บานพับเหล็กตัวบนของประตูฝั่งขวาหลังอชิ หายไป 1 ตัว!",
    focus: [0.855, 0.37],
  },
  {
    id: "ext_spider_no_phone",
    tier: 4,
    type: "poster",
    slot: "R3",
    variantUrl: "/ashi/variants/R3_surg_no_phone.jpg",
    title: "โทรศัพท์ iPhone ใต้มือหายไป!",
    desc: "โปสเตอร์ 08: โทรศัพท์มือถือ iPhone ที่วางอยู่ใต้มือสไปเดอร์อชิบนพื้นเวทีหายไป!",
    focus: [0.39, 0.81],
  },
];

/**
 * Smart Stage Director:
 * Picks whether Stage `stageNum` (1..10) has an anomaly or is completely normal,
 * strictly scaling anomaly difficulty with stage number while preventing boring streaks.
 */
export class StageDirector {
  constructor() {
    this.usedAnomalyIds = new Set();
    this.normalStreak = 0;
    this.anomalyStreak = 0;
  }

  resetRun() {
    this.normalStreak = 0;
    this.anomalyStreak = 0;
  }

  getTierForStage(stageNum) {
    if (stageNum <= 0) return 0;
    return DIFFICULTY_TIERS[Math.min(10, stageNum)].tier;
  }

  nextStageConfig(stageNum) {
    if (stageNum === 0) {
      return { stageNum: 0, hasAnomaly: false, anomaly: null };
    }

    const tier = this.getTierForStage(stageNum);

    // Base anomaly probability ~72%, but never allow >2 normals in a row or >4 anomalies in a row
    let wantAnomaly = Math.random() < 0.72;
    if (this.normalStreak >= 2) wantAnomaly = true;
    if (this.anomalyStreak >= 4) wantAnomaly = false;
    // Ensure Stage 10 (Final Boss Stage!) has high tension (80% anomaly chance unless streak forces normal)
    if (stageNum === 10 && this.anomalyStreak < 4) {
      wantAnomaly = Math.random() < 0.82;
    }

    if (!wantAnomaly) {
      this.normalStreak++;
      this.anomalyStreak = 0;
      return { stageNum, hasAnomaly: false, anomaly: null };
    }

    this.anomalyStreak++;
    this.normalStreak = 0;

    // Filter anomalies matching this stage's difficulty tier
    let pool = ANOMALIES.filter((a) => a.tier === tier && !this.usedAnomalyIds.has(a.id));
    if (pool.length === 0) {
      // Refill tier pool if player played many loops
      ANOMALIES.filter((a) => a.tier === tier).forEach((a) => this.usedAnomalyIds.delete(a.id));
      pool = ANOMALIES.filter((a) => a.tier === tier);
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this.usedAnomalyIds.add(chosen.id);
    return { stageNum, hasAnomaly: true, anomaly: chosen };
  }
}

