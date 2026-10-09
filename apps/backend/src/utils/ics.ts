export interface IcsEventOptions {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

const formatDateToIcs = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateIcsContent = (options: IcsEventOptions): string => {
  const now = formatDateToIcs(new Date());
  const start = formatDateToIcs(new Date(options.startDate));
  const end = formatDateToIcs(new Date(options.endDate));
  const cleanDesc = options.description.replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const cleanTitle = options.title.replace(/,/g, '\\,');
  const cleanLoc = options.location.replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusPulse//ACM SRMIST//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:campuspulse-${Date.now()}@srmist.edu.in`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${cleanLoc}`,
    options.url ? `URL:${options.url}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
};
