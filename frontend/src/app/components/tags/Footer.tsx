export default function Footer() {
  return (
    <footer className="bg-black/60 border-t border-white/10 py-8 text-center text-xs text-white/40">
      <div className="max-w-7xl mx-auto px-4 space-y-2">
        <p>&copy; {new Date().getFullYear()} HorseRacing Management System. All rights reserved.</p>
        <p className="text-[10px] text-slate-600">Recreated dynamically in React TypeScript & Spring Boot.</p>
      </div>
    </footer>
  );
}
