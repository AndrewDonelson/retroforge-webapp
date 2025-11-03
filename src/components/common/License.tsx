"use client";

import { useState, useEffect } from "react";

interface ContactInfo {
  type: "contact";
  email: string;
  website: string;
}

interface ListContent {
  type: "list";
  items: string[];
}

interface Section {
  id: string;
  heading: string;
  content: (string | ListContent)[];
}

interface License {
  title: string;
  lastUpdated: string;
  introduction: {
    heading: string;
    content: string[];
  };
  sections: Section[];
  contact: {
    heading: string;
    content: (string | ContactInfo)[];
  };
  footer: {
    text: string;
    company: string;
    rights: string;
  };
}

export default function License() {
  const [license, setLicense] = useState<License | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch license data
  useEffect(() => {
    fetch("/json/license.json")
      .then((res) => res.json())
      .then((data) => {
        // Simple template variable replacement
        const processed = JSON.parse(
          JSON.stringify(data)
            .replace(/{APP_NAME}/g, "RetroForge")
            .replace(/{APP_URL}/g, "https://retroforge.nlaak.com")
            .replace(/{COMPANY_NAME}/g, "Nlaak Studios")
            .replace(/{COMPANY_COPYRIGHT}/g, "Nlaak Studios")
            .replace(/{APP_EMAIL_PRIVACY}/g, "nlaakstudios@pm.me")
        );
        setLicense(processed);
      })
      .catch(() => setError("Failed to load license"));
  }, []);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-gray-300">Loading license...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 relative min-h-screen">
      {/* Main Card */}
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="text-center space-y-2 mb-8 border-b border-gray-700 bg-gray-700/50 px-6 py-8">
          <h1 className="text-3xl font-bold text-retro-400">{license.title}</h1>
          <p className="text-sm text-gray-400">
            Last Updated: {license.lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 px-6 py-6 max-h-[70vh] overflow-y-auto">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-retro-400">
              {license.introduction.heading}
            </h2>
            {license.introduction.content.map((paragraph, idx) => (
              <p key={idx} className="mb-4 text-gray-300">
                {paragraph}
              </p>
            ))}
          </section>

          <div className="border-t border-gray-700 my-8"></div>

          {/* Main Sections */}
          {license.sections.map((section, sectionIdx) => (
            <section key={section.id} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-retro-400">
                {section.heading}
              </h2>
              {section.content.map((content, contentIdx) => {
                if (typeof content === "string") {
                  if (content.trim() === "") {
                    return <br key={contentIdx} />;
                  }
                  return (
                    <p
                      key={contentIdx}
                      className={`mb-4 ${
                        contentIdx === 0 &&
                        section.id === "mit-license" &&
                        content.includes("Copyright")
                          ? "text-retro-400 font-semibold"
                          : "text-gray-300"
                      } ${
                        section.id === "mit-license" &&
                        content.includes("THE SOFTWARE")
                          ? "font-mono text-sm bg-gray-900/50 p-3 rounded border border-gray-700"
                          : ""
                      }`}
                    >
                      {content}
                    </p>
                  );
                } else if (content.type === "list") {
                  return (
                    <ul
                      key={contentIdx}
                      className="list-disc pl-6 mb-4 space-y-2"
                    >
                      {content.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-gray-300">
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return null;
              })}
            </section>
          ))}

          {/* Contact Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-retro-400">
              {license.contact.heading}
            </h2>
            {license.contact.content.map((content, idx) => {
              if (typeof content === "string") {
                return (
                  <p key={idx} className="mb-4 text-gray-300">
                    {content}
                  </p>
                );
              } else if (content.type === "contact") {
                return (
                  <div key={idx} className="space-y-2">
                    <p className="text-gray-300">
                      Email:{" "}
                      <a
                        href={`mailto:${content.email}`}
                        className="text-retro-400 hover:text-retro-300 underline"
                      >
                        {content.email}
                      </a>
                    </p>
                    <p className="text-gray-300">
                      Website:{" "}
                      <a
                        href={content.website}
                        className="text-retro-400 hover:text-retro-300 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {content.website}
                      </a>
                    </p>
                  </div>
                );
              }
              return null;
            })}
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-col space-y-4 text-center border-t border-gray-700 bg-gray-700/50 p-6">
          <p className="text-sm text-gray-300">{license.footer.text}</p>
          <p className="text-sm font-semibold text-white">
            {license.footer.company} - {license.footer.rights}
          </p>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 rounded-full shadow-lg transition-all duration-300 p-3 bg-gray-700 hover:bg-gray-600 text-white ${
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
  );
}

