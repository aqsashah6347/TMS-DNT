// TMS Frontend/task-system/src/Features/communications/components/ContactsDirectory.jsx
import { useEffect, useMemo, useState } from "react";
import { Search, Mail, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { useCommunicationsStore } from "../communicationsStore";

export default function ContactsDirectory() {
  const contacts = useCommunicationsStore((s) => s.contacts);
  const contactsTotal = useCommunicationsStore((s) => s.contactsTotal);
  const fetchContacts = useCommunicationsStore((s) => s.fetchContacts);
  const isLoadingContacts = useCommunicationsStore((s) => s.isLoadingContacts);
  const error = useCommunicationsStore((s) => s.error);

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.department?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.employeeCode?.toLowerCase().includes(term),
    );
  }, [contacts, search]);

  const missingEmail = contacts.filter((c) => !c.email).length;
  const missingPhone = contacts.filter((c) => !c.phone).length;

  return (
    <div className="glass glass-card mt-4">
      <div className="glass-content">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="relative w-64 max-w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              className="glass-input w-full pl-8"
              placeholder="Search name, department, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs text-white/40">
              {contactsTotal} enrolled · {missingEmail} missing email ·{" "}
              {missingPhone} missing phone
            </p>
            <button
              onClick={fetchContacts}
              className="glass glass-btn glass-btn--ghost glass-btn--sm flex items-center gap-1.5"
            >
              <RefreshCw
                size={14}
                className={isLoadingContacts ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#18181b]">
              <tr className="text-left text-white/40 text-xs border-b border-white/10">
                <th className="pb-2 pr-3 font-medium">Name</th>
                <th className="pb-2 pr-3 font-medium">Code</th>
                <th className="pb-2 pr-3 font-medium">Department</th>
                <th className="pb-2 pr-3 font-medium">Email</th>
                <th className="pb-2 pr-3 font-medium">Phone</th>
                <th className="pb-2 pr-3 font-medium">TMS account</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.employeeCode} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white">{c.name}</td>
                  <td className="py-2 pr-3 text-white/50">{c.employeeCode}</td>
                  <td className="py-2 pr-3 text-white/60">{c.department}</td>
                  <td className="py-2 pr-3">
                    {c.email ? (
                      <span className="flex items-center gap-1.5 text-white/70">
                        <Mail size={12} className="text-white/30" />
                        {c.email}
                      </span>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {c.phone ? (
                      <span className="flex items-center gap-1.5 text-white/70">
                        <Phone size={12} className="text-white/30" />
                        {c.phone}
                      </span>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {c.hasAccount ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                        <ShieldCheck size={12} />
                        {c.role || "active"}
                      </span>
                    ) : (
                      <span className="text-white/25 text-xs">no account</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !isLoadingContacts && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-white/40">
                    No employees match "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
