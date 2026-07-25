import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Rate } from "k6/metrics";

const BASE_URL = __ENV.TAZKARTI_BASE_URL || "http://localhost:5262";
const TOKEN = __ENV.TAZKARTI_JWT;

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
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
  thresholds: {
    error_rate: ["rate<0.01"],
  },
};

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

export default function () {
  if (!TOKEN) {
    throw new Error("Set TAZKARTI_JWT before running this load test.");
  }

  const r1 = http.get(
    `${BASE_URL}/api/events/getAllEvents?pageNumber=1&pageSize=10`,
    { headers },
  );

  check(r1, {
    "no filter returns 200": (r) => r.status === 200,
  });

  noFilterDuration.add(r1.timings.duration);
  errorRate.add(r1.status !== 200);

  sleep(0.5);

  const r2 = http.get(
    `${BASE_URL}/api/events/getAllEvents?category=music&pageNumber=1&pageSize=10`,
    { headers },
  );

  check(r2, {
    "category filter returns 200": (r) => r.status === 200,
  });

  categoryDuration.add(r2.timings.duration);
  errorRate.add(r2.status !== 200);

  sleep(0.5);
}
