import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Rate } from "k6/metrics";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:5262";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEwYzdiMWM0LTBlNzItNDQ0OS05MzNhLTUzMzNhZGVlZWQ4MCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJtb3VyYWQ4OCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6InVzZXIiLCJleHAiOjE3ODE1Mjc5ODN9.jWWfyET7Ds6z6mtN1Bg6pAyLkYJYtGrwlgGljykBy74"; // paste your hardcoded token// ─────────────────────────────────────────────────────────────────────────────

const noFilterDuration = new Trend("no_filter_duration", true);
const categoryDuration = new Trend("category_duration", true);
const errorRate = new Rate("error_rate");

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "30s", target: 10 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "10s", target: 2 },
  ],

  // Metrics shown in final summary
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],

  thresholds: {
    // only keep error-rate restriction
    error_rate: ["rate<0.01"],
  },
};

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

export default function () {
  // No filter
  const r1 = http.get(
    `${BASE_URL}/api/events/getAllEvents?pageNumber=1&pageSize=10`,
    { headers },
  );

  check(r1, {
    "no filter → 200": (r) => r.status === 200,
  });

  noFilterDuration.add(r1.timings.duration);
  errorRate.add(r1.status !== 200);

  sleep(0.5);

  // Category filter
  const r2 = http.get(
    `${BASE_URL}/api/events/getAllEvents?category=music&pageNumber=1&pageSize=10`,
    { headers },
  );

  check(r2, {
    "category filter → 200": (r) => r.status === 200,
  });

  categoryDuration.add(r2.timings.duration);
  errorRate.add(r2.status !== 200);

  sleep(0.5);
}
