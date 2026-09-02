// Fourth India pass — cross-referenced the full real NIRF 2025 University
// category top-100 table (already fetched in full during an earlier pass)
// against the current 109-school catalog and found 45 genuine gaps. One
// (Homi Bhabha National Institute) was deliberately excluded: it's a
// PhD/postgraduate-only deemed university for Dept. of Atomic Energy
// research institutes (TIFR, BARC Training School, etc.) with no
// undergraduate admissions at all, which doesn't fit this app's
// undergraduate-shortlisting use case despite being real and NIRF-ranked.
//
// baselineSelectivity uses the same selectivityFromRank formula already
// established in the program-rankings seed scripts, applied here to the
// general/overall selectivity since every entry has a real NIRF rank.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-india-round4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'NIRF (National Institutional Ranking Framework) 2025 — Universities category'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const SCHOOLS = [
  { name: 'Saveetha Institute of Medical and Technical Sciences', rank: 13, location: 'Chennai, Tamil Nadu', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences'], link: 'https://saveetha.com', requirements: ['NEET score', 'Class 12 board qualification'] },
  { name: 'Siksha O Anusandhan', rank: 15, location: 'Bhubaneswar, Odisha', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences', 'Engineering'], link: 'https://www.soa.ac.in', requirements: ['NEET/JEE score or own entrance test', 'Class 12 board qualification'] },
  { name: 'Indian Agricultural Research Institute', rank: 16, location: 'New Delhi', sectors: ['Research'], academicFields: ['Agriculture & Natural Resources'], link: 'https://www.iari.res.in', requirements: ['ICAR AIEEA score', 'Class 12 board qualification'] },
  { name: 'JSS Academy of Higher Education and Research', rank: 21, location: 'Mysuru, Karnataka', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences'], link: 'https://www.jssuni.edu.in', requirements: ['NEET score or own entrance test', 'Class 12 board qualification'] },
  { name: 'Kerala University', rank: 25, location: 'Thiruvananthapuram, Kerala', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.keralauniversity.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Kalasalingam Academy of Research and Education', rank: 28, location: 'Krishnankoil, Tamil Nadu', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering'], link: 'https://www.kalasalingam.ac.in', requirements: ['JEE or own entrance test', 'Class 12 board qualification'] },
  { name: 'Gauhati University', rank: 33, location: 'Guwahati, Assam', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://gauhati.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'University of Kashmir', rank: 34, location: 'Srinagar, Jammu and Kashmir', climateOverride: 'Cold', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://kashmiruniversity.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Bharathidasan University', rank: 36, location: 'Tiruchirappalli, Tamil Nadu', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.bdu.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Babasaheb Bhimrao Ambedkar University', rank: 37, location: 'Lucknow, Uttar Pradesh', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.bbau.ac.in', requirements: ['CUET score', 'Class 12 board qualification'] },
  { name: 'University of Madras', rank: 38, location: 'Chennai, Tamil Nadu', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.unom.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Calcutta University', rank: 39, location: 'Kolkata, West Bengal', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.caluniv.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Mahatma Gandhi University, Kottayam', rank: 43, location: 'Kottayam, Kerala', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.mgu.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Alagappa University', rank: 44, location: 'Karaikudi, Tamil Nadu', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.alagappauniversity.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Bharathiar University', rank: 46, location: 'Coimbatore, Tamil Nadu', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.b-u.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Jamia Hamdard', rank: 47, location: 'New Delhi', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences'], link: 'https://www.jamiahamdard.ac.in', requirements: ['NEET score or own entrance test', 'Class 12 board qualification'] },
  { name: 'Graphic Era University', rank: 48, location: 'Dehradun, Uttarakhand', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering', 'Computer Science & IT'], link: 'https://www.gehu.ac.in', requirements: ['JEE or own entrance test', 'Class 12 board qualification'] },
  { name: 'Datta Meghe Institute of Higher Education and Research', rank: 49, location: 'Wardha, Maharashtra', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences'], link: 'https://www.dmiher.edu.in', requirements: ['NEET score', 'Class 12 board qualification'] },
  { name: "King George's Medical University", rank: 50, location: 'Lucknow, Uttar Pradesh', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences'], link: 'https://www.kgmu.org', requirements: ['NEET score', 'Class 12 board qualification'] },
  { name: 'University of Jammu', rank: 51, location: 'Jammu, Jammu and Kashmir', climateOverride: 'Balanced', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.jammuuniversity.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: "SVKM's Narsee Monjee Institute of Management Studies", rank: 52, location: 'Mumbai, Maharashtra', sectors: ['Business'], academicFields: ['Business'], link: 'https://www.nmims.edu', requirements: ['NPAT (own entrance test)', 'Class 12 board qualification'] },
  { name: 'Sathyabama Institute of Science and Technology', rank: 53, location: 'Chennai, Tamil Nadu', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering'], link: 'https://www.sathyabama.ac.in', requirements: ['JEE or own entrance test', 'Class 12 board qualification'] },
  { name: 'Savitribai Phule Pune University', rank: 56, location: 'Pune, Maharashtra', climateOverride: 'Balanced', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences', 'Science & Technology / Research'], link: 'https://www.unipune.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Sri Ramachandra Institute of Higher Education and Research', rank: 60, location: 'Chennai, Tamil Nadu', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences'], link: 'https://www.sriramachandra.edu.in', requirements: ['NEET score', 'Class 12 board qualification'] },
  { name: 'Chettinad Academy of Research and Education', rank: 61, location: 'Chennai, Tamil Nadu', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences'], link: 'https://care.edu.in', requirements: ['NEET score', 'Class 12 board qualification'] },
  { name: 'Punjab Agricultural University', rank: 64, location: 'Ludhiana, Punjab', sectors: ['Research'], academicFields: ['Agriculture & Natural Resources'], link: 'https://www.pau.edu', requirements: ['ICAR AIEEA or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Bangalore University', rank: 65, location: 'Bengaluru, Karnataka', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://bangaloreuniversity.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Banasthali Vidyapith', rank: 66, location: 'Banasthali, Rajasthan', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://banasthali.org', requirements: ["Banasthali Aptitude Test (women's university)", 'Class 12 board qualification'] },
  { name: 'Sri Balaji Vidyapeeth', rank: 67, location: 'Puducherry', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences'], link: 'https://sbvu.ac.in', requirements: ['NEET score', 'Class 12 board qualification'] },
  { name: 'Shoolini University of Biotechnology and Management Sciences', rank: 69, location: 'Solan, Himachal Pradesh', climateOverride: 'Cold', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Science & Technology / Research', 'Business'], link: 'https://www.shooliniuniversity.com', requirements: ['Own entrance test / merit-based', 'Class 12 board qualification'] },
  { name: 'Vignan\'s Foundation for Science, Technology, and Research', rank: 70, location: 'Guntur, Andhra Pradesh', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering'], link: 'https://vignan.ac.in', requirements: ['JEE or own entrance test', 'Class 12 board qualification'] },
  { name: 'Mysore University', rank: 71, location: 'Mysuru, Karnataka', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://uni-mysore.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Tamil Nadu Agricultural University', rank: 73, location: 'Coimbatore, Tamil Nadu', sectors: ['Research'], academicFields: ['Agriculture & Natural Resources'], link: 'https://tnau.ac.in', requirements: ['ICAR AIEEA or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Bharath Institute of Higher Education and Research', rank: 76, location: 'Chennai, Tamil Nadu', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering', 'Medicine & Health Sciences'], link: 'https://www.bharathuniv.ac.in', requirements: ['JEE/NEET or own entrance test', 'Class 12 board qualification'] },
  { name: 'Central University of Punjab', rank: 77, location: 'Bathinda, Punjab', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.cup.edu.in', requirements: ['CUET score', 'Class 12 board qualification'] },
  { name: 'Tezpur University', rank: 79, location: 'Tezpur, Assam', sectors: ['Research'], academicFields: ['Humanities', 'Engineering'], link: 'https://www.tezu.ernet.in', requirements: ['CUET score', 'Class 12 board qualification'] },
  { name: 'NITTE', rank: 80, location: 'Mangaluru, Karnataka', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences', 'Engineering'], link: 'https://nitte.edu.in', requirements: ['NEET/JEE or own entrance test', 'Class 12 board qualification'] },
  { name: 'Jawaharlal Nehru Technological University', rank: 81, location: 'Hyderabad, Telangana', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering'], link: 'https://jntuh.ac.in', requirements: ['EAMCET/JEE or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Mizoram University', rank: 82, location: 'Aizawl, Mizoram', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://mzu.edu.in', requirements: ['CUET score', 'Class 12 board qualification'] },
  { name: 'Central University of Tamil Nadu', rank: 83, location: 'Thiruvarur, Tamil Nadu', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.cutn.ac.in', requirements: ['CUET score', 'Class 12 board qualification'] },
  { name: 'Acharya Nagarjuna University', rank: 84, location: 'Guntur, Andhra Pradesh', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.nagarjunauniversity.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Madurai Kamaraj University', rank: 85, location: 'Madurai, Tamil Nadu', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://mkuniversity.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'Central University of Rajasthan', rank: 89, location: 'Ajmer, Rajasthan', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.curaj.ac.in', requirements: ['CUET score', 'Class 12 board qualification'] },
  { name: 'Periyar University', rank: 94, location: 'Salem, Tamil Nadu', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.periyaruniversity.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
  { name: 'University of Agricultural Sciences, Bangalore', rank: 95, location: 'Bengaluru, Karnataka', sectors: ['Research'], academicFields: ['Agriculture & Natural Resources'], link: 'https://www.uasbangalore.edu.in', requirements: ['ICAR AIEEA or state entrance exam', 'Class 12 board qualification'] },
  { name: 'University of Lucknow', rank: 98, location: 'Lucknow, Uttar Pradesh', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences'], link: 'https://www.lkouniv.ac.in', requirements: ['CUET or state entrance exam', 'Class 12 board qualification'] },
]

let inserted = 0
let skipped = []

for (const school of SCHOOLS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${school.name} AND country = 'IN'`
  if (existing.length > 0) {
    skipped.push(school.name)
    continue
  }

  const climate = school.climateOverride ?? 'Warm'
  const baselineSelectivity = selectivityFromRank(school.rank)

  const [row] = await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields",
      "rankValue", "rankSource"
    )
    VALUES (
      ${school.name}, 'IN', ${school.location}, ${climate},
      ${JSON.stringify(school.sectors)}::jsonb, ${baselineSelectivity},
      ${'NIRF-ranked #' + school.rank + ' nationally (Universities category) — real placement/research strength varies by department.'},
      ${JSON.stringify(school.requirements)}::jsonb, ${school.link},
      ${JSON.stringify(school.academicFields)}::jsonb,
      ${school.rank}, ${RANK_SOURCE}
    )
    RETURNING id
  `
  console.log(`Added ${school.name} (IN), rank ${school.rank}, id ${row.id}`)
  inserted++
}

console.log(`\nInserted ${inserted} universities.`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
