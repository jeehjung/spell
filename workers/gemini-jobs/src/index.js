import { WorkflowEntrypoint, WorkerEntrypoint } from "cloudflare:workers";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

export class GeminiJobWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const { apiKey, model, payload } = event.payload;
    return await step.do("Call Gemini", {
      retries: { limit: 2, delay: "5 seconds", backoff: "exponential" },
      timeout: "15 minutes",
      sensitive: "output",
    }, async () => {
      const response = await fetch(
        GEMINI_API_BASE + encodeURIComponent(model) + ":generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(payload),
        },
      );
      const raw = await response.text();
      let body;
      try { body = JSON.parse(raw); }
      catch { body = { error: { message: raw.slice(0, 4000) } }; }
      return { httpStatus: response.status, body };
    });
  }
}

export default class GeminiJobsService extends WorkerEntrypoint {
  async fetch() {
    return new Response("Not found", { status: 404 });
  }

  async createJob({ id, apiKey, model, payload }) {
    try {
      const existing = await this.env.GEMINI_WORKFLOW.get(id);
      const state = await existing.status();
      if (state.status === "errored" || state.status === "terminated") {
        await existing.delete();
      } else {
        return { id, status: state.status };
      }
    } catch {
      // No existing instance for this ID.
    }
    try {
      const instance = await this.env.GEMINI_WORKFLOW.create({
        id,
        params: { apiKey, model, payload },
        retention: { successRetention: "10 minutes", errorRetention: "10 minutes" },
      });
      return { id: instance.id, status: (await instance.status()).status };
    } catch {
      const existing = await this.env.GEMINI_WORKFLOW.get(id);
      return { id, status: (await existing.status()).status };
    }
  }

  async getJob(id, acknowledge = false) {
    const instance = await this.env.GEMINI_WORKFLOW.get(id);
    const state = await instance.status();
    const result = {
      jobId: id,
      status: state.status,
      output: state.output || null,
      error: state.error || null,
    };
    if (acknowledge && (state.status === "complete" || state.status === "errored" || state.status === "terminated")) {
      try { await instance.delete(); }
      catch { /* Ten-minute instance retention is the cleanup fallback. */ }
    }
    return result;
  }
}
