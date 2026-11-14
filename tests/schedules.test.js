import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";

const scheduleFixtures = [
  {
    id: 101,
    tripId: 42,
    departureTime: "08:30",
    arrivalTime: "13:00",
    daysOfWeek: ["Mon", "Tue"],
    months: [4, 5],
    status: "active",
  },
  {
    id: 102,
    tripId: 42,
    departureTime: "13:15",
    arrivalTime: "17:45",
    daysOfWeek: ["Wed", "Thu"],
    months: [6, 7],
    status: "active",
  },
];

describe("Trip schedules API", () => {
  test("renders trip details with client-side schedule controls", async () => {
    const response = await request(app).get("/trips/alpine-panorama");

    expect(response.status).toBe(200);
    expect(response.text).toContain('data-trip-id="alpine-panorama"');
    expect(response.text).toContain('data-schedule-month="4"');
    expect(response.text).toContain('data-schedule-month="11"');
    expect(response.text).toContain("data-schedules-grid");
    expect(response.text).not.toContain('class="schedule-card"');
  });

  test("renders filter buttons for winter trip operating months", async () => {
    const response = await request(app).get("/trips/winter-wetlands");

    expect(response.status).toBe(200);
    expect(response.text).toContain('data-schedule-month="1"');
    expect(response.text).toContain('data-schedule-month="2"');
    expect(response.text).not.toContain('data-schedule-month="4"');
  });

  test("returns schedules for a trip", async () => {
    await getDb().collection("schedules").insertMany(scheduleFixtures);

    const response = await request(app).get("/api/trips/42/schedules");

    expect(response.status).toBe(200);
    expect(response.body.map(({ id }) => id)).toEqual([101, 102]);
  });

  test("filters a trip's schedules by month", async () => {
    await getDb().collection("schedules").insertMany(scheduleFixtures);

    const response = await request(app).get(
      "/api/trips/42/schedules?month=4"
    );

    expect(response.status).toBe(200);
    expect(response.body.map(({ id }) => id)).toEqual([101]);
  });

  test("filters legacy trip schedules using their individual months", async () => {
    const earlySeasonResponse = await request(app).get(
      "/api/trips/alpine-panorama/schedules?month=4"
    );
    const lateSeasonResponse = await request(app).get(
      "/api/trips/alpine-panorama/schedules?month=9"
    );

    expect(earlySeasonResponse.status).toBe(200);
    expect(earlySeasonResponse.body.map(({ id }) => id)).toEqual([1]);
    expect(lateSeasonResponse.status).toBe(200);
    expect(lateSeasonResponse.body.map(({ id }) => id)).toEqual([2]);
  });

  test("returns winter-wetlands schedules for winter operating months", async () => {
    const januaryResponse = await request(app).get(
      "/api/trips/winter-wetlands/schedules?month=1"
    );
    const februaryResponse = await request(app).get(
      "/api/trips/winter-wetlands/schedules?month=2"
    );

    expect(januaryResponse.status).toBe(200);
    expect(januaryResponse.body.map(({ id }) => id)).toEqual([10]);
    expect(februaryResponse.status).toBe(200);
    expect(februaryResponse.body.map(({ id }) => id)).toEqual([10]);
  });

  test("returns status 500 when the month cannot be queried", async () => {
    const response = await request(app).get(
      "/api/trips/alpine-panorama/schedules?month=not-a-month"
    );

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error");
  });
});
