// Instant, offline audience suggestions on the Audience page, picked by the
// industry in Settings → Workspace. "✦ Find similar audiences" adds tailored ones.

const GENERAL = [
  "Gen Z shoppers",
  "Millennial parents",
  "Small business owners",
  "Young professionals",
  "Students",
  "Retirees",
  "Remote workers",
  "Budget-conscious shoppers",
  "Eco-conscious consumers",
  "Local community",
  "Early adopters",
  "Luxury buyers",
];

const BY_INDUSTRY = {
  "Retail and e-commerce": ["Online bargain hunters", "Gift shoppers", "Repeat customers", "Mobile-first shoppers"],
  "Food and beverage": ["Home cooks", "Foodies", "Coffee lovers", "Health-conscious eaters", "Cafe and restaurant owners"],
  "Hospitality and travel": ["Business travellers", "Luxury travellers", "Budget travellers", "Hotel general managers", "Event planners"],
  "Health, beauty and wellness": ["Skincare enthusiasts", "Wellness seekers", "Clean beauty fans", "Salon owners"],
  "Fitness and sport": ["Gym beginners", "Runners", "Home workout fans", "Weekend athletes"],
  "Fashion and apparel": ["Streetwear fans", "Sustainable fashion buyers", "Workwear shoppers", "Thrifters"],
  "Home and interiors": ["First-time homeowners", "Renters decorating on a budget", "DIY renovators", "Interior designers"],
  "Technology and software": ["Startup founders", "IT decision makers", "Developers", "Operations managers"],
  "Professional services": ["Small business owners", "Finance managers", "HR leaders", "Freelancers"],
  "Wholesale and distribution": ["Procurement teams", "Independent retailers", "Purchasing managers"],
  Manufacturing: ["Procurement teams", "Plant managers", "Engineers"],
  "Real estate": ["First-time buyers", "Property investors", "Downsizers", "Renters"],
  Education: ["Parents of school-age kids", "Adult learners", "Teachers", "University applicants"],
  "Arts, media and entertainment": ["Music fans", "Gamers", "Creators", "Film lovers"],
  "Non-profit": ["Volunteers", "Monthly donors", "Community advocates", "Corporate partners"],
};

export function presetAudiences(industry) {
  return [...new Set([...(BY_INDUSTRY[industry] ?? []), ...GENERAL])];
}
