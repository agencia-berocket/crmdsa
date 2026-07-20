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
}

export interface MeetingRow {
  rowIndex: number;
  email: string;
  suggestedTimes: string;
  bookedTime: string;
  notes: string;
  status: string;
  emailSentAlert?: string;
  emailReceivedAlert?: string;
  emailOpenedAlert?: string;
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

