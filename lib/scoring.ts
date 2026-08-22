export const SCORE_POINTS_PER_ACTIVITY = 3

export const ATTENDANCE_SCORE_ACTIVITY = {
  key: "event_attendance",
  label: "Attendance at an Event",
} as const

export const EVENT_SCORE_ACTIVITIES = [
  { key: "event_active_participation", label: "Active Participation in a SIGHT Event" },
  { key: "event_preparation_logistics", label: "Helping with Event Preparation / Logistics" },
  { key: "event_organizing_team", label: "Being Part of an Event Organizing Team" },
] as const

export const GENERAL_SCORE_ACTIVITIES = [
  { key: "important_task_responsibility", label: "Taking Responsibility for an Important Task" },
  { key: "accepted_activity_idea", label: "Proposing an Activity Idea that is Accepted" },
  { key: "accepted_project_idea", label: "Proposing a Project Idea that is Accepted" },
  { key: "humanitarian_project_contribution", label: "Contributing to the Development of a Humanitarian Project" },
  { key: "group_representation", label: "Representing the SIGHT Group in a Competition / Congress" },
  { key: "competition_award_win", label: "Winning a Competition / Award" },
] as const

export const ALL_SCORE_ACTIVITIES = [ATTENDANCE_SCORE_ACTIVITY, ...EVENT_SCORE_ACTIVITIES, ...GENERAL_SCORE_ACTIVITIES] as const

export function getMemberLevel(score: number) {
  if (score >= 93) return "Changemaker Member"
  if (score >= 63) return "Gold Member"
  if (score >= 42) return "Silver Member"
  if (score >= 27) return "Bronze Member"
  if (score >= 12) return "Active Member"
  return "Member"
}
