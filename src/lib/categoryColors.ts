// Centralized category color configuration
// Used consistently across the entire site for both problem and innovation categories

// Innovation categories
export const innovationCategoryColors: Record<string, string> = {
  ai: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  healthtech: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  fintech: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  climatetech: 'bg-green-500/20 text-green-400 border-green-500/30',
  edtech: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  saas: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  hardware: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  web3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// Problem categories
export const problemCategoryColors: Record<string, string> = {
  technology: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  healthcare: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  sustainability: 'bg-green-500/20 text-green-400 border-green-500/30',
  finance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  education: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  infrastructure: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  manufacturing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  agriculture: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// Dashboard display categories (aggregated)
export const dashboardCategoryColors: Record<string, string> = {
  'Artificial Intelligence': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Health Tech': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Ed Tech': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Climate Tech': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Fin Tech': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'SaaS': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Hardware & IoT': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Web3 & Blockchain': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Other': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// Category labels for display
export const innovationCategoryLabels: Record<string, string> = {
  ai: 'Artificial Intelligence',
  healthtech: 'Health Tech',
  fintech: 'Fin Tech',
  climatetech: 'Climate Tech',
  edtech: 'Ed Tech',
  saas: 'SaaS',
  hardware: 'Hardware & IoT',
  web3: 'Web3 & Blockchain',
  other: 'Other',
};

export const problemCategoryLabels: Record<string, string> = {
  technology: 'Technology',
  healthcare: 'Healthcare',
  sustainability: 'Sustainability',
  finance: 'Finance',
  education: 'Education',
  infrastructure: 'Infrastructure',
  manufacturing: 'Manufacturing',
  agriculture: 'Agriculture',
  other: 'Other',
};

// Helper function to get category color
export const getCategoryColor = (category: string, type: 'innovation' | 'problem' | 'dashboard' = 'innovation'): string => {
  const lowercaseCategory = category.toLowerCase();
  
  if (type === 'dashboard') {
    return dashboardCategoryColors[category] || dashboardCategoryColors['Others'];
  }
  
  if (type === 'problem') {
    return problemCategoryColors[lowercaseCategory] || problemCategoryColors['other'];
  }
  
  return innovationCategoryColors[lowercaseCategory] || innovationCategoryColors['other'];
};

// Helper function to get category label
export const getCategoryLabel = (category: string, type: 'innovation' | 'problem' = 'innovation'): string => {
  const lowercaseCategory = category.toLowerCase();
  
  if (type === 'problem') {
    return problemCategoryLabels[lowercaseCategory] || category;
  }
  
  return innovationCategoryLabels[lowercaseCategory] || category;
};
