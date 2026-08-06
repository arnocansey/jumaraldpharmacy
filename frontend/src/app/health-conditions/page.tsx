"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Pill, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

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
}

const conditions: Condition[] = [
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
  },
];

export default function DrugInfoPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  const categories = [...new Set(conditions.map((c) => c.category))];

  const filtered = conditions.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      <div className="text-left space-y-3">
        <Badge variant="emerald">Health Information Hub</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Common Health Conditions</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Evidence-based information about common conditions in Ghana. Always consult a healthcare professional for diagnosis and treatment.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conditions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.map((condition) => (
          <Card key={condition.id} className="overflow-hidden">
            <button
              onClick={() => setExpandedCondition(expandedCondition === condition.id ? null : condition.id)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{condition.name}</h2>
                  <Badge variant="emerald">{condition.category}</Badge>
                </div>
                <p className="text-sm text-slate-500 line-clamp-1">{condition.description}</p>
              </div>
              <ArrowRight className={`h-5 w-5 text-slate-400 transition-transform ${expandedCondition === condition.id ? "rotate-90" : ""}`} />
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
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
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
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
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
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
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
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

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
        ))}
      </div>

      <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Medical Disclaimer</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
              Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
