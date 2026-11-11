import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";

const scheduleInput = {
  trainLine: "Kizuna Main Line",
  trainNumber: "KZ101",
  departureStation: "Nagoya Station",
  arrivalStation: "Toyama Station",
  departureTime: "08:30",
  arrivalTime: "13:00",
  price: 5200,
};

describe("Schedules API", () => {
  test("creates a schedule and returns it in the schedule list", async () => {
    const createResponse = await request(app)
      .post("/api/schedules")
      .send(scheduleInput);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject(scheduleInput);

    const listResponse = await request(app).get("/api/schedules");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: createResponse.body._id,
          trainNumber: "KZ101",
        }),
      ])
    );
  });

  test("gets, updates, and deletes a schedule by ID", async () => {
    const createResponse = await request(app)
      .post("/api/schedules")
      .send(scheduleInput);
    const { _id } = createResponse.body;

    const getResponse = await request(app).get(`/api/schedules/${_id}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.trainLine).toBe(scheduleInput.trainLine);

    const updateResponse = await request(app)
      .patch(`/api/schedules/${_id}`)
      .send({ price: 6100 });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.price).toBe(6100);

    const deleteResponse = await request(app).delete(`/api/schedules/${_id}`);
    expect(deleteResponse.status).toBe(204);

    const missingResponse = await request(app).get(`/api/schedules/${_id}`);
    expect(missingResponse.status).toBe(404);
  });

  test("rejects schedules missing required fields", async () => {
    const response = await request(app)
      .post("/api/schedules")
      .send({ trainLine: "Kizuna Main Line" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("rejects an invalid schedule ID", async () => {
    const response = await request(app).get("/api/schedules/not-an-id");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid schedule ID" });
  });
});
