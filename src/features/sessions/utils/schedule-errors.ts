/**
 * Maps internal generator/algorithm error messages to organiser-friendly
 * wording. Pure string mapping only — never changes what actually failed,
 * just how it's presented. Falls back to the raw message for anything not
 * recognised, so unexpected errors are never silently swallowed.
 */

const NO_VALID_CANDIDATE_MESSAGE = [
  "Couldn't generate another valid match.",
  '',
  'Try one of the following:',
  '• Unlock previous matches.',
  '• Reduce scheduling constraints.',
  '• Add more players.',
].join('\n')

const GENERIC_GENERATOR_MESSAGE =
  'Something went wrong while generating this match. Please try again or add more players.'

export function friendlyScheduleErrorMessage(rawMessage: string): string {
  if (/all \d+ candidate\(s\) were rejected/i.test(rawMessage)) {
    return NO_VALID_CANDIDATE_MESSAGE
  }
  if (rawMessage.startsWith('generateTeams:')) {
    return GENERIC_GENERATOR_MESSAGE
  }
  return rawMessage
}
