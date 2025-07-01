// pages/api/process.js
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuth } from "@clerk/nextjs/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Standardized price list
const priceList = [
  {
    id: "kobberkabel_per_m",
    name: "kobberkabel",
    description: "Kobberkabel for ringjord og jording",
    unit: "m",
    unitCost: 20
  },
  {
    id: "jordpresseklemme_stk",
    name: "jordpresseklemme",
    description: "Jordpresseklemme",
    unit: "stk",
    unitCost: 50
  },
  {
    id: "stikkontakt_32a_3fas_stk",
    name: "32A 3-fas stikkontakt",
    description: "Stikkontakt 32A, 3-fase",
    unit: "stk",
    unitCost: 200
  },
  {
    id: "stikkontakt_16a_3fas_stk",
    name: "16A 3-fas stikkontakt",
    description: "Stikkontakt 16A, 3-fase",
    unit: "stk",
    unitCost: 150
  },
  {
    id: "sg_artes_utelys_stk",
    name: "SG Artes utelys",
    description: "Utelys SG Artes",
    unit: "stk",
    unitCost: 600
  },
  {
    id: "ip44_stikkontakt_stk",
    name: "IP44 stikkontakt",
    description: "Stikkontakt IP44",
    unit: "stk",
    unitCost: 100
  },
  {
    id: "ip55_bryter_stk",
    name: "IP55 bryter",
    description: "Bryter IP55",
    unit: "stk",
    unitCost: 120
  },
  {
    id: "bryter_stk",
    name: "bryter",
    description: "Standard bryter",
    unit: "stk",
    unitCost: 80
  },
  {
    id: "sikringsskap_stk",
    name: "sikringsskap",
    description: "Sikringsskap for montering på gulv",
    unit: "stk",
    unitCost: 2500
  },
  {
    id: "jfa_3fas_16a_stk",
    name: "JFA 3-fas 16A",
    description: "JFA 3-fase 16A",
    unit: "stk",
    unitCost: 150
  },
  {
    id: "jfa_3fas_32a_stk",
    name: "JFA 3-fas 32A",
    description: "JFA 3-fase 32A",
    unit: "stk",
    unitCost: 250
  },
  {
    id: "jfa_2fas_16a_stk",
    name: "JFA 2-fas 16A",
    description: "JFA 2-fase 16A",
    unit: "stk",
    unitCost: 100
  },
  {
    id: "overspenningsvern_stk",
    name: "overspenningsvern",
    description: "Overspenningsvern",
    unit: "stk",
    unitCost: 800
  },
  {
    id: "hovedsikring_80a_stk",
    name: "80A hovedsikring",
    description: "Hovedsikring 80A",
    unit: "stk",
    unitCost: 300
  },
  {
    id: "astrour_timer_stk",
    name: "astrour",
    description: "Astrour styrer utelys",
    unit: "stk",
    unitCost: 400
  },
  {
    id: "lyskaster_stk",
    name: "lyskaster",
    description: "Lyskaster for utendørs montering",
    unit: "stk",
    unitCost: 1000
  },
  {
    id: "glmaox_i60_armatur_stk",
    name: "Glmaox i60 armatur",
    description: "Glmaox i60 lysarmatur for innvendig montering",
    unit: "stk",
    unitCost: 600
  },
  {
    id: "kabelror_110mm_per_m",
    name: "kabelrør 110 mm",
    description: "Kabelrør 110 mm per meter",
    unit: "m",
    unitCost: 30
  },
  {
    id: "kabelror_50mm_per_m",
    name: "kabelrør 50 mm",
    description: "Kabelrør 50 mm per meter",
    unit: "m",
    unitCost: 20
  },
  {
    id: "trekkeror_25mm_per_m",
    name: "trekkerør 25 mm",
    description: "Trekkerør 25 mm per meter",
    unit: "m",
    unitCost: 15
  },
  {
    id: "landbruksarmatur_stk",
    name: "landbruksarmatur",
    description: "Landbruksarmatur 1500 mm, 7500 lumen, 4000 K",
    unit: "stk",
    unitCost: 1200
  },
  {
    id: "arbeid_per_time",
    name: "arbeid",
    description: "Arbeid per time",
    unit: "time",
    unitCost: 700
  }
];

