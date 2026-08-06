import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BLOG_POSTS = [
  {
    title: "Understanding Antibiotic Resistance & Proper Dosage Adherence",
    slug: "understanding-antibiotic-resistance",
    content: `<h2>What is Antibiotic Resistance?</h2>
<p>Antibiotic resistance occurs when bacteria evolve to survive exposure to antibiotics that previously killed them. This is one of the most pressing public health threats globally.</p>

<h2>Why Complete Your Course?</h2>
<p>Even if you feel better after a few days, stopping antibiotics early can allow surviving bacteria to develop resistance. Always complete the full prescribed course.</p>

<h2>Common Mistakes to Avoid</h2>
<ul>
<li>Stopping medication when symptoms improve</li>
<li>Sharing antibiotics with others</li>
<li>Using leftover antibiotics for new illnesses</li>
<li>Not following dosage instructions</li>
<li>Demanding antibiotics for viral infections</li>
</ul>

<h2>What You Can Do</h2>
<p>Only take antibiotics prescribed by a qualified healthcare professional. Never demand antibiotics for viral infections like the common cold or flu.</p>

<h2>How Jumarald Helps</h2>
<p>Our pharmacists provide clear dosage instructions with every prescription. We also offer medication reminders through WhatsApp to help you stay on track.</p>`,
    summary: "Why completing your prescribed course of antibiotics is essential to prevent bacterial mutation and treatment failure.",
    author: "Dr. Chioma Nwachukwu, PharmD",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    tags: ["Antibiotics", "Health Tips", "Medication Safety"],
  },
  {
    title: "Managing Diabetes in Ghana: A Complete Guide",
    slug: "managing-diabetes-ghana",
    content: `<h2>Diabetes in Ghana</h2>
<p>Diabetes affects approximately 1 million Ghanaians, with Type 2 diabetes being the most common form. Proper management is crucial to prevent complications.</p>

<h2>Understanding Blood Sugar Levels</h2>
<p>Normal fasting blood sugar is below 5.6 mmol/L. Pre-diabetes is 5.6-6.9 mmol/L, and diabetes is 7.0 mmol/L or higher.</p>

<h2>Essential Management Tools</h2>
<ul>
<li>Blood glucose monitor - Check levels regularly</li>
<li>Test strips - Keep a steady supply</li>
<li>Insulin (if prescribed) - Proper storage is critical</li>
<li>Medication - Take as prescribed</li>
</ul>

<h2>Diet Tips for Ghanaians</h2>
<p>Reduce intake of white rice, white bread, and sugary drinks. Replace with brown rice, whole grain bread, and water. Portion control is key.</p>

<h2>Cold Chain Storage</h2>
<p>Insulin must be stored between 2°C-8°C. Jumarald ensures cold chain delivery for all insulin products across Greater Accra.</p>`,
    summary: "Comprehensive guide to managing diabetes in Ghana, including blood sugar monitoring, diet tips, and cold-chain insulin storage.",
    author: "Dr. Adebayo Ogunlesi, MD",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80",
    tags: ["Diabetes", "Chronic Disease", "Health Tips"],
  },
  {
    title: "Malaria Prevention: What Every Family in Prampram Should Know",
    slug: "malaria-prevention-prampram",
    content: `<h2>Malaria in Ghana</h2>
<p>Malaria remains the leading cause of outpatient visits in Ghana. Children under 5 and pregnant women are most vulnerable.</p>

<h2>Prevention is Better Than Cure</h2>
<ul>
<li>Use insecticide-treated mosquito nets (ITNs) every night</li>
<li>Apply insect repellent containing DEET</li>
<li>Wear long sleeves and trousers at dusk and dawn</li>
<li>Clear stagnant water around your home</li>
<li>Use window and door screens</li>
</ul>

<h2>Recognizing Malaria Symptoms</h2>
<p>Fever, chills, headache, vomiting, and body aches are common symptoms. If fever persists for more than 2 days, seek medical attention immediately.</p>

<h2>Treatment Options</h2>
<p>Artemether-Lumefantrine (Coartem) is the first-line treatment for uncomplicated malaria. Available without prescription at Jumarald Pharmacy.</p>

<h2>When to Seek Emergency Care</h2>
<p>Severe malaria can be fatal. Go to the hospital immediately if you experience: high fever, convulsions, difficulty breathing, or severe weakness.</p>`,
    summary: "Essential malaria prevention strategies and treatment options for families in Prampram and Greater Accra.",
    author: "Philip Bruce-Tagoe, Superintendent Pharmacist",
    imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80",
    tags: ["Malaria", "Prevention", "Family Health"],
  },
  {
    title: "Hypertension: The Silent Killer Affecting Ghanaian Adults",
    slug: "hypertension-silent-killer",
    content: `<h2>The Hidden Danger</h2>
<p>Hypertension affects approximately 1 in 3 adults in Ghana, yet many don't know they have it. It's called the "silent killer" because it often has no symptoms.</p>

<h2>What is Normal Blood Pressure?</h2>
<p>Normal: Below 120/80 mmHg<br/>Elevated: 120-129/80 mmHg<br/>High (Stage 1): 130-139/80-89 mmHg<br/>High (Stage 2): 140+/90+ mmHg</p>

<h2>Lifestyle Changes That Help</h2>
<ul>
<li>Reduce salt intake (max 5g per day)</li>
<li>Exercise 30 minutes daily</li>
<li>Maintain healthy weight (BMI 18.5-24.9)</li>
<li>Limit alcohol consumption</li>
<li>Quit smoking</li>
<li>Manage stress</li>
</ul>

<h2>Medication Adherence</h2>
<p>If prescribed blood pressure medication, take it every day as directed. Missing doses can cause dangerous spikes in blood pressure.</p>

<h2>Free Blood Pressure Checks</h2>
<p>Jumarald Pharmacy offers free blood pressure monitoring every Saturday from 9AM-12PM at our Prampram location.</p>`,
    summary: "Understanding hypertension, its risks, and how to manage it through lifestyle changes and medication adherence.",
    author: "Dr. Kofi Mensah, Cardiologist",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
    tags: ["Hypertension", "Heart Health", "Prevention"],
  },
  {
    title: "Child Health: Vaccination Schedule Every Parent Should Follow",
    slug: "child-health-vaccination-schedule",
    content: `<h2>Why Vaccinations Matter</h2>
<p>Vaccinations protect children from serious diseases like measles, polio, and meningitis. Ghana's Expanded Programme on Immunization (EPI) provides free vaccines at health centers.</p>

<h2>Ghana's Vaccination Schedule</h2>
<ul>
<li>Birth: BCG (Tuberculosis), OPV 0, Hepatitis B 0</li>
<li>6 weeks: OPV 1, Penta 1, PCV 1, Rotavirus 1</li>
<li>10 weeks: OPV 2, Penta 2, PCV 2, Rotavirus 2</li>
<li>14 weeks: OPV 3, Penta 3, PCV 3, Rotavirus 3</li>
<li>9 months: Measles-Rubella 1, Yellow Fever</li>
<li>15 months: Measles-Rubella 2, Meningitis A</li>
</ul>

<h2>Common Concerns</h2>
<p>Mild fever after vaccination is normal. Give paracetamol as directed by your healthcare provider. Keep the child hydrated and monitor for 48 hours.</p>

<h2>What Jumarald Offers</h2>
<p>We stock pediatric formulations of paracetamol, ORS, and children's vitamins to support your child's health alongside vaccinations.</p>`,
    summary: "Complete guide to Ghana's childhood vaccination schedule and how to support your child's immune health.",
    author: "Dr. Amina Hassan, Pediatrician",
    imageUrl: "https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=800&q=80",
    tags: ["Child Health", "Vaccination", "Prevention"],
  },
];

async function main() {
  console.log("Seeding blog posts...");

  for (const post of BLOG_POSTS) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (!existing) {
      await prisma.blogPost.create({ data: post });
      console.log(`Created blog post: ${post.title}`);
    } else {
      console.log(`Blog post already exists: ${post.title}`);
    }
  }

  console.log("Blog seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
