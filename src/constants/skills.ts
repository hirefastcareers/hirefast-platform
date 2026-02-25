/**
 * Canonical list of ticket/certification options for Industrial sectors (Engineering, Manufacturing).
 * Used in Rapid-Post "Required Tickets" and Express Apply "Which do you hold?" checklist.
 */
export const TICKET_OPTIONS = [
  'Forklift',
  'CSCS',
  'NVQ Level 2',
  'Welding Cert',
  'CNC Ops',
  'IPAF',
  'PASMA',
  'First Aid',
  'Manual Handling',
  'Confined Space',
  'CPCS',
  'Slinger/Signaller',
] as const

export type TicketId = (typeof TICKET_OPTIONS)[number]