export default async function handler(req, res) {
  const { userId } = getAuth(req);
  if (!userId) {
    console.log("Unauthorized attempt to call /api/process");
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    console.log(`Method ${req.method} not allowed on /api/process`);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, url, batchCode } = req.body;
  if (!name || !url || !batchCode) {
    console.log("Bad request to /api/process, missing fields:", req.body);
    return res.status(400).json({ error: "Missing name, url or batchCode" });
  }

  // Build detailed system prompt
  const itemLines = priceList
    .map(
      (i) =>
        `• id: "${i.id}", name: "${i.name}", description: "${i.description}", unit: "${i.unit}", unitCost: ${i.unitCost}`
    )
    .join("\n");

  const systemPrompt = `
You are an expert electrician with 15+ years of experience.
Inputs provided to you:
- name: filename of the image.
- url: publicly accessible URL of the image showing an electrical component or installation needing repair.
- batchCode: unique identifier for this repair session.

You have this standardized price list (unitCost in NOK):
${itemLines}

When given the image URL, you must:
1. Analyze the image to identify repair or replacement needs.
2. For each need, choose one item from the price list by its "id" and determine an integer quantity.
3. Compute totalCost = quantity × unitCost.
4. Sum all totalCost values as totalEstimate.

Output ONLY valid JSON matching this schema exactly:
\`\`\`json
{
  "schemaVersion": "1.0",
  "batchCode": "<same as input>",
  "items": [
    {
      "itemId": "<id from priceList>",
      "name": "<name from priceList>",
      "description": "<description from priceList>",
      "unit": "<unit from priceList>",
      "quantity": <integer>,
      "unitCost": <number>,
      "totalCost": <number>
    },
    ...
  ],
  "totalEstimate": <claculate, number>
}
\`\`\`

Do NOT include any extra keys, commentary, or markdown.
Example:
\`\`\`json
{
  "schemaVersion": "1.0",
  "batchCode": "ABC123",
  "items": [
    {
      "itemId": "kobberkabel_per_m",
      "name": "kobberkabel",
      "description": "Kobberkabel for ringjord og jording",
      "unit": "m",
      "quantity": 10,
      "unitCost": 20,
      "totalCost": 200
    },
    {
      "itemId": "arbeid_per_time",
      "name": "arbeid",
      "description": "Arbeid per time",
      "unit": "time",
      "quantity": 2,
      "unitCost": 700,
      "totalCost": 1400
    }
  ],
  "totalEstimate": 1600
}
\`\`\`
`.trim();

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: `name: ${name}` },
        { type: "text", text: `batchCode: ${batchCode}` },
        { type: "image_url", image_url: { url } }
      ]
    }
  ];

  let bill;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages,
      response_format: { type: "json_object" }
    });
    bill = JSON.parse(response.choices[0].message.content);
    console.log("OpenAI returned bill:", bill);
  } catch (err) {
    console.error("OpenAI request failed:", err);
    return res.status(500).json({ error: "OpenAI request failed" });
  }

  // Save to MongoDB
  const record = {
    userId,
    batchCode,
    name,
    url,
    items: bill.items,
    totalEstimate: bill.totalEstimate,
    createdAt: new Date()
  };
  try {
    const { db } = await connectToDatabase();
    const invoices = db.collection("invoices");
    await invoices.insertOne(record);
    console.log("Saved invoice record:", record);
  } catch (err) {
    console.error("Database insert failed:", err);
    return res.status(500).json({ error: "Database insert failed" });
  }

  console.log("Sending response to frontend:", {
    items: bill.items,
    totalEstimate: bill.totalEstimate
  });
  return res.status(200).json({
    items: bill.items,
    totalEstimate: bill.totalEstimate
  });
}
