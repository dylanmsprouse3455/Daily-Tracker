const STATES = [
  {
    section: "Primary",
    items: [
      { name: "Work", type: "productive", earn: 0.40 },
      { name: "Cleaning", type: "productive", earn: 0.35 },
      { name: "Exercise", type: "productive", earn: 0.45 },
      { name: "Deep Focus", type: "productive", earn: 0.50 },
      { name: "Relax", type: "relax", burn: 0.30 },
      { name: "Phone Scroll", type: "relax", burn: 0.40 }
    ]
  },

  {
    section: "Home",
    items: [
      { name: "Bedroom", type: "neutral" },
      { name: "Front Room", type: "neutral" },
      { name: "In Bed Awake", type: "relax", burn: 0.25 },
      { name: "Sleeping", type: "neutral" }
    ]
  },

  {
    section: "Movement",
    items: [
      { name: "Car", type: "neutral" },
      { name: "Out", type: "neutral" },
      { name: "Walking", type: "productive", earn: 0.30 },
      { name: "Errands", type: "productive", earn: 0.35 }
    ]
  },

  {
    section: "Social",
    items: [
      { name: "Conversation - Focused", type: "productive", earn: 0.30 },
      { name: "Conversation - Casual", type: "neutral" },
      { name: "Social Media Posting", type: "productive", earn: 0.25 }
    ]
  }
];