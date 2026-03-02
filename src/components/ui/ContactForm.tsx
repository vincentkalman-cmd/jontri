"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";

interface FormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  function validate(): boolean {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    console.log("Form submitted:", formData);
    setSubmitted(true);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl bg-bg-card border border-border p-8 text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h3 className="text-2xl font-bold text-accent mb-2">Thank You!</h3>
        <p className="text-text-secondary">
          We&apos;ll be in touch within 24 hours.
        </p>
      </div>
    );
  }

  const inputClasses =
    "w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
          Name <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your name"
          className={inputClasses}
          aria-required="true"
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-sm text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
          Email <span className="text-accent">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@company.com"
          className={inputClasses}
          aria-required="true"
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1 text-sm text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-1.5">
          Company
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Your company (optional)"
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-1.5">
          Message <span className="text-accent">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us about your business and what you're looking to achieve..."
          rows={5}
          className={`${inputClasses} resize-none`}
          aria-required="true"
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <p id="message-error" role="alert" className="mt-1 text-sm text-red-400">
            {errors.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Send Message
      </Button>
    </form>
  );
}
