/**
 * Utility functions for date formatting and parsing
 * Handles conversion between ISO dates (YYYY-MM-DD) and display format (e.g., "So, 06.12.")
 */

/**
 * Parst ein Datum aus dem Format "So, 06.12." oder "Mo, 14.12."
 * Gibt ein Date-Objekt zurück, das für Vergleiche verwendet werden kann
 * Behandelt Jahreswechsel mit Heuristik (ohne Jahresinfo im String)
 */
export const parseMatchDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // Versuche Format "Tag, TT.MM." zu parsen
  const match = dateString.match(/(\d{2})\.(\d{2})\.?/);
  if (!match) return null;
  
  const day = parseInt(match[1], 10);
  const monthNum = parseInt(match[2], 10); // 1-12
  const month = monthNum - 1; // Monate sind 0-indexiert in JS Date (0-11)
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentYear = now.getFullYear();
  
  const baseDate = new Date(currentYear, month, day);
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = (baseDate.getTime() - now.getTime()) / dayMs;

  // Wenn das Datum sehr weit in der Zukunft liegt, ist es wahrscheinlich letztes Jahr gewesen.
  // Wenn es sehr weit in der Vergangenheit liegt, ist es wahrscheinlich nächstes Jahr.
  const thresholdDays = 270; // ca. 9 Monate
  if (diffDays > thresholdDays) {
    return new Date(currentYear - 1, month, day);
  }
  if (diffDays < -thresholdDays) {
    return new Date(currentYear + 1, month, day);
  }

  return baseDate;
};

/**
 * Formatiert Datum für Anzeige (bereinigt Formatierung)
 * Input: "So, 06.12." oder "So., 6.12.." -> Output: "So, 06.12."
 * Entfernt doppelte Punkte, stellt korrektes Format sicher
 */
export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Entferne doppelte Punkte überall
  let cleaned = dateString.replace(/\.\.+/g, '.').trim();
  
  // Stelle sicher, dass nach dem Komma ein Leerzeichen folgt
  cleaned = cleaned.replace(/,\s*/, ', ');
  
  // Extrahiere Tag-Namen (alles vor dem Komma) und entferne Punkt am Ende des Tags
  const parts = cleaned.split(',');
  if (parts.length >= 2) {
    const dayName = parts[0].trim().replace(/\.$/, ''); // Tag ohne Punkt
    const datePart = parts[1].trim();
    
    // Extrahiere Tag und Monat aus dem Datum
    const dateMatch = datePart.match(/(\d{1,2})\.(\d{1,2})\.?/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      return `${dayName}, ${day}.${month}.`;
    }
  }
  
  // Fallback: Versuche das Datum direkt zu parsen (falls kein Komma vorhanden)
  const dateMatch = cleaned.match(/(\d{1,2})\.(\d{1,2})\.?/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    return `${day}.${month}.`;
  }
  
  // Falls nichts geparst werden kann, gib bereinigte Version zurück
  return cleaned.replace(/\.$/, '') + '.';
};

/**
 * Extrahiert Tag und Datum für die kleine Datumsanzeige
 */
export const getDateParts = (dateString: string): { dayName: string; date: string } => {
  const formatted = formatDisplayDate(dateString);
  const parts = formatted.split(', ');
  
  if (parts.length >= 2) {
    return {
      dayName: parts[0],
      date: parts[1]
    };
  }
  
  // Fallback: versuche zu splitten
  const match = dateString.match(/(\d{2})\.(\d{2})\.?/);
  if (match) {
    return {
      dayName: '',
      date: `${match[1]}.${match[2]}`
    };
  }
  
  return { dayName: '', date: dateString };
};

/**
 * Konvertiert ISO-Datum (YYYY-MM-DD) zu Display-Format (z.B. "Sa, 06.12.")
 * Input: "2025-12-06" -> Output: "Sa, 06.12."
 */
export const formatDateForDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = date.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', ''); // "So" statt "So."
  const dateNum = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }); // "06.12."
  return `${day}, ${dateNum}`; // "So, 06.12."
};

/**
 * Konvertiert Display-Format zu ISO-Datum (YYYY-MM-DD)
 * Input: "Sa, 06.12." -> Output: "2025-12-06" (Versucht aktuelles/nächstes Jahr zu raten)
 */
export const parseDisplayDateToISO = (displayDate: string): string => {
  if (!displayDate) return '';
  
  // Versuche Format "Tag, TT.MM." zu parsen
  const match = displayDate.match(/(\d{2})\.(\d{2})\.?/);
  if (!match) return ''; // Fallback: leer lassen, Admin muss neu wählen

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  
  const now = new Date();
  let year = now.getFullYear();
  
  // Wenn der Monat im Datum kleiner ist als der aktuelle Monat minus Puffer, 
  // gehen wir davon aus, dass es nächstes Jahr ist (z.B. im Dez für Jan planen)
  if (month < now.getMonth() + 1 - 2) {
    year++;
  }

  // ISO String bauen (YYYY-MM-DD)
  const isoMonth = month.toString().padStart(2, '0');
  const isoDay = day.toString().padStart(2, '0');
  return `${year}-${isoMonth}-${isoDay}`;
};

