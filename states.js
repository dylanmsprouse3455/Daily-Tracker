const STATES = [

  // Location
  { name: "Front Room", category: "location", type: "neutral" },
  { name: "Bedroom", category: "location", type: "neutral" },
  { name: "Kitchen", category: "location", type: "neutral" },
  { name: "Car", category: "location", type: "neutral" },
  { name: "Out", category: "location", type: "neutral" },

  // Productive
  { name: "Work", category: "primary", type: "productive", earn: 1.0 },
  { name: "Deep Focus", category: "primary", type: "productive", earn: 2.0 },
  { name: "Cleaning", category: "primary", type: "productive", earn: 1.2 },
  { name: "Workout", category: "primary", type: "productive", earn: 1.5 },
  { name: "Learning", category: "primary", type: "productive", earn: 1.3 },

  // Relax
  { name: "TV", category: "primary", type: "relax", burn: 1.3 },
  { name: "Gaming", category: "primary", type: "relax", burn: 1.6 },
  { name: "Scrolling", category: "primary", type: "relax", burn: 1.9 },
  { name: "In Bed Awake", category: "primary", type: "relax", burn: 1.4 },

  // Modifiers
  { name: "Focused", category: "modifier", type: "neutral" },
  { name: "Distracted", category: "modifier", type: "neutral" },
  { name: "Social", category: "modifier", type: "neutral" },
  { name: "Music On", category: "modifier", type: "neutral" },
  { name: "Tired", category: "modifier", type: "neutral" }
];