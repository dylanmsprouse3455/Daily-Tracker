const STATES = [

  // ===== PRODUCTIVE =====
  { name: "Work", type: "productive", earn: 1.0, burn: 0 },
  { name: "Deep Work", type: "productive", earn: 2.0, burn: 0 },
  { name: "Planning", type: "productive", earn: 1.2, burn: 0 },
  { name: "Admin Tasks", type: "productive", earn: 0.8, burn: 0 },
  { name: "Learning", type: "productive", earn: 1.5, burn: 0 },
  { name: "Reading (Focused)", type: "productive", earn: 1.3, burn: 0 },
  { name: "Coding", type: "productive", earn: 1.7, burn: 0 },
  { name: "Creative Work", type: "productive", earn: 1.6, burn: 0 },
  { name: "Drawing", type: "productive", earn: 1.4, burn: 0 },
  { name: "Workout", type: "productive", earn: 1.6, burn: 0 },
  { name: "Stretching", type: "productive", earn: 0.7, burn: 0 },
  { name: "Cleaning", type: "productive", earn: 1.1, burn: 0 },
  { name: "Meal Prep", type: "productive", earn: 1.0, burn: 0 },
  { name: "Intentional Driving", type: "productive", earn: 0.6, burn: 0 },

  // ===== RELAX =====
  { name: "TV", type: "relax", earn: 0, burn: 1.2 },
  { name: "Gaming", type: "relax", earn: 0, burn: 1.6 },
  { name: "Scrolling", type: "relax", earn: 0, burn: 1.9 },
  { name: "Passive YouTube", type: "relax", earn: 0, burn: 1.5 },
  { name: "Laying Around", type: "relax", earn: 0, burn: 1.7 },
  { name: "Bed (Awake)", type: "relax", earn: 0, burn: 1.4 },
  { name: "Snacking", type: "relax", earn: 0, burn: 1.1 },
  { name: "Impulse Browsing", type: "relax", earn: 0, burn: 2.0 },

  // ===== LOCATION =====
  { name: "Car", type: "neutral", earn: 0, burn: 0 },
  { name: "Front Room", type: "neutral", earn: 0, burn: 0 },
  { name: "Bedroom", type: "neutral", earn: 0, burn: 0 },
  { name: "Kitchen", type: "neutral", earn: 0, burn: 0 },
  { name: "Out", type: "neutral", earn: 0, burn: 0 },
  { name: "Gym", type: "neutral", earn: 0, burn: 0 },
  { name: "Office", type: "neutral", earn: 0, burn: 0 },

  // ===== SOCIAL =====
  { name: "Conversation (Focused)", type: "productive", earn: 1.0, burn: 0 },
  { name: "Conversation (Casual)", type: "neutral", earn: 0, burn: 0 },
  { name: "Social Media Posting", type: "productive", earn: 0.8, burn: 0 },
  { name: "Arguing", type: "relax", earn: 0, burn: 1.5 },

  // ===== PHYSICAL STATE =====
  { name: "Hungry", type: "neutral", earn: 0, burn: 0 },
  { name: "Tired", type: "neutral", earn: 0, burn: 0 },
  { name: "Energized", type: "productive", earn: 0.5, burn: 0 },
  { name: "Sick", type: "neutral", earn: 0, burn: 0 },

  // ===== REST =====
  { name: "Sleep", type: "neutral", earn: 0, burn: 0 }
];