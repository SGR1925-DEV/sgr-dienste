export default function ImpressumPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Impressum</h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Angaben gemäß § 5 TMG</h2>
        <p>
          Spielgemeinschaft Ruwertal 1925 e.V.
          <br />
          Am Sportplatz 8
          <br />
          54317 Kasel
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Vertreten durch</h2>
        <p>Daniel Schell (Schatzmeister)</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a
            href="mailto:kontakt@sgruwertal.de"
            className="text-blue-600 hover:underline"
          >
            kontakt@sgruwertal.de
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Registereintrag</h2>
        <p>Eintragung im Vereinsregister.</p>
        <p>Registergericht: Amtsgericht Wittlich</p>
        <p>Registernummer: VR 1453</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz: DE
          149885536
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Bankverbindung</h2>
        <p>Sparkasse Trier</p>
        <p>IBAN: DE80 5855 0130 0007 8001 62</p>
        <p>BIC: TRISDE55XXXX</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Technische Umsetzung &amp; Design</h2>
        <p>
          Diese Website wurde von einem externen Dienstleister erstellt. Der
          Dienstleister ist nicht für den Inhalt verantwortlich.
        </p>
        <p>j2 Webdesign</p>
        <p>
          E-Mail:{" "}
          <a
            href="mailto:info@j2web.de"
            className="text-blue-600 hover:underline"
          >
            info@j2web.de
          </a>
        </p>
        <p>
          Web:{" "}
          <a
            href="https://www.j2web.de"
            className="text-blue-600 hover:underline"
          >
            www.j2web.de
          </a>
        </p>
      </section>
    </div>
  );
}
