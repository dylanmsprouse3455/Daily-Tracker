// Sectioned for UI
const STATE_SECTIONS = [
  {
    section: "Primary",
    items: [
      { name: "Work", type: "productive", earn: 1.0, burn: 0 },
      { name: "Cleaning", type: "productive", earn: 1.2, burn: 0 },
      { name: "Workout", type: "productive", earn: 1.5, burn: 0 },
      { name: "Deep Focus", type: "productive", earn: 2.0, burn: 0 },

      { name: "Gaming", type: "relax", earn: 0, burn: 1.6 },
      { name: "TV", type: "relax", earn: 0, burn: 1.2 },
      { name: "Scrolling", type: "relax", earn: 0, burn: 1.9 },
      { name: "Bed (Awake)", type: "relax", earn: 0, burn: 1.4 }
    ]
  },

  {
    section: "Location",
    items: [
      { name: "Front Room", type: "neutral", earn: 0, burn: 0 },
      { name: "Bedroom", type: "neutral", earn: 0, burn: 0 },
      { name: "Kitchen", type: "neutral", earn: 0, burn: 0 },
      { name: "Car", type: "neutral", earn: 0, burn: 0 },
      { name: "Out", type: "neutral", earn: 0, burn: 0 }
    ]
  },

  {
    section: "Life",
    items: [
      { name: "Shower", type: "neutral", earn: 0, burn: 0 },
      { name: "Eating", type: "neutral", earn: 0, burn: 0 },
      { name: "Sleep", type: "neutral", earn: 0, burn: 0 },
      { name: "Errands", type: "productive", earn: 0.8, burn: 0 },
      { name: "Planning", type: "productive", earn: 1.1, burn: 0 }
    ]
  },

  {
    section: "Social",
    items: [
      { name: "Conversation (Focused)", type: "productive", earn: 1.0, burn: 0 },
      { name: "Conversation (Casual)", type: "neutral", earn: 0, burn: 0 }
    ]
  }
];

// Flat for engine compatibility
const STATES = STATE_SECTIONS.flatMap(s => s.items);