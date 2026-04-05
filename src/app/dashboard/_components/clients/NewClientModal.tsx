"use client";

import { useState } from "react";

interface NewClientModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const inputClasses =
  "w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export default function NewClientModal({
  onClose,
  onCreated,
}: NewClientModalProps) {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          industry: form.industry,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          description: form.description,
        }),
      });

      if (res.ok) {
        onCreated();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create client.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h2 className="text-lg font-bold text-text-primary mb-4">
          New Client
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/30 bg-red-400/5 px-3 py-2">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className={inputClasses}
                placeholder="ABC Plumbing"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Industry <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={form.industry}
                onChange={(e) =>
                  setForm((p) => ({ ...p, industry: e.target.value }))
                }
                className={inputClasses}
                placeholder="e.g., HVAC, Plumbing"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Contact Name
              </label>
              <input
                value={form.contactName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactName: e.target.value }))
                }
                className={inputClasses}
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactEmail: e.target.value }))
                }
                className={inputClasses}
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Contact Phone
            </label>
            <input
              value={form.contactPhone}
              onChange={(e) =>
                setForm((p) => ({ ...p, contactPhone: e.target.value }))
              }
              className={inputClasses}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Description
            </label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className={inputClasses}
              placeholder="Brief description of the business"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary text-sm hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