/**
 * Konvertiert ISO-Datum (YYYY-MM-DD) zu deutschem Format (DD.MM.YYYY)
 * Input: "2025-12-06" -> Output: "06.12.2025"
 */
export const formatISOToGerman = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate + 'T00:00:00'); // Füge Zeit hinzu, um Zeitzonenprobleme zu vermeiden
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

/**
 * Konvertiert deutsches Format (DD.MM.YYYY) zu ISO-Datum (YYYY-MM-DD)
 * Input: "06.12.2025" -> Output: "2025-12-06"
 */
export const parseGermanToISO = (germanDate: string): string => {
  if (!germanDate) return '';
  
  // Versuche Format "DD.MM.YYYY" zu parsen
  const match = germanDate.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) return '';
  
  const day = match[1];
  const month = match[2];
  const year = match[3];
  
  return `${year}-${month}-${day}`;
};

/**
 * Konvertiert ISO-Datum-String (YYYY-MM-DD) zu Date-Objekt
 * Input: "2025-12-06" -> Output: Date object
 */
export const isoStringToDate = (isoString: string): Date | undefined => {
  if (!isoString) return undefined;
  const date = new Date(isoString + 'T00:00:00');
  return isNaN(date.getTime()) ? undefined : date;
};

/**
 * Konvertiert Date-Objekt zu ISO-Datum-String (YYYY-MM-DD)
 * Input: Date object -> Output: "2025-12-06"
 */
export const dateToISOString = (date: Date | undefined): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generiert iCalendar (.ics) Format für Kalenderexport
 * @param matches Array von Matches die exportiert werden sollen
 * @returns iCalendar Format als String
 */
export const generateICalendar = (matches: Array<{
  id: number;
  opponent: string;
  date: string;
  time: string;
  location: string;
  team?: string | null;
}>): string => {
  const formatDateTime = (date: Date, time: string): string => {
    // Parse time (z.B. "14:30" oder "14:30 - Ende")
    const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return '';
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    const dt = new Date(date);
    dt.setHours(hours, minutes, 0, 0);
    
    // Format: YYYYMMDDTHHMMSS (iCalendar Format)
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    const hour = dt.getHours().toString().padStart(2, '0');
    const minute = dt.getMinutes().toString().padStart(2, '0');
    const second = dt.getSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}T${hour}${minute}${second}`;
  };

  const formatDateTimeEnd = (date: Date, time: string): string => {
    // Endzeit: Standardmäßig 2,5 Stunden nach Start
    const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return '';
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    const dt = new Date(date);
    dt.setHours(hours + 2, minutes + 30, 0, 0); // +2.5 Stunden
    
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    const hour = dt.getHours().toString().padStart(2, '0');
    const minute = dt.getMinutes().toString().padStart(2, '0');
    const second = dt.getSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}T${hour}${minute}${second}`;
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
  };

  let ics = 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//SG Ruwertal//Dienstplan//DE\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';

  matches.forEach(match => {
    const matchDate = parseMatchDate(match.date);
    if (!matchDate) return;

    const dtStart = formatDateTime(matchDate, match.time);
    const dtEnd = formatDateTimeEnd(matchDate, match.time);
    
    if (!dtStart || !dtEnd) return;

    const summary = match.team 
      ? `Heimspiel ${match.team} vs. ${match.opponent}`
      : `Heimspiel vs. ${match.opponent}`;
    
    const description = `Dienstplan: ${match.opponent}\nOrt: ${match.location || 'Sportplatz Kasel'}`;
    const location = match.location || 'Sportplatz Kasel';

    ics += 'BEGIN:VEVENT\r\n';
    ics += `UID:match-${match.id}@sgruwertal.de\r\n`;
    ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
    ics += `DTSTART:${dtStart}\r\n`;
    ics += `DTEND:${dtEnd}\r\n`;
    ics += `SUMMARY:${escapeText(summary)}\r\n`;
    ics += `DESCRIPTION:${escapeText(description)}\r\n`;
    ics += `LOCATION:${escapeText(location)}\r\n`;
    ics += 'STATUS:CONFIRMED\r\n';
    ics += 'SEQUENCE:0\r\n';
    ics += 'END:VEVENT\r\n';
  });

  ics += 'END:VCALENDAR\r\n';
  return ics;
};

/**
 * Download-Helper für iCalendar Export
 * Optimiert für mobile Geräte: Öffnet direkt im Kalender statt Download
 */
export const downloadICalendar = (matches: Array<{
  id: number;
  opponent: string;
  date: string;
  time: string;
  location: string;
  team?: string | null;
}>, filename: string = 'sgr-dienste-spiele.ics'): void => {
  const icsContent = generateICalendar(matches);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.style.display = 'none';
  
  // Mobile Detection: iOS, iPadOS, Android
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Auf mobilen Geräten: OHNE download Attribut, damit Browser die Datei direkt öffnet
    // iOS/iPadOS: Öffnet direkt den Kalender-Dialog
    // Android: Chrome erkennt .ics Dateien und öffnet Kalender-App
    link.setAttribute('target', '_blank');
  } else {
    // Auf Desktop: Mit download Attribut für expliziten Download
    link.download = filename;
  }
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup nach kurzer Verzögerung (für mobile Geräte wichtig)
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};
