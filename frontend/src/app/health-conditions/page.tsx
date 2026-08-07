"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { API_URL, apiFetch } from "@/lib/api";
import { Search, Pill, AlertTriangle, CheckCircle2, ArrowRight, Loader2, BookOpen } from "lucide-react";

interface Condition {
  id: string;
  name: string;
  category: string;
  description: string;
  symptoms: string[];
  treatments: { name: string; type: string; requiresPrescription: boolean }[];
  prevention: string[];
  whenToSeeDoctor: string[];
  slug: string;
  blogTags?: string[];
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  author: string;
  imageUrl: string | null;
  tags: string[];
  createdAt: string;
}

const CONDITIONS: Condition[] = [
  {
    id: "malaria",
    name: "Malaria",
    category: "Infectious Disease",
    description: "A life-threatening disease caused by parasites transmitted through infected Anopheles mosquito bites. Common in tropical regions including Ghana.",
    symptoms: ["High fever", "Chills and sweating", "Headache", "Nausea and vomiting", "Body aches", "Fatigue"],
    treatments: [
      { name: "Artemether-Lumefantrine (Coartem)", type: "Antimalarial", requiresPrescription: false },
      { name: "Artesunate Injection", type: "Antimalarial", requiresPrescription: true },
      { name: "Paracetamol", type: "Antipyretic", requiresPrescription: false },
      { name: "ORS Solution", type: "Rehydration", requiresPrescription: false },
    ],
    prevention: ["Use insecticide-treated mosquito nets", "Apply insect repellent", "Wear long sleeves at dusk", "Clear stagnant water around your home"],
    whenToSeeDoctor: ["Fever above 38.5°C lasting more than 2 days", "Vomiting unable to keep fluids down", "Severe headache with stiff neck", "Confusion or difficulty breathing"],
    slug: "malaria",
    blogTags: ["Malaria", "Health Tips"],
  },
  {
    id: "hypertension",
    name: "Hypertension (High Blood Pressure)",
    category: "Cardiovascular",
    description: "A chronic condition where blood pressure in the arteries is persistently elevated. Often called the 'silent killer' because it may have no symptoms.",
    symptoms: ["Often no symptoms", "Headaches (in severe cases)", "Shortness of breath", "Nosebleeds (rare)", "Dizziness"],
    treatments: [
      { name: "Amlodipine", type: "Calcium Channel Blocker", requiresPrescription: true },
      { name: "Lisinopril", type: "ACE Inhibitor", requiresPrescription: true },
      { name: "Losartan", type: "ARB", requiresPrescription: true },
      { name: "Hydrochlorothiazide", type: "Diuretic", requiresPrescription: true },
    ],
    prevention: ["Reduce salt intake", "Exercise regularly (30 min/day)", "Maintain healthy weight", "Limit alcohol consumption", "Quit smoking"],
    whenToSeeDoctor: ["Blood pressure consistently above 140/90 mmHg", "Sudden severe headache", "Vision changes", "Chest pain"],
    slug: "hypertension",
    blogTags: ["Hypertension", "Health Tips"],
  },
  {
    id: "diabetes",
    name: "Diabetes Mellitus",
    category: "Endocrine",
    description: "A group of metabolic disorders characterized by high blood sugar levels over a prolonged period. Type 2 is most common in Ghana.",
    symptoms: ["Increased thirst", "Frequent urination", "Unexplained weight loss", "Fatigue", "Blurred vision", "Slow-healing wounds"],
    treatments: [
      { name: "Metformin", type: "Biguanide", requiresPrescription: true },
      { name: "Gliclazide", type: "Sulfonylurea", requiresPrescription: true },
      { name: "Insulin (various)", type: "Insulin", requiresPrescription: true },
      { name: "Blood Glucose Test Strips", type: "Monitoring", requiresPrescription: false },
    ],
    prevention: ["Maintain healthy weight", "Regular physical activity", "Balanced diet low in refined sugars", "Regular blood sugar screening"],
    whenToSeeDoctor: ["Fasting blood sugar above 7.0 mmol/L", "Symptoms of hypo/hyperglycemia", "Foot ulcers or wounds not healing", "Vision changes"],
    slug: "diabetes",
    blogTags: ["Diabetes", "Health Tips"],
  },
  {
    id: "typhoid",
    name: "Typhoid Fever",
    category: "Infectious Disease",
    description: "A bacterial infection caused by Salmonella typhi, spread through contaminated food and water. Common in areas with poor sanitation.",
    symptoms: ["Sustained high fever", "Weakness and fatigue", "Stomach pain", "Headache", "Loss of appetite", "Constipation or diarrhea"],
    treatments: [
      { name: "Ciprofloxacin", type: "Antibiotic", requiresPrescription: true },
      { name: "Azithromycin", type: "Antibiotic", requiresPrescription: true },
      { name: "Paracetamol", type: "Antipyretic", requiresPrescription: false },
      { name: "ORS Solution", type: "Rehydration", requiresPrescription: false },
    ],
    prevention: ["Drink safe/treated water", "Wash hands regularly", "Avoid raw foods from street vendors", "Proper food storage"],
    whenToSeeDoctor: ["Fever lasting more than 3 days", "Severe abdominal pain", "Blood in stool", "Inability to retain fluids"],
    slug: "typhoid",
    blogTags: ["Health Tips"],
  },
  {
    id: "urinary-tract-infection",
    name: "Urinary Tract Infection (UTI)",
    category: "Infectious Disease",
    description: "An infection in any part of the urinary system — kidneys, bladder, ureters, or urethra. More common in women.",
    symptoms: ["Burning sensation during urination", "Frequent urge to urinate", "Cloudy or strong-smelling urine", "Pelvic pain", "Blood in urine"],
    treatments: [
      { name: "Nitrofurantoin", type: "Antibiotic", requiresPrescription: true },
      { name: "Ciprofloxacin", type: "Antibiotic", requiresPrescription: true },
      { name: "Trimethoprim-Sulfamethoxazole", type: "Antibiotic", requiresPrescription: true },
      { name: "Cranberry Supplements", type: "Supplement", requiresPrescription: false },
    ],
    prevention: ["Drink plenty of water", "Urinate after intercourse", "Wipe front to back", "Avoid irritating feminine products"],
    whenToSeeDoctor: ["Symptoms lasting more than 2 days", "Fever or chills", "Back or side pain", "Recurrent infections"],
    slug: "urinary-tract-infection",
    blogTags: ["Health Tips"],
  },
  {
    id: "gastritis",
    name: "Gastritis",
    category: "Gastrointestinal",
    description: "Inflammation of the stomach lining, which can be caused by infection, regular use of pain relievers, excessive alcohol consumption, or stress.",
    symptoms: ["Stomach pain or burning", "Nausea", "Vomiting", "Bloating", "Loss of appetite", "Hiccups"],
    treatments: [
      { name: "Omeprazole", type: "Proton Pump Inhibitor", requiresPrescription: false },
      { name: "Ranitidine", type: "H2 Blocker", requiresPrescription: false },
      { name: "Antacids (Maalox, Gelusil)", type: "Antacid", requiresPrescription: false },
      { name: "Sucralfate", type: "Mucosal Protectant", requiresPrescription: true },
    ],
    prevention: ["Eat smaller, more frequent meals", "Avoid spicy and acidic foods", "Limit alcohol", "Manage stress", "Avoid NSAIDs"],
    whenToSeeDoctor: ["Severe stomach pain", "Vomiting blood", "Black tarry stools", "Unexplained weight loss"],
    slug: "gastritis",
    blogTags: ["Health Tips"],
  },
  {
    id: "asthma",
    name: "Asthma",
    category: "Respiratory",
    description: "A chronic condition where the airways narrow, swell, and may produce extra mucus, making breathing difficult and triggering coughing and wheezing.",
    symptoms: ["Shortness of breath", "Chest tightness", "Wheezing", "Coughing (especially at night)", "Difficulty exercising"],
    treatments: [
      { name: "Salbutamol Inhaler (Ventolin)", type: "Bronchodilator", requiresPrescription: true },
      { name: "Beclometasone Inhaler", type: "Corticosteroid", requiresPrescription: true },
      { name: "Montelukast", type: "Leukotriene Modifier", requiresPrescription: true },
      { name: "Spacer Device", type: "Device", requiresPrescription: false },
    ],
    prevention: ["Identify and avoid triggers", "Keep rescue inhaler accessible", "Regular exercise", "Maintain healthy weight", "Avoid dust and smoke"],
    whenToSeeDoctor: ["Rescue inhaler not providing relief", "Difficulty speaking due to breathlessness", "Lips or fingernails turning blue", "Peak flow readings dropping"],
    slug: "asthma",
    blogTags: ["Health Tips"],
  },
  {
    id: "skin-infections",
    name: "Skin Infections",
    category: "Dermatological",
    description: "Common skin infections include fungal infections (ringworm, athlete's foot), bacterial infections (impetigo), and parasitic infections (scabies).",
    symptoms: ["Redness and swelling", "Itching", "Pus or discharge", "Pain or tenderness", "Scaly or flaky skin", "Blisters"],
    treatments: [
      { name: "Clotrimazole Cream", type: "Antifungal", requiresPrescription: false },
      { name: "Mupirocin Ointment", type: "Antibacterial", requiresPrescription: true },
      { name: "Permethrin Cream", type: "Antiparasitic", requiresPrescription: true },
      { name: "Fluconazole", type: "Antifungal", requiresPrescription: true },
    ],
    prevention: ["Keep skin clean and dry", "Don't share personal items", "Wear breathable fabrics", "Treat wounds promptly"],
    whenToSeeDoctor: ["Infection spreading rapidly", "Fever with skin infection", "Pus or increasing redness", "Not improving with OTC treatment"],
    slug: "skin-infections",
    blogTags: ["Health Tips"],
  },
  {
    id: "headache",
    name: "Headaches & Migraines",
    category: "Neurological",
    description: "Recurrent headaches range from tension headaches to migraines. Migraines often include throbbing pain, nausea, and sensitivity to light and sound.",
    symptoms: ["Throbbing or pulsing pain", "Sensitivity to light and sound", "Nausea or vomiting", "Visual disturbances (aura)", "Neck stiffness"],
    treatments: [
      { name: "Ibuprofen", type: "NSAID", requiresPrescription: false },
      { name: "Paracetamol", type: "Analgesic", requiresPrescription: false },
      { name: "Sumatriptan", type: "Triptan", requiresPrescription: true },
      { name: "Caffeine + Paracetamol combo", type: "Analgesic", requiresPrescription: false },
    ],
    prevention: ["Maintain regular sleep schedule", "Stay hydrated", "Manage stress", "Limit screen time", "Identify trigger foods"],
    whenToSeeDoctor: ["Worst headache of your life", "Headache with fever and stiff neck", "Headache after head injury", "Persistent daily headaches"],
    slug: "headache",
    blogTags: ["Health Tips"],
  },
  {
    id: "cough-cold-flu",
    name: "Cough, Cold & Flu",
    category: "Respiratory",
    description: "Upper respiratory infections caused by viruses. Usually self-limiting but can lead to secondary bacterial infections if severe or prolonged.",
    symptoms: ["Runny or stuffy nose", "Sore throat", "Coughing", "Sneezing", "Mild body aches", "Low-grade fever"],
    treatments: [
      { name: "Dextromethorphan Syrup", type: "Antitussive", requiresPrescription: false },
      { name: "Phenylephrine", type: "Decongestant", requiresPrescription: false },
      { name: "Cetirizine", type: "Antihistamine", requiresPrescription: false },
      { name: "Vitamin C Supplements", type: "Supplement", requiresPrescription: false },
    ],
    prevention: ["Wash hands frequently", "Avoid close contact with sick individuals", "Boost immune system with nutrition", "Get annual flu vaccine"],
    whenToSeeDoctor: ["Symptoms lasting more than 10 days", "High fever above 39°C", "Difficulty breathing", "Severe sore throat with rash"],
    slug: "cough-cold-flu",
    blogTags: ["Antibiotics", "Health Tips"],
  },
  {
    id: "allergies",
    name: "Allergies",
    category: "Immunological",
    description: "Overreaction of the immune system to normally harmless substances. Can range from mild seasonal allergies to severe anaphylaxis.",
    symptoms: ["Sneezing and runny nose", "Itchy, watery eyes", "Skin rash or hives", "Nasal congestion", "Swelling (in severe cases)"],
    treatments: [
      { name: "Cetirizine", type: "Antihistamine", requiresPrescription: false },
      { name: "Loratadine", type: "Antihistamine", requiresPrescription: false },
      { name: "Fluticasone Nasal Spray", type: "Corticosteroid", requiresPrescription: true },
      { name: "Epinephrine Auto-Injector", type: "Emergency", requiresPrescription: true },
    ],
    prevention: ["Identify and avoid allergens", "Keep windows closed during high pollen", "Use air purifiers", "Wash bedding in hot water"],
    whenToSeeDoctor: ["Difficulty breathing or swallowing", "Swelling of face/throat", "Severe hives spreading rapidly", "Anaphylaxis symptoms"],
    slug: "allergies",
    blogTags: ["Health Tips"],
  },
  {
    id: "fungal-infections",
    name: "Fungal Infections",
    category: "Dermatological",
    description: "Common fungal infections include athlete's foot, ringworm, and yeast infections. Fungi thrive in warm, moist environments.",
    symptoms: ["Intense itching", "Red, scaly patches", "Cracking or peeling skin", "Blisters", "Discolored nails"],
    treatments: [
      { name: "Clotrimazole Cream", type: "Antifungal", requiresPrescription: false },
      { name: "Terbinafine Cream", type: "Antifungal", requiresPrescription: false },
      { name: "Fluconazole", type: "Antifungal (oral)", requiresPrescription: true },
      { name: "Ketoconazole Shampoo", type: "Antifungal", requiresPrescription: false },
    ],
    prevention: ["Keep skin dry and clean", "Wear breathable footwear", "Don't share towels or shoes", "Change socks daily"],
    whenToSeeDoctor: ["Infection not clearing with OTC treatment", "Spreading rapidly", "Nail fungus", "Recurring infections"],
    slug: "fungal-infections",
    blogTags: ["Health Tips"],
  },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-48" />
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function HealthConditionsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [symptomResults, setSymptomResults] = useState<any[] | null>(null);
  const [symptomLoading, setSymptomLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"conditions" | "symptoms">("conditions");

  const categories = useMemo(() => {
    const cats = [...new Set(CONDITIONS.map((c) => c.category))];
    return cats.sort();
  }, []);

  const filtered = useMemo(() => {
    return CONDITIONS.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.symptoms.some((s) => s.toLowerCase().includes(q));
      const matchesCategory = !selectedCategory || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    setBlogLoading(true);
    try {
      const res = await fetch(`${API_URL}/blog?limit=20`);
      if (res.ok) {
        const data = await res.json();
        const healthPosts = (data.posts || []).filter((p: BlogPost) =>
          p.tags.some((t) =>
            ["Health Tips", "Malaria", "Diabetes", "Hypertension", "Antibiotics", "Maternal Health", "Child Health"].includes(t)
          )
        );
        setBlogPosts(healthPosts);
      }
    } catch {
      // Blog is optional — page still works with curated data
    } finally {
      setBlogLoading(false);
    }
  };

  const handleSymptomSearch = async () => {
    if (!symptomSearch.trim()) return;
    setSymptomLoading(true);
    try {
      const res = await fetch(`${API_URL}/search/symptoms?q=${encodeURIComponent(symptomSearch.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSymptomResults(data.products || []);
      } else {
        setSymptomResults([]);
      }
    } catch {
      setSymptomResults([]);
    } finally {
      setSymptomLoading(false);
    }
  };

  const getRelatedBlogPosts = (condition: Condition) => {
    if (!condition.blogTags || blogPosts.length === 0) return [];
    return blogPosts.filter((p) => p.tags.some((t) => condition.blogTags!.includes(t))).slice(0, 3);
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      <div className="text-left space-y-3">
        <Badge variant="emerald">Health Information Hub</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Common Health Conditions</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Evidence-based information about common conditions in Ghana. Always consult a healthcare professional for diagnosis and treatment.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("conditions")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "conditions"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          Browse Conditions
        </button>
        <button
          onClick={() => setActiveTab("symptoms")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "symptoms"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          Search by Symptom
        </button>
      </div>

      {activeTab === "conditions" && (
        <>
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conditions (e.g. fever, diabetes, skin)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    !selectedCategory
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-slate-500">No conditions found matching your search. Try a different keyword.</p>
              </Card>
            ) : (
              filtered.map((condition) => {
                const relatedPosts = getRelatedBlogPosts(condition);
                return (
                  <Card key={condition.id} className="overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedCondition(expandedCondition === condition.id ? null : condition.id)
                      }
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{condition.name}</h2>
                          <Badge variant="emerald">{condition.category}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1">{condition.description}</p>
                      </div>
                      <ArrowRight
                        className={`h-5 w-5 text-slate-400 transition-transform ${
                          expandedCondition === condition.id ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {expandedCondition === condition.id && (
                      <div className="px-6 pb-6 space-y-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-600 dark:text-slate-400 pt-4">{condition.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              Symptoms
                            </h3>
                            <ul className="space-y-1">
                              {condition.symptoms.map((s, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <Pill className="h-4 w-4 text-emerald-500" />
                              Common Treatments
                            </h3>
                            <div className="space-y-2">
                              {condition.treatments.map((t, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                                >
                                  <span className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500">{t.type}</span>
                                    {t.requiresPrescription && (
                                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium rounded">
                                        Rx
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              Prevention
                            </h3>
                            <ul className="space-y-1">
                              {condition.prevention.map((p, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              When to See a Doctor
                            </h3>
                            <ul className="space-y-1">
                              {condition.whenToSeeDoctor.map((w, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {relatedPosts.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-purple-500" />
                              Related Articles
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {relatedPosts.map((post) => (
                                <Link key={post.id} href={`/blog/${post.slug}`}>
                                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors space-y-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                                      {post.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {new Date(post.createdAt).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <Link href={`/shop?category=${condition.slug}`}>
                            <Button variant="primary" size="sm">
                              Shop Related Products
                            </Button>
                          </Link>
                          <Link href="/telehealth">
                            <Button variant="glass" size="sm">
                              Consult a Doctor
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {activeTab === "symptoms" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Describe your symptoms and we&apos;ll find matching medicines from our pharmacy catalog.
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. fever, headache, cough, skin rash..."
                  value={symptomSearch}
                  onChange={(e) => setSymptomSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSymptomSearch()}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSymptomSearch}
                disabled={symptomLoading || !symptomSearch.trim()}
              >
                {symptomLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </Card>

          {symptomLoading && <LoadingSkeleton />}

          {!symptomLoading && symptomResults !== null && (
            <>
              {symptomResults.length === 0 ? (
                <Card className="p-12 text-center space-y-3">
                  <p className="text-slate-500 font-medium">No medicines found for &ldquo;{symptomSearch}&rdquo;</p>
                  <p className="text-xs text-slate-400">
                    Try searching by a symptom like &ldquo;fever&rdquo;, &ldquo;cough&rdquo;, or &ldquo;headache&rdquo;.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {["fever", "headache", "cough", "malaria", "diabetes", "stomach", "skin", "allergy"].map(
                      (term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setSymptomSearch(term);
                            setTimeout(() => handleSymptomSearch(), 100);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors capitalize"
                        >
                          {term}
                        </button>
                      )
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Found <span className="font-bold text-slate-900 dark:text-white">{symptomResults.length}</span> product
                    {symptomResults.length !== 1 ? "s" : ""} for &ldquo;{symptomSearch}&rdquo;
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {symptomResults.map((product: any) => (
                      <Link key={product.id} href={`/shop/${product.slug}`}>
                        <Card hoverEffect className="p-4 space-y-3 h-full">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                                {product.name}
                              </h3>
                              {product.brand && (
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                  {product.brand.name}
                                </p>
                              )}
                            </div>
                            {product.requiresPrescription && (
                              <Badge variant="amber">Rx</Badge>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                              GHS {Number(product.price).toFixed(2)}
                            </span>
                            {product.stockQuantity > 0 ? (
                              <span className="text-[10px] font-medium text-emerald-600">In Stock</span>
                            ) : (
                              <span className="text-[10px] font-medium text-red-500">Out of Stock</span>
                            )}
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {symptomResults === null && !symptomLoading && (
            <Card className="p-12 text-center space-y-4">
              <div className="h-16 w-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <Pill className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Find medicines by symptoms</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Enter a symptom above and we&apos;ll match you with relevant products from our catalog.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["fever", "headache", "cough", "malaria", "diabetes", "stomach", "skin", "allergy", "pain", "asthma"].map(
                  (term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSymptomSearch(term);
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors capitalize"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "conditions" && !blogLoading && blogPosts.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-500" />
            Latest Health Articles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {blogPosts.slice(0, 6).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">{post.title}</p>
                  {post.summary && (
                    <p className="text-xs text-slate-500 line-clamp-1">{post.summary}</p>
                  )}
                  <div className="flex gap-1 pt-1">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Medical Disclaimer</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This information is for educational purposes only and is not a substitute for professional medical advice,
              diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any
              questions you may have regarding a medical condition.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
