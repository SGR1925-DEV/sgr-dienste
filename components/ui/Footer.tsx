import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto py-4 text-center text-xs text-slate-400">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span>© 2025 SG Ruwertal 1925 e.V.</span>
        <span className="text-slate-300">•</span>
        <Link href="/legal/impressum" className="hover:text-blue-600">
          Impressum
        </Link>
        <span className="text-slate-300">•</span>
        <Link href="/legal/datenschutz" className="hover:text-blue-600">
          Datenschutz
        </Link>
      </div>
    </footer>
  );
}
