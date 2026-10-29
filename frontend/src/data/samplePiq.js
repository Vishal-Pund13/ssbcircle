// A made-up aspirant for testing the PIQ form and its analysis locally.
// PiqPage only offers it in dev builds, so it never reaches real users.
// Detailed on purpose: the analysis needs enough material to ask from.

export const SAMPLE_PIQ = {
  selection_board: '18 SSB Bhopal', batch_no: '42', chest_no: '17', roll_no: '1209384',
  name: 'Aditya Rawat', father_name: 'Suresh Singh Rawat',
  max_residence: 'Pauri, Uttarakhand', max_population: '25,000',
  present_residence: 'Dehradun, Uttarakhand', present_population: '8,00,000',
  permanent_residence: 'Pauri, Uttarakhand', permanent_population: '25,000', is_district_hq: 'Yes',
  state_district: 'Uttarakhand / Pauri Garhwal', religion: 'Hindu', category: 'General', mother_tongue: 'Garhwali',
  dob: '2003-04-12', marital_status: 'Single',
  parents_alive: 'Both alive', age_at_parent_death: '',
  family: [
    { relation: 'Father', education: 'B.A.', occupation: 'Retired Subedar, Garhwal Rifles; now runs a small hardware shop', income: '35,000' },
    { relation: 'Mother', education: '10th', occupation: 'Homemaker', income: '' },
    { relation: 'Guardian', education: '', occupation: '', income: '' },
    { relation: 'Elder Brother / Sister', education: 'B.Sc. Nursing', occupation: 'Staff nurse, AIIMS Rishikesh', income: '45,000' },
    { relation: 'Elder Brother / Sister', education: '', occupation: '', income: '' },
    { relation: 'Younger Brother / Sister', education: 'Class 11 (studying)', occupation: 'Student', income: '' },
    { relation: 'Younger Brother / Sister', education: '', occupation: '', income: '' },
  ],
  education: [
    { level: 'Matric / Hr. Sec.', qualification: '10th', institution: 'Kendriya Vidyalaya, Pauri', board: 'CBSE', year: '2019',
      marks: '88%', medium: 'English', boarder: 'Day scholar', achievement: 'School vice-captain; 1st in district science quiz' },
    { level: '10+2 Equivalent', qualification: '12th (PCM)', institution: 'Kendriya Vidyalaya, Pauri', board: 'CBSE', year: '2021',
      marks: '81%', medium: 'English', boarder: 'Day scholar', achievement: '' },
    { level: 'Graduation', qualification: 'B.Tech (Civil Engineering)', institution: 'Graphic Era University, Dehradun', board: 'Graphic Era University', year: '2025',
      marks: '7.4 CGPA', medium: 'English', boarder: 'Hosteller', achievement: 'Final-year project on landslide-safe retaining walls for hill roads' },
    { level: 'Post-Graduation / Professional', qualification: '', institution: '', board: '', year: '',
      marks: '', medium: '', boarder: '', achievement: '' },
  ],
  age: '22', height_m: '1.76', weight_kg: '68',
  present_occupation: 'Preparing for CDS; part-time maths tutor', personal_income: '8,000',
  ncc_trained: 'Yes', ncc_total_training: '2 years', ncc_wing: 'Army', ncc_division: 'Senior Division', ncc_certificate: 'B certificate (Grade A)',
  sports: [
    { name: 'Football', duration: '6 years', represented: 'University team', achievement: 'Runners-up, inter-university north zone 2024' },
    { name: 'Cross-country running', duration: '4 years', represented: 'School', achievement: 'District level, 3rd place' },
  ],
  hobbies: 'Trekking in the Garhwal hills, reading military history, sketching',
  extracurricular: [
    { activity: 'College adventure club', duration: '3 years', achievement: 'Led a 12-member trek to Kedarkantha' },
    { activity: 'Blood donation camps', duration: '2 years', achievement: 'Organised 2 camps on campus' },
  ],
  positions_ncc: 'Corporal in NCC unit',
  positions_other: 'Sports secretary, college student council (final year)',
  commission_nature: 'Permanent Commission', service_choice: 'Army, Navy, Air Force',
  chances_availed: 'CDS: 1',
  previous_interviews: [
    { entry_type: 'CDS (IMA)', ssb_place: '21 SSB Bhopal', date: 'March 2025', chest_batch: 'Chest 23 / Batch 11 — screened in, conference out' },
  ],
};
