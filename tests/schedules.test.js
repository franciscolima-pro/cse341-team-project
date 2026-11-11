import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";

const scheduleInput = {
  tripId: "alpine-panorama",
  departureTime: "08:30",
  arrivalTime: "13:00",
  daysOfWeek: ["monday", "tuesday"],
  status: true,
};

describe("Schedules API", () => {
  test("returns schedules in the seed-data format", async () => {
    const response = await request(app).get("/api/schedules");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          tripId: "alpine-panorama",
          departureTime: "08:30",
          arrivalTime: "13:00",
          daysOfWeek: expect.arrayContaining(["monday", "tuesday"]),
          status: true,
        }),
      ])
    );
  });

  test("creates a schedule and returns it in the list", async () => {
    const createResponse = await request(app)
      .post("/api/schedules")
      .send(scheduleInput);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject(scheduleInput);

    const listResponse = await request(app).get("/api/schedules");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toContainEqual(
      expect.objectContaining({
        _id: createResponse.body._id,
        ...scheduleInput,
      })
    );
  });

  test("replaces a schedule with PUT and partially updates it with PATCH", async () => {
    const createResponse = await request(app)
      .post("/api/schedules")
      .send({ id: 20, ...scheduleInput });
    const { _id } = createResponse.body;

    const partialPutResponse = await request(app)
      .put(`/api/schedules/${_id}`)
      .send({ status: false });
    expect(partialPutResponse.status).toBe(400);

    const replacement = {
      id: 20,
      tripId: "coastal-breeze",
      departureTime: "09:00",
      arrivalTime: "14:00",
      daysOfWeek: ["friday"],
      status: false,
    };
    const putResponse = await request(app)
      .put(`/api/schedules/${_id}`)
      .send(replacement);

    expect(putResponse.status).toBe(200);
    expect(putResponse.body).toMatchObject(replacement);

    const patchResponse = await request(app)
      .patch(`/api/schedules/${_id}`)
      .send({ status: true });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body).toMatchObject({
      ...replacement,
      status: true,
    });
  });

  test("returns the deleted schedule as JSON and then reports it missing", async () => {
    const createResponse = await request(app)
      .post("/api/schedules")
      .send(scheduleInput);
    const { _id } = createResponse.body;

    const deleteResponse = await request(app).delete(`/api/schedules/${_id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toMatchObject(scheduleInput);

    const missingResponse = await request(app).get(`/api/schedules/${_id}`);
    expect(missingResponse.status).toBe(404);
    expect(missingResponse.body).toEqual({ error: "Schedule not found" });
  });

  test("rejects invalid fields and invalid schedule IDs as JSON", async () => {
    const invalidSchedule = await request(app)
      .post("/api/schedules")
      .send({ ...scheduleInput, departureTime: "tomorrow" });
    const unsupportedField = await request(app)
      .post("/api/schedules")
      .send({ ...scheduleInput, price: 5200 });
    const invalidId = await request(app).get("/api/schedules/not-an-id");

    expect(invalidSchedule.status).toBe(400);
    expect(invalidSchedule.body).toHaveProperty("error");
    expect(unsupportedField.status).toBe(400);
    expect(unsupportedField.body).toHaveProperty("error");
    expect(invalidId.status).toBe(400);
    expect(invalidId.body).toEqual({ error: "Invalid schedule ID" });
  });

  test("returns malformed JSON errors as JSON for API routes", async () => {
    const response = await request(app)
      .post("/api/schedules")
      .set("Content-Type", "application/json")
      .send('{"tripId":');

    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toHaveProperty("error");
  });
});
