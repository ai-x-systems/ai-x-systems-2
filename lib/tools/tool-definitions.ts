/**
 * OpenAI-compatible function/tool definitions. Both Vapi (voice) and Groq
 * (web chat) accept this exact shape, so it's defined once and reused by
 * lib/voice/providers/vapi/assistant-config.ts and
 * app/api/chat/[businessId]/route.ts.
 */
export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "book_appointment",
      description:
        "Book an appointment once the caller/visitor has confirmed a service, day, and time.",
      parameters: {
        type: "object",
        properties: {
          callerName: { type: "string" },
          callerPhone: { type: "string" },
          serviceId: {
            type: "string",
            description:
              "The service's internal id shown as [serviceId: ...] next to each service in the system prompt — not the service's display name.",
          },
          preferredStartTimeISO: {
            type: "string",
            description: "ISO 8601 datetime in the business's local timezone.",
          },
        },
        required: ["callerName", "callerPhone", "serviceId", "preferredStartTimeISO"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "save_confirmation_email",
      description:
        "Save the caller's email so a booking confirmation can be sent, after book_appointment has already succeeded. Never use this to create or modify a booking — it only records an email address for an existing confirmed appointment.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "The caller's email address." },
          serviceName: {
            type: "string",
            description: "The display name of the already-booked service (not the serviceId).",
          },
          confirmedStartTimeISO: {
            type: "string",
            description: "The confirmedStartTimeISO returned by the earlier book_appointment call.",
          },
        },
        required: ["email"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "log_lead",
      description:
        "Record contact info and reason for reaching out when not booking directly.",
      parameters: {
        type: "object",
        properties: {
          callerName: { type: "string" },
          callerPhone: { type: "string" },
          reason: { type: "string" },
        },
        required: ["callerName", "reason"],
      },
    },
  },
];
