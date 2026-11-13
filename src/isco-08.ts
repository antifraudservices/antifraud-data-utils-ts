export const Isco08CodingSystem = 'http://www.ilo.org/public/english/bureau/stat/isco/isco08/' as const

/** ISCO-08 codings; ILO classification: https://isco.ilo.org/ */
function occupation<const Code extends string>(code:Code,display:string){
  return Object.freeze({system:Isco08CodingSystem,code,display})
}

/** Curated standard occupations, not the full classification; eligibility and access belong to consumers. */
export const Isco08Occupations=Object.freeze({
  SecondaryEducationTeacher:occupation('2330','Secondary Education Teachers'),
  Lawyer:occupation('2611','Lawyers'),
  GeneralOfficeClerk:occupation('4110','General Office Clerks'),
  MedicalDoctors:occupation('221','Medical Doctors'),
  GeneralistMedicalPractitioner:occupation('2211','Generalist Medical Practitioners'),
  SpecialistMedicalPractitioner:occupation('2212','Specialist Medical Practitioners'),
  NursingProfessional:occupation('2221','Nursing Professionals'),
  MidwiferyProfessional:occupation('2222','Midwifery Professionals'),
  ParamedicalPractitioner:occupation('2240','Paramedical Practitioners'),
  Veterinarian:occupation('2250','Veterinarians'),
  Dentist:occupation('2261','Dentists'),
  Biologist:occupation('2131','Biologists, Botanists, Zoologists and Related Professionals'),
  LifeScienceTechnician:occupation('3141','Life Science Technicians (excluding Medical)'),
  MedicalAndPathologyLaboratoryTechnician:occupation('3212','Medical and Pathology Laboratory Technicians'),
  VeterinaryTechnicianOrAssistant:occupation('3240','Veterinary Technicians and Assistants'),
  MedicalSecretary:occupation('3344','Medical Secretaries'),
  Receptionist:occupation('4226','Receptionists (general)'),
  AmbulanceWorker:occupation('3258','Ambulance Workers'),
  Firefighter:occupation('5411','Fire-fighters'),
  PoliceOfficer:occupation('5412','Police Officers'),
  SecurityGuard:occupation('5414','Security Guards'),
  OtherProtectiveServicesWorker:occupation('5419','Protective Services Workers Not Elsewhere Classified'),
  TravelAttendant:occupation('5111','Travel Attendants and Travel Stewards'),
  TransportConductor:occupation('5112','Transport Conductors'),
  TravelConsultantOrClerk:occupation('4221','Travel Consultants and Clerks'),
  StatisticalFinanceOrInsuranceClerk:occupation('4312','Statistical, Finance and Insurance Clerks'),
})

export type Isco08Occupation=typeof Isco08Occupations[keyof typeof Isco08Occupations]

/** Resolve an occupation code without interpreting it as a permission or accepting arbitrary role aliases. */
export function findIsco08Occupation(code:unknown):Isco08Occupation|undefined{
  if(typeof code!=='string')return undefined
  return Object.values(Isco08Occupations).find(coding=>coding.code===code.trim())
}
