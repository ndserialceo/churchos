"use client";

import { useEffect, useState } from "react";

type Communication = {
  id: string;
  type: "SMS" | "WHATSAPP" | "EMAIL";
  recipient: string;
  subject: string | null;
  message: string;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt: string | null;
  createdAt: string;
  member: { id: string; firstName: string; lastName: string } | null;
  sentBy: { name: string };
};

type Member = { id: string; firstName: string; lastName: string; phone: string };

const typeBadge: Record<string, string> = {
  SMS: "bg-blue-100 text-blue-800",
  WHATSAPP: "bg-green-100 text-green-800",
  EMAIL: "bg-purple-100 text-purple-800",
};

const statusBadge: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function CommunicationPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [type, setType] = useState<"SMS" | "WHATSAPP" | "EMAIL">("SMS");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchMembers() {
      const res = await fetch("/api/members?limit=500");
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setMembers(data.members || data);
      }
    }
    async function fetchCommunications() {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      try {
        const res = await fetch(`/api/communications?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setCommunications(data.communications);
            setTotalPages(data.totalPages);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMembers();
    fetchCommunications();
    return () => { cancelled = true };
  }, [page, filterType, filterStatus]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const body: Record<string, unknown> = { type, message };
    if (selectedMembers.length > 0) {
      body.memberIds = selectedMembers;
    } else {
      body.recipient = recipient;
    }
    if (type === "EMAIL" && subject) body.subject = subject;

    const res = await fetch("/api/communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setMessage("");
      setSubject("");
      setRecipient("");
      setSelectedMembers([]);
    }
    setSending(false);
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Compose Message</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "SMS" | "WHATSAPP" | "EMAIL")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(m.id)}
                        onChange={() => toggleMember(m.id)}
                        className="rounded text-blue-600"
                      />
                      {m.firstName} {m.lastName}
                    </label>
                  ))}
                  {members.length === 0 && <p className="text-gray-500 text-xs">No members found</p>}
                </div>
                {selectedMembers.length === 0 && (
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Or enter phone/email manually"
                    className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              {type === "EMAIL" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending || (!recipient && selectedMembers.length === 0) || !message}
                className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-800">History</h2>
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value="">All Types</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {loading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : communications.length === 0 ? (
              <p className="text-gray-500 text-sm">No communications found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="pb-2 font-medium">Recipient</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Message</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {communications.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4">{c.recipient}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[c.type]}`}>{c.type}</span>
                        </td>
                        <td className="py-2 pr-4 max-w-[200px] truncate">{c.message}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[c.status]}`}>{c.status}</span>
                        </td>
                        <td className="py-2 text-gray-500 text-xs whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
