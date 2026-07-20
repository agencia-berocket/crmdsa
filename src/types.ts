export interface BatchContact {
  rowIndex: number; // 1-based index (header is 1, so data rows start at 2)
  university: string;
  studentOrganization: string;
  name: string;
  status: string;
  email: string;
  emailSent: string;
  notes: string;
  emailSentAlert?: string;
  emailReceivedAlert?: string;
  emailOpenedAlert?: string;
  dataEnvio?: string; // real timestamp of the last outbound send
  dataAbertura?: string; // real timestamp of the email open event
  dataRetorno?: string; // real timestamp of the reply/response event
  meetingConfirmationStatus?: string; // Google Calendar attendee responseStatus: "accepted" | "declined" | "tentative" | "needsAction"
  meetingDateTime?: string; // scheduled date/time of the booked Google Calendar meeting
  role?: string; // contact's role/title at the organization
  statusMeetings?: string; // meeting pipeline status: "New" | "Suggested Time" | "Scheduled" | "Completed"
  suggestedTimes?: string; // human-readable list of proposed meeting slots
  bookedTime?: string; // confirmed meeting date/time (mirrors meetingDateTime once booked)
  notesMeetings?: string; // notes specific to the meeting, separate from prospecting notes
  meetingConfirmation?: string; // friendly label mapped from Google Calendar attendee responseStatus
  meetingInvitationSentOn?: string; // timestamp the calendar invite was sent
}

export interface MeetingRow {
  rowIndex: number;
  name?: string;
  email: string;
  suggestedTimes: string;
  bookedTime: string;
  notes: string;
  status: string;
  emailSentAlert?: string;
  emailReceivedAlert?: string;
  emailOpenedAlert?: string;
  dataEnvio?: string; // real timestamp of the last outbound send
  dataAbertura?: string; // real timestamp of the email open event
  dataRetorno?: string; // real timestamp of the reply/response event
  meetingConfirmationStatus?: string; // Google Calendar attendee responseStatus: "accepted" | "declined" | "tentative" | "needsAction"
  meetingDateTime?: string; // scheduled date/time of the booked Google Calendar meeting
}

export interface GmailAlias {
  sendAsEmail: string;
  displayName: string;
  isDefault: boolean;
}

export interface TrackEvent {
  email: string;
  spreadsheetId: string;
  row: string;
  openedAt: string;
}

export interface MailTemplate {
  subject: string;
  body: string;
}

