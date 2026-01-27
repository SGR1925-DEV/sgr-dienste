export default function DatenschutzPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Datenschutzinformation</h1>
        <p>
          Mit Ihrem Antrag auf Aufnahme in unseren Verein oder der Nutzung
          unserer Online-Angebote (wie Sponsoring-Anfragen oder Newsletter)
          stellen Sie uns personenbezogene Daten zur Verfügung. Diese
          Informationen stellen wir Ihnen gemäß Art. 13, 14 DS-GVO im Folgenden
          zur Verfügung.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          1. Datenschutzrechtlich Verantwortlicher
        </h2>
        <p>
          Datenschutzrechtlich Verantwortlicher ist die Spielgemeinschaft
          Ruwertal 1925 e.V., vertreten durch den Vorstand. Sie erreichen uns
          per E-Mail unter:{" "}
          <a
            href="mailto:datenschutz@sgruwertal.de"
            className="text-blue-600 hover:underline"
          >
            datenschutz@sgruwertal.de
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          2. Rechtsgrundlage und Zweck der Erhebung und Verarbeitung
        </h2>
        <p>
          Wir verarbeiten Ihre Daten zu folgenden Zwecken und auf folgenden
          Rechtsgrundlagen:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Mitgliedschaft:</strong> Gemäß Art. 6 Abs. 1 (b) DS-GVO für
            die Organisation des Vereinslebens (Beitragseinzug, Meldungen an
            Verbände, Einladungen).
          </li>
          <li>
            <strong>Anfragen (Sponsoring/Kontakt):</strong> Gemäß Art. 6 Abs. 1
            (b) DS-GVO zur Bearbeitung Ihrer Anfrage und vorvertraglicher
            Maßnahmen.
          </li>
          <li>
            <strong>Newsletter:</strong> Gemäß Art. 6 Abs. 1 (a) DS-GVO auf Basis
            Ihrer freiwilligen Einwilligung.
          </li>
          <li>
            <strong>Öffentlichkeitsarbeit:</strong> Gemäß Art. 6 Abs. 1 (e)
            DS-GVO (berechtigtes Interesse) für Berichte über
            Vereinsaktivitäten.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          3. Welche personenbezogenen Daten verarbeiten wir?
        </h2>
        <p>
          Je nach Art der Beziehung (Mitglied, Sponsor, Interessent)
          verarbeiten wir:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stammdaten (Name, Adresse, Geburtsdatum)</li>
          <li>Kommunikationsdaten (E-Mail, Telefon)</li>
          <li>Firmendaten (bei Sponsoren)</li>
          <li>Vereinsdaten (Wettkampfdaten, Eintrittsdatum, Abteilung)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          4. Interne Empfänger der personenbezogenen Daten
        </h2>
        <p>
          Innerhalb des Vereins erhalten nur diejenigen Personen Zugriff auf
          Ihre Daten, die diese zur Erfüllung ihrer Aufgaben benötigen (z. B.
          Vorstand, Kassenwart, Abteilungsleiter, Trainer).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Externe Empfänger &amp; Dritte</h2>
        <p>
          Eine Weitergabe erfolgt nur, wenn dies gesetzlich vorgeschrieben oder
          für die Vereinszwecke erforderlich ist. Empfänger können sein:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sportverbände (für Pässe und Lizenzen)</li>
          <li>Versicherungen (Sportunfallversicherung)</li>
          <li>Banken (für den Beitragseinzug)</li>
          <li>
            IT-Dienstleister (für Webhosting und E-Mail-Versand, siehe Punkt 7
            &amp; 8)
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          6. Kontaktformulare &amp; Newsletter (Website-Funktionen)
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Kontakt- &amp; Sponsoringanfragen:</strong> Wenn Sie uns über
            Online-Formulare kontaktieren, speichern wir Ihre Angaben (Name,
            E-Mail, Firma, Anliegen) zwecks Bearbeitung der Anfrage. Diese Daten
            geben wir nicht ohne Ihre Einwilligung weiter.
          </li>
          <li>
            <strong>Newsletter:</strong> Wenn Sie sich für unseren Newsletter
            anmelden, verwenden wir Ihre E-Mail-Adresse ausschließlich für den
            Versand von Vereinsinformationen. Sie können diese Einwilligung
            jederzeit über den Abmeldelink im Newsletter oder per Nachricht an
            uns widerrufen.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. Versanddienstleister Resend Inc.</h2>
        <p>
          Für den Versand von Transaktions-E-Mails (z. B. Bestätigungen von
          Anfragen) und unseres Newsletters nutzen wir den Dienstleister Resend
          Inc., 2261 Market Street #4816, San Francisco, CA 94114, USA. Dabei
          werden Ihre E-Mail-Adresse und ggf. Ihr Name auf Servern von Resend in
          den USA verarbeitet. Wir haben mit dem Anbieter einen
          Auftragsverarbeitungsvertrag (Data Processing Addendum) geschlossen,
          der die Einhaltung europäischer Datenschutzstandards durch sogenannte
          Standardvertragsklauseln (SCCs) gewährleistet. Weitere Informationen
          zum Datenschutz bei Resend finden Sie unter:{" "}
          <a
            href="https://resend.com/legal/privacy-policy"
            className="text-blue-600 hover:underline"
          >
            https://resend.com/legal/privacy-policy
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">8. Hosting &amp; Datenbank</h2>
        <p>
          Diese Website wird bei <strong>Vercel Inc.</strong> gehostet und nutzt{" "}
          <strong>Supabase</strong> als Datenbankprovider. Beim Aufruf der
          Webseite erfasst der Webserver automatisch Logfiles (IP-Adresse,
          Datum, Uhrzeit, Browseranfrage), die für die Sicherheit und den
          Betrieb der Seite notwendig sind (Art. 6 Abs. 1 f DS-GVO). Diese Daten
          werden nach kurzer Zeit automatisch gelöscht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">9. Dauer der Speicherung</h2>
        <p>
          Wir löschen Ihre Daten, sobald sie für den Zweck der Verarbeitung
          nicht mehr benötigt werden. Mitgliedsdaten werden mit Beendigung der
          Mitgliedschaft gelöscht, sofern keine steuerrechtlichen
          Aufbewahrungsfristen (z. B. 10 Jahre für Buchungsbelege) entgegenstehen.
          Daten aus Anfragen werden gelöscht, sobald der Sachverhalt
          abschließend geklärt ist.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">10. Ihre Rechte</h2>
        <p>
          Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung,
          Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerruf
          erteilter Einwilligungen. Wenden Sie sich dazu bitte an:{" "}
          <a
            href="mailto:datenschutz@sgruwertal.de"
            className="text-blue-600 hover:underline"
          >
            datenschutz@sgruwertal.de
          </a>
          .
        </p>
      </section>
    </div>
  );
}
